import { useEffect } from "react";
import { useLocation } from "react-router-dom"; // Hook to safely inspect browser location properties
import { useEventContext } from "/src/hooks/event/useEventContext";
import { useViewport } from "/src/services/getViewPort";
import Desktop from "/src/layout/editor/Desktop";
import Mobile from "/src/layout/editor/Phone";

const Editor = () => {
  const location = useLocation();
  const { loadEvent, formData, contextError } = useEventContext();
  const { isMobile } = useViewport();

  const queryParams = new URLSearchParams(location.search);
  const eventId = queryParams.get("id");

  useEffect(() => {
    if (eventId && formData.id !== eventId) {
      loadEvent(eventId).catch((err) => {
        console.error(
          "Critical failure during active workspace recovery:",
          err,
        );
      });
    }
  }, [eventId, loadEvent, formData.id]);

  if (contextError) {
    return (
      <div className="workspaceError">
        <h3>Initialization Error</h3>
        <p>
          We hit an issue spinning up this workspace. Please check your URL link
          context.
        </p>
      </div>
    );
  }

  if (!eventId && !formData.id) {
    return (
      <div className="workspaceError">
        <h3>No Workspace Specified</h3>
        <p>Please select an event from your Dashboard to begin editing.</p>
      </div>
    );
  }

  return isMobile ? <Mobile /> : <Desktop />;
};

export default Editor;
