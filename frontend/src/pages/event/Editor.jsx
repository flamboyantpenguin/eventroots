import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useError } from "/src/hooks/misc/useErrorContext";
import { useEventContext } from "/src/hooks/event/useEventContext";
import { useViewport } from "/src/services/getViewPort";
import Desktop from "/src/layout/editor/Desktop";
import Mobile from "/src/layout/editor/Phone";

const Editor = () => {
  const location = useLocation();
  const { triggerError } = useError();
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
    triggerError(
      "Initialization Error",
      "We hit an issue spinning up this workspace. Might be bad URL",
    );
  }

  if (!eventId && !formData.id) {
    triggerError(
      "No Workspace Specified",
      "Please select an event from your Dashboard to begin editing.",
    );
  }

  return isMobile ? <Mobile /> : <Desktop />;
};

export default Editor;
