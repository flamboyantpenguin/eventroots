import { useRef, useState } from "react";

import { useEventContext } from "/src/hooks/event/useEventContext";
import { useError } from "/src/hooks/misc/useErrorContext";
import { useLoading } from "/src/hooks/useLoadingContext";
import { useDebounce } from "../../hooks/useDebounce";

import {
  DeleteForeverOutlined,
  AccountBalanceWalletOutlined,
  CameraAltOutlined,
} from "@mui/icons-material";
import "./Overview.css";

export function Overview() {
  const { formData, updateFormData, saveEvent, uploadAndSetBanner } =
    useEventContext();
  const { triggerError } = useError();
  const { startLoading, stopLoading, isLoading } = useLoading();
  const eventData = formData.data || {};

  const fileInputRef = useRef(null);

  const staticKeys = [
    "type",
    "flow",
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

  const [debouncedSave, cancelPendingSaves] = useDebounce((id, data) => {
    saveEvent(id, data);
  }, 1000);

  const dynamicExtras = Object.entries(eventData).reduce(
    (acc, [key, value]) => {
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

  const handleAdd = async (e) => {
    e.preventDefault();
    const cleanKey = newKey.trim();
    if (!cleanKey || staticKeys.includes(cleanKey)) return;

    updateFormData("data", cleanKey, newValue.trim());
    await saveEvent(formData.id, { data: { [cleanKey]: newValue.trim() } });

    setNewKey("");
    setNewValue("");
  };

  const handleDelete = async (keyToDelete) => {
    cancelPendingSaves();

    const localUpdatedData = { ...eventData };
    delete localUpdatedData[keyToDelete];
    updateFormData("data", localUpdatedData);

    const backendPayload = {
      data: {
        [keyToDelete]: null,
      },
    };

    await saveEvent(formData.id, backendPayload);
  };

  const handleTriggerFileInput = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  console.log(formData);

  const handleBannerUpload = async (e) => {
    startLoading("Uploading Banner", "Please wait");
    try {
      const file = e.target.files[0];
      if (!file) return;
      await uploadAndSetBanner(formData.id, file);
    } catch (err) {
      triggerError("Banner Upload Failed", err.message);
    } finally {
      stopLoading();
    }
  };

  return (
    <div className="inspectorBody">
      <div className="formSection bannerControlSection">
        <div
          className="bannerPreviewWrapper"
          style={{
            backgroundImage: `url(${formData.banner_url}), url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100%' height='100%' fill='%236750A4'/></svg>"`,
          }}
        >
          <div className="bannerScrimOverlay">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleBannerUpload}
              accept="image/*"
              style={{ display: "none" }}
            />
            <button
              type="button"
              className="m3Button bannerUploadBtn"
              disabled={isLoading}
              onClick={handleTriggerFileInput}
            >
              <CameraAltOutlined style={{ fontSize: 18, marginRight: "6px" }} />
              {isLoading ? "Uploading Image..." : "Change Workspace Banner"}
            </button>
          </div>
        </div>
      </div>

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
              <input
                className="m3Input"
                value={eventData.currency || "INR"}
                onChange={(e) =>
                  handleUpdate("data", "currency", e.target.value)
                }
              />
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

      <div className="formSection dynamicSection">
        <div className="sectionDivider">
          <AccountBalanceWalletOutlined className="sectionIcon" />
          <span>Miscellaneous Info</span>
        </div>

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
