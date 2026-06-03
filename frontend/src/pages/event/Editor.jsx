// 1. Swap Handle for Separator
import { useViewport } from "/src/services/getViewPort";
import Desktop from "/src/layout/editor/Desktop";
import Mobile from "/src/layout/editor/Phone";

const Editor = () => {
  const { isMobile } = useViewport();

  // Return the entirely different layout depending on the viewport
  return isMobile ? <Mobile /> : <Desktop />;
};

export default Editor;
