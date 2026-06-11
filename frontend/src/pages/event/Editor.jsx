import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useError } from "/src/hooks/misc/useErrorContext";
import {
  themeFromSourceColor2,
  applyTheme,
} from "/src/hooks/misc/useMaterialDynamic";
import { useEventContext } from "/src/hooks/event/useEventContext";
import { useViewport } from "/src/services/getViewPort";
import Desktop from "/src/layout/editor/Desktop";
import Mobile from "/src/layout/editor/Phone";
import {
  argbFromHex,
  sourceColorFromImage,
} from "@material/material-color-utilities";

let themeMediaCleanup = null;

async function loadThemeColor(img) {
  const theme2 = themeFromSourceColor2(await sourceColorFromImage(img), [
    {
      name: "custom-1",
      value: argbFromHex("#ff0000"),
      blend: true,
    },
  ]);
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  applyTheme(theme2, { target: document.body, dark: mediaQuery.matches });

  if (themeMediaCleanup) themeMediaCleanup();

  const handleThemeChange = (e) => {
    applyTheme(theme2, { target: document.body, dark: e.matches });
  };

  mediaQuery.addEventListener("change", handleThemeChange);

  themeMediaCleanup = () =>
    mediaQuery.removeEventListener("change", handleThemeChange);
}

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
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      loadThemeColor(img);
    };

    img.onerror = (error) => {
      console.error("Error loading image:", error);
    };

    img.src = formData.banner_url;
  }, [eventId, loadEvent, formData.id, formData.banner_url]);

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
