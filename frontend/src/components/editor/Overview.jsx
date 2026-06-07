import { useRef, useState, useCallback } from "react";
import { useEventContext } from "/src/hooks/event/useEventContext";
import {
  DeleteForeverOutlined,
  AccountBalanceWalletOutlined,
} from "@mui/icons-material";
import "./Overview.css";

export const useDebounce = (callback, delay) => {
  const timeoutRef = useRef(null);

  const debouncedCallback = useCallback(
    (...args) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => callback(...args), delay);
    },
    [callback, delay],
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return [debouncedCallback, cancel];
};

export function Overview() {
  const { formData, updateFormData, saveEvent } = useEventContext();
  const eventData = formData.data || {};

  const staticKeys = [
    "type",
    "theme",
    "budget",
    "guest_count",
    "progress_percentage",
    "status",
    "startDateTime",
    "endDateTime",
    "venueName",
    "venueAddress",
    "currency",
    "notes",
  ];

  // Destructure both the trigger and the cancel mechanism
  const [debouncedSave, cancelPendingSaves] = useDebounce((id, data) => {
    saveEvent(id, data);
  }, 1000);

  const dynamicExtras = Object.entries(eventData).reduce(
    (acc, [key, value]) => {
      // Clean display constraint: Only list real values (skip backend null placeholders if any slip through)
      if (!staticKeys.includes(key) && value !== null) {
        acc[key] = value;
      }
      return acc;
    },
    {},
  );

  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const handleUpdate = (section, key, value) => {
    updateFormData("data", key, value);
    const payload = { data: { [key]: value } };
    debouncedSave(formData.id, payload);
  };

  // Structural Addition: Fires immediately
  const handleAdd = async (e) => {
    e.preventDefault();
    const cleanKey = newKey.trim();
    if (!cleanKey || staticKeys.includes(cleanKey)) return;

    updateFormData("data", cleanKey, newValue.trim());

    // Flush straight to network to prevent keystroke collisions
    await saveEvent(formData.id, { data: { [cleanKey]: newValue.trim() } });

    setNewKey("");
    setNewValue("");
  };

  // Structural Deletion: Clears standard input queues and deletes cleanly
  const handleDelete = async (keyToDelete) => {
    // 1. Terminate any pending keystroke saves (like un-saved text in Notes) immediately
    cancelPendingSaves();

    // 2. Perform structural removal for our local UI layout cache
    const localUpdatedData = { ...eventData };
    delete localUpdatedData[keyToDelete];
    updateFormData("data", localUpdatedData);

    // 3. Formulate the precise tombstone extraction payload for our backend Null-Pruner
    const backendPayload = {
      data: {
        [keyToDelete]: null,
      },
    };

    // 4. Fire directly through the immediate pipeline. Skip the debounce completely!
    await saveEvent(formData.id, backendPayload);
  };

  return (
    <div className="inspectorBody">
      <div className="formSection">
        <div className="m3FormGrid">
          {/* Event Type */}
          <div className="m3FieldGroup">
            <label className="m3Label">Event Type</label>
            <input
              type="text"
              className="m3Input"
              value={eventData.type || ""}
              onChange={(e) => handleUpdate("data", "type", e.target.value)}
              placeholder="birthday"
            />
          </div>

          {/* Date & Time */}
          <div className="flowFields">
            <div className="m3RowFields">
              <div className="m3FieldGroup">
                <label className="m3Label">Start Date & Time</label>
                <input
                  type="datetime-local"
                  className="m3Input datePickerInput"
                  value={eventData.startDateTime || ""}
                  onChange={(e) =>
                    handleUpdate("data", "startDateTime", e.target.value)
                  }
                />
              </div>
              <div className="m3FieldGroup">
                <label className="m3Label">End Date & Time</label>
                <input
                  type="datetime-local"
                  className="m3Input datePickerInput"
                  value={eventData.endDateTime || ""}
                  onChange={(e) =>
                    handleUpdate("data", "endDateTime", e.target.value)
                  }
                />
              </div>
            </div>
          </div>

          {/* Venue Details */}
          <div className="m3FieldGroup">
            <label className="m3Label">Venue Name</label>
            <input
              type="text"
              className="m3Input"
              value={eventData.venueName || ""}
              onChange={(e) =>
                handleUpdate("data", "venueName", e.target.value)
              }
              placeholder="Grand Crystal Ballroom"
            />
          </div>

          <div className="m3FieldGroup">
            <label className="m3Label">Venue Address</label>
            <input
              type="text"
              className="m3Input"
              value={eventData.venueAddress || ""}
              onChange={(e) =>
                handleUpdate("data", "venueAddress", e.target.value)
              }
              placeholder="123 Ocean Drive, Miami FL"
            />
          </div>

          {/* Numbers & Currency */}
          <div className="m3RowFields">
            <div className="m3FieldGroup">
              <label className="m3Label">Expected Guests</label>
              <input
                type="number"
                className="m3Input"
                min="0"
                value={eventData.guest_count || ""}
                onChange={(e) =>
                  handleUpdate(
                    "data",
                    "guest_count",
                    parseInt(e.target.value) || 0,
                  )
                }
              />
            </div>

            <div className="m3FieldGroup">
              <label className="m3Label">Currency</label>
              <select
                className="m3Select"
                value={eventData.currency || "INR"}
                onChange={(e) =>
                  handleUpdate("data", "currency", e.target.value)
                }
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div className="m3FieldGroup">
            <label className="m3Label">Notes & Special Requirements</label>
            <textarea
              className="m3Textarea"
              rows={3}
              value={eventData.notes || ""}
              onChange={(e) => handleUpdate("data", "notes", e.target.value)}
              placeholder="Add logistical criteria details here..."
            />
          </div>
        </div>
      </div>

      {/* SECTION B: DYNAMIC PARAMETERS LEDGER MATRIX */}
      <div className="formSection dynamicSection">
        <div className="sectionDivider">
          <AccountBalanceWalletOutlined className="sectionIcon" />
          <span>Miscellaneous Info</span>
        </div>

        {/* Dynamic Parameter Addition Form */}
        <form
          onSubmit={handleAdd}
          className="kvAddForm"
          style={{ display: "flex", gap: "8px", marginBottom: "16px" }}
        >
          <input
            type="text"
            className="m3Input"
            placeholder="Key (e.g. Catering)"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
          />
          <input
            type="text"
            className="m3Input"
            placeholder="Value"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
          />
          <button
            type="submit"
            className="m3Button"
            style={{
              padding: "0 16px",
              background: "none",
              border: "1px solid var(--border)",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Add Field
          </button>
        </form>

        {Object.keys(dynamicExtras).length === 0 ? (
          <div className="emptyStateWrapper">
            <p className="emptyInspectorText">
              No dynamic line items declared yet.
            </p>
          </div>
        ) : (
          <div className="kvGrid">
            {Object.entries(dynamicExtras).map(([key, value]) => (
              <div className="kvRow" key={key}>
                <div className="keyLabel" title={key}>
                  {key}
                </div>
                <input
                  type="text"
                  className="valueInput"
                  value={value || ""}
                  onChange={(e) => handleUpdate("data", key, e.target.value)}
                />
                <button
                  className="rowDeleteBtn"
                  onClick={() => handleDelete(key)}
                  title={`Delete ${key}`}
                  type="button"
                >
                  <DeleteForeverOutlined style={{ fontSize: 20 }} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
