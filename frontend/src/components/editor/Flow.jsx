import React, { useState, useRef, useCallback } from "react";
import { useEventContext } from "/src/hooks/event/useEventContext";
import styles from "./Flow.module.css";
import {
  AddCircleOutlineOutlined,
  AudiotrackOutlined,
  BusinessOutlined,
  CakeOutlined,
  CameraAltOutlined,
  DeleteForeverOutlined,
  VideocamOutlined,
  CloseOutlined,
} from "@mui/icons-material";

const CATEGORY_ICONS = {
  photography: <CameraAltOutlined className={styles.flowCategoryIcon} />,
  videography: <VideocamOutlined className={styles.flowCategoryIcon} />,
  entertainment: <AudiotrackOutlined className={styles.flowCategoryIcon} />,
  catering: <CakeOutlined className={styles.flowCategoryIcon} />,
};

// Reusing the identical debounce layout engine from your Overview file
const useDebounce = (callback, delay) => {
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

export function Flow() {
  const {
    formData,
    updateFormData,
    availableCategories,
    availableVendors,
    saveEvent,
  } = useEventContext();

  const flow = formData.flow || {};

  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const [debouncedSave, cancelPendingSaves] = useDebounce((id, data) => {
    saveEvent(id, data);
  }, 1000);

  const getCategoryName = (id) =>
    availableCategories.find((c) => c.id === id)?.name || "Unknown Step";

  const getVendorName = (idOrName) =>
    availableVendors.find((v) => v.id === idOrName)?.name || idOrName;

  const handleFlowUpdate = (updatedFlow, isImmediate = false) => {
    updateFormData("data", "flow", updatedFlow);
    const payload = { data: { flow: updatedFlow } };

    if (isImmediate) {
      saveEvent(formData.id, payload);
    } else {
      debouncedSave(formData.id, payload);
    }
  };

  // 1. Structural Addition: Adds an empty category array structure (Fires immediately)
  const handleAddCategoryStep = async (e) => {
    e.preventDefault();
    if (!selectedCategoryId || flow[selectedCategoryId]) return;

    const updatedFlow = {
      ...flow,
      [selectedCategoryId]: [],
    };

    setSelectedCategoryId("");
    handleFlowUpdate(updatedFlow, true);
  };

  // 2. Structural Deletion: Purges the layout block completely (Fires immediately)
  const handleDeleteCategoryStep = async (categoryId) => {
    cancelPendingSaves();

    const updatedFlow = { ...flow };
    delete updatedFlow[categoryId];

    handleFlowUpdate(updatedFlow, true);
  };

  // 3. Relational Association: appends a vendor link or text into a category sequence (Debounced)
  const handleLinkVendorNode = (categoryId, vendorIdOrName) => {
    if (!vendorIdOrName) return;

    const currentLinked = flow[categoryId] || [];
    if (currentLinked.includes(vendorIdOrName)) return;

    const updatedFlow = {
      ...flow,
      [categoryId]: [...currentLinked, vendorIdOrName],
    };

    handleFlowUpdate(updatedFlow, false);
  };

  // 4. Relational Disconnection: removes an item from a category array path (Debounced)
  const handleUnlinkVendorNode = (categoryId, targetVendorIdOrName) => {
    const updatedFlow = {
      ...flow,
      [categoryId]: (flow[categoryId] || []).filter(
        (item) => item !== targetVendorIdOrName,
      ),
    };

    handleFlowUpdate(updatedFlow, false);
  };

  const activeCategoryIds = Object.keys(flow);
  const remainingSelectableCategories = availableCategories.filter(
    (cat) => !flow[cat.id],
  );

  return (
    <div className={styles.flowPanelContainer}>
      {/* Header Info Banner */}
      <div className={styles.flowSelectorHeader}>
        <div className={styles.flowHeaderMetaGroup}>
          <span className={styles.flowSelectorTitle}>Event Flow</span>
          {activeCategoryIds.length === 0 && (
            <span className={styles.flowSandboxBadge}>Unassigned</span>
          )}
        </div>
        <span className={styles.flowSelectorCountBadge}>
          {activeCategoryIds.reduce(
            (acc, catId) => acc + (flow[catId]?.length || 0),
            0,
          )}{" "}
          Active Links
        </span>
      </div>

      {/* Category Target Form Injector */}
      {remainingSelectableCategories.length > 0 ? (
        <form
          onSubmit={handleAddCategoryStep}
          className={styles.flowCategoryActionForm}
        >
          <select
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            className={styles.flowM3Dropdown}
          >
            <option value="">-- Append Section Block --</option>
            {remainingSelectableCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className={styles.flowAddButton}
            disabled={!selectedCategoryId}
          >
            <AddCircleOutlineOutlined style={{ fontSize: 18 }} />
            <span>Add Block</span>
          </button>
        </form>
      ) : (
        <div className={styles.flowExhaustedNotice}>
          All category blocks mapped into current workspace timeline.
        </div>
      )}

      {/* Main Flow Grid Panels */}
      <div className={styles.flowSelectorBody}>
        {activeCategoryIds.length === 0 ? (
          <div className={styles.flowEmptyWrapper}>
            <BusinessOutlined className={styles.flowEmptyIcon} />
            <p className={styles.flowEmptyText}>
              No configuration workflows mapped to this pipeline yet.
            </p>
          </div>
        ) : (
          activeCategoryIds.map((catId) => {
            const assignedItems = flow[catId] || [];
            const categoryName = getCategoryName(catId);

            const selectableVendorsForCategory = availableVendors.filter(
              (v) => v.category_id === catId && !assignedItems.includes(v.id),
            );

            return (
              <div key={catId} className={styles.flowCategoryWrapperCard}>
                {/* Header Action Block */}
                <div className={styles.flowCategoryGroupHeader}>
                  <div className={styles.flowCategoryTitleGroup}>
                    {CATEGORY_ICONS[categoryName.toLowerCase()] || (
                      <BusinessOutlined className={styles.flowCategoryIcon} />
                    )}
                    <span className={styles.flowCategoryGroupLabel}>
                      {categoryName}
                    </span>
                  </div>

                  <button
                    type="button"
                    className={styles.flowCategoryDeleteBtn}
                    onClick={() => handleDeleteCategoryStep(catId)}
                    title={`Remove ${categoryName}`}
                  >
                    <CloseOutlined style={{ fontSize: 16 }} />
                  </button>
                </div>

                {/* Sub-Rows Render Stack */}
                <div className={styles.flowVendorRowsStack}>
                  {assignedItems.map((itemIdentifier) => {
                    const displayName = getVendorName(itemIdentifier);

                    return (
                      <div
                        key={itemIdentifier}
                        className={styles.flowVendorItemRow}
                      >
                        <span className={styles.flowVendorItemName}>
                          {displayName}
                        </span>
                        <button
                          type="button"
                          className={styles.flowVendorDeleteBtn}
                          onClick={() =>
                            handleUnlinkVendorNode(catId, itemIdentifier)
                          }
                          title={`Unlink ${displayName}`}
                        >
                          <DeleteForeverOutlined style={{ fontSize: 18 }} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Insertion Inputs Matrix Footer */}
                <div className={styles.flowVendorAssignmentZone}>
                  <select
                    value=""
                    onChange={(e) =>
                      handleLinkVendorNode(catId, e.target.value)
                    }
                    className={styles.flowM3InlineSelector}
                    disabled={selectableVendorsForCategory.length === 0}
                  >
                    <option value="" disabled>
                      {selectableVendorsForCategory.length === 0
                        ? "All options assigned"
                        : `-- Link ${categoryName} Option --`}
                    </option>
                    {selectableVendorsForCategory.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
