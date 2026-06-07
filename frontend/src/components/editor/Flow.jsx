import { useEventContext } from "/src/hooks/event/useEventContext";
import {
  CameraAltOutlined,
  VideocamOutlined,
  DeleteForeverOutlined,
  BusinessOutlined,
  AudiotrackOutlined,
  CakeOutlined,
} from "@mui/icons-material";
import "./Flow.css";

// Dynamic Icon Mapping Directory
const CATEGORY_ICONS = {
  photography: <CameraAltOutlined className="categoryIcon" />,
  videography: <VideocamOutlined className="categoryIcon" />,
  entertainment: <AudiotrackOutlined className="categoryIcon" />,
  catering: <CakeOutlined className="categoryIcon" />,
};

// High-fidelity local dummy values to fill the frame instantly if global state is uninitialized
const DUMMY_VENDORS = {
  Photography: {
    "v-1": { name: "Pixel Perfect Studios" },
    "v-2": { name: "Lumiere Wedding Captures" },
  },
  Videography: {
    "v-3": { name: "CineFrame Media Works" },
    "v-4": { name: "Velvet Motion Films" },
  },
  Catering: {
    "v-5": { name: "Epicurean Elite Banquet Arts" },
  },
  Entertainment: {
    "v-6": { name: "The Symphony Acoustic Crew" },
  },
};

export function Flow() {
  const { formData, updateFormData } = useEventContext();

  // Pluck actual state, fall back completely to our mock dictionary if empty
  const rawVendors = formData.vendors || {};
  const hasRealData = Object.keys(rawVendors).length > 0;
  const vendorsMatrix = hasRealData ? rawVendors : DUMMY_VENDORS;

  const handleDeleteVendor = (categoryKey, vendorId) => {
    // Clone category group to avoid direct state mutation
    const updatedCategory = { ...vendorsMatrix[categoryKey] };
    delete updatedCategory[vendorId];

    // Push the updated sub-dictionary back up to the provider state stream
    updateFormData("vendors", categoryKey, updatedCategory);
  };

  const categories = Object.keys(vendorsMatrix);

  return (
    <div className="vendorSelectorContainer">
      {/* Header Info Band */}
      <div className="selectorHeader">
        <div className="headerMetaGroup">
          <span className="selectorTitle">Flow</span>
          {!hasRealData && <span className="sandboxBadge">Demo</span>}
        </div>
        <span className="selectorCountBadge">
          {categories.reduce(
            (acc, cat) => acc + Object.keys(vendorsMatrix[cat] || {}).length,
            0,
          )}{" "}
          Active
        </span>
      </div>

      {/* Main List Stream */}
      <div className="selectorBody">
        {categories.length === 0 ? (
          <div className="emptyVendorsWrapper">
            <BusinessOutlined className="emptyVendorsIcon" />
            <p className="emptyVendorsText">
              No vendors assigned to this event catalog.
            </p>
          </div>
        ) : (
          categories.map((categoryKey) => {
            const vendorGroup = vendorsMatrix[categoryKey] || {};
            const vendorEntries = Object.entries(vendorGroup);

            // Skip rendering the partition entirely if it has been cleared out
            if (vendorEntries.length === 0) return null;

            return (
              /* 💎 THE NEW WRAPPER DIV: Keeps one entire category cluster self-contained */
              <div key={categoryKey} className="categoryWrapperCard">
                {/* Category Identity Title Pin */}
                <div className="categoryGroupHeader">
                  {CATEGORY_ICONS[categoryKey.toLowerCase()] || (
                    <BusinessOutlined className="categoryIcon" />
                  )}
                  <span className="categoryGroupLabel">{categoryKey}</span>
                </div>

                {/* Sub-list of Vendor Cards */}
                <div className="vendorRowsStack">
                  {vendorEntries.map(([vendorId, vendorDetails]) => {
                    const vendorName =
                      typeof vendorDetails === "object"
                        ? vendorDetails.name
                        : vendorDetails;

                    return (
                      <div key={vendorId} className="vendorItemRow">
                        <span className="vendorItemName">{vendorName}</span>

                        <button
                          type="button"
                          className="vendorDeleteBtn"
                          onClick={() =>
                            handleDeleteVendor(categoryKey, vendorId)
                          }
                          title={`Unlink ${vendorName}`}
                        >
                          <DeleteForeverOutlined style={{ fontSize: 18 }} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
