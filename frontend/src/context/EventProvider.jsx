import { useState } from "react";

import { EventContext } from "./EventContext";

const INITIAL_STATE = {
  title: "",
  type: "",
  startDateTime: "",
  endDateTime: "",
  venueName: "",
  venueAddress: "",
  expectedGuests: "",
  currency: "",
  notes: "",
  schedule: [],
  budget: {},
  vendors: {},
  checklist: [],
};

export const EventProvider = ({ children }) => {
  const [formData, setFormData] = useState(INITIAL_STATE);
  const resetForm = () => setFormData(INITIAL_STATE);

  const updateFormData = (section, fieldOrValue, maybeValue) => {
    setFormData((prev) => {
      if (maybeValue === undefined) {
        return { ...prev, [section]: fieldOrValue };
      }

      return {
        ...prev,
        [section]: {
          ...prev[section],
          [fieldOrValue]: maybeValue,
        },
      };
    });
  };

  const onUpdate = (newData) => {
    if (!newData) return;

    setFormData((prev) => ({
      ...prev,
      ...newData,
    }));
  };

  return (
    <EventContext.Provider
      value={{ formData, resetForm, updateFormData, onUpdate }}
    >
      {children}
    </EventContext.Provider>
  );
};
