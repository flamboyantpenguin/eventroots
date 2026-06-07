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

    startDateTime: "",
    endDateTime: "",
    venueName: "",
    venueAddress: "",
    currency: "INR",
    notes: "",
  },

  flow: {
    sequence: [],
  },
};

export const EventProvider = ({ children }) => {
  const [formData, setFormData] = useState(INITIAL_STATE);
  const [contextLoading, setContextLoading] = useState(false);
  const [contextError, setContextError] = useState(null);

  const resetForm = useCallback(() => setFormData(INITIAL_STATE), []);

  const loadEvent = useCallback(async (eventId) => {
    if (!eventId) return null;

    setContextLoading(true);
    setContextError(null);

    try {
      const response = await editorAPI.getEventById(eventId);
      const eventData = response.event || response;

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
      if (directValue === undefined && typeof keyOrValue !== "object") {
        return {
          ...prev,
          [section]: keyOrValue,
        };
      }

      if (directValue === undefined && typeof keyOrValue === "object") {
        return {
          ...prev,
          [section]: {
            ...(typeof prev[section] === "object" ? prev[section] : {}),
            ...keyOrValue,
          },
        };
      }

      if (!keyOrValue) {
        return {
          ...prev,
          [section]: directValue,
        };
      }

      return {
        ...prev,
        [section]: {
          ...(typeof prev[section] === "object" ? prev[section] : {}),
          [keyOrValue]: directValue,
        },
      };
    });
  }, []);

  const onUpdate = useCallback((newData) => {
    if (!newData) return;

    const unpacked = newData.event || newData;

    setFormData((prev) => {
      const nextState = {
        ...prev,
        ...unpacked,
      };

      if (unpacked.data) {
        const incomingData = { ...unpacked.data };

        Object.keys(incomingData).forEach((key) => {
          if (incomingData[key] === null) {
            delete incomingData[key];
          }
        });
        nextState.data = {
          ...(prev.data || {}),
          ...incomingData,
        };

        Object.keys(prev.data || {}).forEach((key) => {
          if (!(key in incomingData) && incomingData[key] === undefined) {
            delete nextState.data[key];
          }
        });
      }

      if (unpacked.flow) {
        nextState.flow = {
          ...(prev.flow || {}),
          ...unpacked.flow,
        };
      }

      return nextState;
    });
  }, []);

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
      contextLoading,
      contextError,
      resetForm,
      updateFormData,
      onUpdate,
      loadEvent,
      saveEvent,
    }),
    [
      formData,
      contextLoading,
      contextError,
      resetForm,
      updateFormData,
      onUpdate,
      loadEvent,
      saveEvent,
    ],
  );

  return (
    <EventContext.Provider value={contextValue}>
      {children}
    </EventContext.Provider>
  );
};
