import { useState, useCallback, useMemo } from "react";
import { EventContext } from "./EventContext";
import { editorAPI, getAssetUrl } from "/src/services/api";

const INITIAL_STATE = {
  id: null,
  title: "",
  banner_url: "",

  data: {
    type: "",
    theme: "",
    budget: 0,
    guest_count: 0,
    progress_percentage: 0,
    status: "Planning",
    timezone: "",
    startDateTime: "",
    endDateTime: "",
    venueName: "",
    venueAddress: "",
    currency: "INR",
    notes: "",
  },

  flow: {},
};

export const EventProvider = ({ children }) => {
  const [formData, setFormData] = useState(INITIAL_STATE);

  const [availableCategories, setAvailableCategories] = useState([]);
  const [availableVendors, setAvailableVendors] = useState([]);

  const [contextLoading, setContextLoading] = useState(false);
  const [contextError, setContextError] = useState(null);

  const resetForm = useCallback(() => setFormData(INITIAL_STATE), []);

  const uploadAndSetBanner = async (eventId, file) => {
    try {
      const result = await editorAPI.uploadEventBanner(eventId, file);

      const newUrl = result.data?.banner_url || result.banner_url;

      setFormData((prev) => ({
        ...prev,
        banner_url: getAssetUrl(newUrl),
      }));

      return newUrl;
    } catch (error) {
      console.error("Context layer file stream sync failed:", error);
      throw error;
    }
  };

  const loadEvent = useCallback(async (eventId) => {
    if (!eventId) return null;

    setContextLoading(true);
    setContextError(null);

    try {
      const [eventResponse, categoriesResponse, vendorsResponse] =
        await Promise.all([
          editorAPI.getEventById(eventId),
          editorAPI.getCategories(),
          editorAPI.getVendors(),
        ]);
      const eventData = eventResponse.event || eventResponse;
      const categoriesData =
        categoriesResponse.categories || categoriesResponse || [];
      const vendorsData = vendorsResponse.vendors || vendorsResponse || [];

      setAvailableCategories(categoriesData);
      setAvailableVendors(vendorsData);

      const targetBanner = eventData.banner_url || eventData.image || "";
      const hydratedRecord = {
        ...eventData,
        banner_url: getAssetUrl(targetBanner),
      };

      setFormData({
        ...INITIAL_STATE,
        id: hydratedRecord.id || null,
        title: hydratedRecord.title || "",
        banner_url: hydratedRecord.banner_url || "",
        data: {
          ...INITIAL_STATE.data,
          ...(hydratedRecord.data || {}),
        },
        flow: {
          ...INITIAL_STATE.flow,
          ...(hydratedRecord.flow || {}),
        },
      });

      return hydratedRecord;
    } catch (err) {
      console.error("Context data execution failure:", err);
      setContextError(err);
      throw err;
    } finally {
      setContextLoading(false);
    }
  }, []);

  const updateFormData = useCallback((section, keyOrValue, directValue) => {
    setFormData((prev) => {
      if (
        directValue === undefined &&
        typeof keyOrValue === "object" &&
        keyOrValue !== null
      ) {
        if (section === "flow") {
          return { ...prev, flow: keyOrValue };
        }
        const currentSection =
          typeof prev[section] === "object" ? prev[section] : {};
        return { ...prev, [section]: { ...currentSection, ...keyOrValue } };
      }

      if (!keyOrValue) {
        return { ...prev, [section]: directValue };
      }

      const currentSection =
        typeof prev[section] === "object" ? prev[section] : {};
      return {
        ...prev,
        [section]: { ...currentSection, [keyOrValue]: directValue },
      };
    });
  }, []);

  const onUpdate = useCallback((newData) => {
    if (!newData) return;

    const unpacked = newData.event || newData;

    setFormData((prev) => {
      const nextState = { ...prev, ...unpacked };

      // 1. Sync and clean "data"
      if (unpacked.data) {
        const currentData = prev.data || {};
        const updatedData = { ...currentData };

        if (unpacked.banner_url || unpacked.image) {
          const incomingBanner = unpacked.banner_url || unpacked.image;
          nextState.banner_url = getAssetUrl(incomingBanner);
        }

        // Process every key present in the incoming data payload
        Object.entries(unpacked.data).forEach(([key, value]) => {
          if (value === null) {
            delete updatedData[key]; // Explicit removal command
          } else {
            updatedData[key] = value; // Update or add value
          }
        });

        nextState.data = updatedData;
      }

      // 2. Sync and clean "flow"
      if (unpacked.flow) {
        const currentFlow = prev.flow || {};
        const updatedFlow = { ...currentFlow };

        Object.entries(unpacked.flow).forEach(([key, value]) => {
          const shouldDelete =
            value === null ||
            value === undefined ||
            (Array.isArray(value) && value.length === 0);

          if (shouldDelete) {
            delete updatedFlow[key]; // Explicit removal command
          } else {
            updatedFlow[key] = value; // Update or add value
          }
        });

        nextState.flow = updatedFlow;
      }

      return nextState;
    });
  }, []);

  const sendWorkspaceMessage = useCallback(
    async (eventId, messageText) => {
      if (!eventId || !messageText) return "";

      try {
        const response = await editorAPI.think(eventId, messageText);
        const payload = response?.data || response;

        if (payload?.updated_state) {
          onUpdate(payload.updated_state);
        }

        return payload?.content || "";
      } catch (err) {
        console.error("Generative AI synchronization step failed:", err);
        throw err;
      }
    },
    [onUpdate],
  );

  const saveEvent = useCallback(
    async (eventId, updates) => {
      if (!eventId) throw new Error("No event ID provided to save.");
      if (!updates || Object.keys(updates).length === 0) return;

      setContextLoading(true);
      setContextError(null);

      try {
        const response = await editorAPI.patchEvent(eventId, updates);
        onUpdate(response);
        return response;
      } catch (err) {
        console.error("Critical failure during persistence:", err);
        setContextError(err);
        throw err;
      } finally {
        setContextLoading(false);
      }
    },
    [onUpdate],
  );

  const contextValue = useMemo(
    () => ({
      formData,
      uploadAndSetBanner,
      availableCategories,
      availableVendors,
      contextLoading,
      contextError,
      resetForm,
      updateFormData,
      onUpdate,
      loadEvent,
      saveEvent,
      sendWorkspaceMessage,
    }),
    [
      formData,
      availableCategories,
      availableVendors,
      contextLoading,
      contextError,
      resetForm,
      updateFormData,
      onUpdate,
      loadEvent,
      saveEvent,
      sendWorkspaceMessage,
    ],
  );

  return (
    <EventContext.Provider value={contextValue}>
      {children}
    </EventContext.Provider>
  );
};
