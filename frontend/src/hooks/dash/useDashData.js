import { useState, useCallback } from "react";
import { dashboardAPI } from "/src/services/api";
import { getAssetUrl } from "../../services/api";

export function useDashboardData() {
  const [events, setEvents] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  function hydrateAssetPaths(item) {
    if (!item) return null;

    const targetAsset = item.banner_url || item.image || "";
    const fullyQualifiedUrl = getAssetUrl(targetAsset);

    return {
      ...item,
      banner_url: fullyQualifiedUrl,
      image: fullyQualifiedUrl,
    };
  }

  // Fetch Logic moved outside useEffect so we can call it again if we want an absolute hard refresh
  const fetchDashboardContent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [eventsResponse, templatesResponse] = await Promise.all([
        dashboardAPI.getEvents(),
        dashboardAPI.getTemplates(),
      ]);

      console.log(eventsResponse);

      const hydratedTemplates = (templatesResponse?.templates || []).map(
        hydrateAssetPaths,
      );
      const hydratedEvents = (eventsResponse?.events || []).map(
        hydrateAssetPaths,
      );

      setEvents(hydratedEvents);
      setTemplates(hydratedTemplates);
    } catch (err) {
      console.error("Dashboard synchronization failure:", err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createEventFromTemplate = useCallback(async (templateId) => {
    setError(null);
    try {
      const response = await dashboardAPI.createEventFromTemplate(templateId);

      const newEvent = hydrateAssetPaths(response.event || response);

      setEvents((currentEvents) => [newEvent, ...currentEvents]);

      return newEvent;
    } catch (err) {
      console.error(
        "Failed to construct event instantiation node payload:",
        err,
      );
      setError(err);
      throw err;
    }
  }, []);

  return {
    events,
    templates,
    loading,
    error,
    createEventFromTemplate,
    refreshDashboard: fetchDashboardContent,
  };
}
