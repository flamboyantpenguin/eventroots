import { useState } from "react";
import { useEventContext } from "/src/hooks/useEventContext";
import {
  AddCircleOutlineOutlined,
  DeleteForeverOutlined,
  SettingsOutlined,
  EventNoteOutlined,
  AccountBalanceWalletOutlined,
} from "@mui/icons-material";
import "./Overview.css";

export function Overview() {
  const { formData, updateFormData } = useEventContext();
  const targetData = formData.budget || {};

  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newKey.trim()) return;

    updateFormData("budget", newKey.trim(), newValue.trim());
    setNewKey("");
    setNewValue("");
  };

  const handleDelete = (key) => {
    const nextSubObject = { ...targetData };
    delete nextSubObject[key];
    updateFormData("budget", nextSubObject);
  };

  return (
    <div className="inspectorContainer">
      {/* M3 Header */}
      <div className="inspectorHeader">
        <div className="headerLeading">
          <SettingsOutlined className="inspectorIcon" />
          <span className="inspectorTitle">Event Parameters</span>
        </div>
      </div>

      {/* Main Scrollable Inspector Body */}
      <div className="inspectorBody">
        {/* SECTION A: SEMANTIC DEDICATED FIELD FORM */}
        <div className="formSection">
          <div className="m3FormGrid">
            {/* Event Classification Select Input */}
            <div className="m3FieldGroup">
              <label className="m3Label">Event Type</label>
              <select
                className="m3Select"
                value={formData.type || ""}
                onChange={(e) => updateFormData("type", e.target.value)}
              >
                <option value="" disabled>
                  Select Type...
                </option>
                <option value="Wedding">Wedding</option>
                <option value="Corporate">Corporate Meeting</option>
                <option value="Conference">Conference</option>
                <option value="Birthday">Birthday Celebration</option>
                <option value="Gala">Gala Dinner</option>
              </select>
            </div>

            {/* Combined Native HTML5 Date & Time Pickers */}
            <div className="m3RowFields">
              <div className="m3FieldGroup">
                <label className="m3Label">Start Date & Time</label>
                <input
                  type="datetime-local"
                  className="m3Input datePickerInput"
                  value={formData.startDateTime || ""}
                  onChange={(e) =>
                    updateFormData("startDateTime", e.target.value)
                  }
                />
              </div>

              <div className="m3FieldGroup">
                <label className="m3Label">End Date & Time</label>
                <input
                  type="datetime-local"
                  className="m3Input datePickerInput"
                  value={formData.endDateTime || ""}
                  onChange={(e) =>
                    updateFormData("endDateTime", e.target.value)
                  }
                />
              </div>
            </div>

            {/* Venue Parameters */}
            <div className="m3FieldGroup">
              <label className="m3Label">Venue Name</label>
              <input
                type="text"
                className="m3Input"
                value={formData.venueName || ""}
                onChange={(e) => updateFormData("venueName", e.target.value)}
                placeholder="Grand Crystal Ballroom"
              />
            </div>

            <div className="m3FieldGroup">
              <label className="m3Label">Venue Address</label>
              <input
                type="text"
                className="m3Input"
                value={formData.venueAddress || ""}
                onChange={(e) => updateFormData("venueAddress", e.target.value)}
                placeholder="123 Ocean Drive, Miami FL"
              />
            </div>

            {/* Numbers & Currency Parameter Layout Matrix */}
            <div className="m3RowFields">
              <div className="m3FieldGroup">
                <label className="m3Label">Expected Guests</label>
                <input
                  type="number"
                  className="m3Input"
                  min="0"
                  value={formData.expectedGuests || ""}
                  onChange={(e) =>
                    updateFormData("expectedGuests", e.target.value)
                  }
                  placeholder="250"
                />
              </div>

              <div className="m3FieldGroup">
                <label className="m3Label">Currency</label>
                <select
                  className="m3Select"
                  value={formData.currency || ""}
                  onChange={(e) => updateFormData("currency", e.target.value)}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>
            </div>

            {/* Paragraph Textarea Block */}
            <div className="m3FieldGroup">
              <label className="m3Label">Notes & Special Requirements</label>
              <textarea
                className="m3Textarea"
                rows={3}
                value={formData.notes || ""}
                onChange={(e) => updateFormData("notes", e.target.value)}
                placeholder="Add logistical criteria details here..."
              />
            </div>
          </div>
        </div>

        {/* SECTION B: DYNAMIC PARAMETERS LEDGER MATRIX */}
        <div className="formSection dynamicSection">
          <div className="sectionDivider">
            <AccountBalanceWalletOutlined className="sectionIcon" />
            <span>Miscallaneous Info</span>
          </div>

          {Object.keys(targetData).length === 0 ? (
            <div className="emptyStateWrapper">
              <p className="emptyInspectorText">
                No dynamic line items declared yet.
              </p>
            </div>
          ) : (
            <div className="kvGrid">
              {Object.entries(targetData).map(([key, value]) => (
                <div className="kvRow" key={key}>
                  <div className="keyLabel" title={key}>
                    {key}
                  </div>
                  <input
                    type="text"
                    className="valueInput"
                    value={value}
                    onChange={(e) =>
                      updateFormData("budget", key, e.target.value)
                    }
                    placeholder="—"
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

      {/* Surface Anchored Footer Composer */}
      <div className="inspectorFooter">
        <form onSubmit={handleAdd} className="addPairForm">
          <input
            type="text"
            placeholder="Ledger Key (e.g., catering)"
            className="footerInput keyInput"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
          />
          <input
            type="text"
            placeholder="Allocation amount"
            className="footerInput valInput"
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
          />
          <button
            type="submit"
            className="addRowBtn"
            disabled={!newKey.trim()}
            title="Append Line Attribute"
          >
            <AddCircleOutlineOutlined style={{ fontSize: 22 }} />
          </button>
        </form>
      </div>
    </div>
  );
}
