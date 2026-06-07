// hooks/useDashboardData.js

import { useState, useEffect } from "react";
import { dashboardAPI } from "/src/services/api";
import { getAssetUrl } from "../../services/api";
export function useDashboardData() {
  const [events, setEvents] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchDashboardContent() {
      try {
        setLoading(true);
        setError(null);

        const [eventsResponse, templatesResponse] = await Promise.all([
          dashboardAPI.getEvents(),
          dashboardAPI.getTemplates(),
        ]);
        const hydratedTemplates = templatesResponse.templates.map(
          (template) => ({
            ...template,
            banner_url: getAssetUrl(template.banner_url),
          }),
        );
        const hydratedEvents = eventsResponse.events.map((event) => ({
          ...event,
          banner_url: getAssetUrl(event.banner_url),
        }));

        setEvents(hydratedEvents);
        setTemplates(hydratedTemplates);
      } catch (err) {
        console.error("Dashboard synchronization failure:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardContent();
  }, []);

  return { events, templates, loading, error };
}
