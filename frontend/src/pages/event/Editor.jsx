// 1. Swap Handle for Separator
import { useViewport } from "/services/getViewPort";
import Desktop from "/layout/editor/Desktop";
import Mobile from "/layout/editor/Phone";

const Editor = () => {
  const { isMobile } = useViewport();

  // Return the entirely different layout depending on the viewport
  return isMobile ? <Mobile /> : <Desktop />;
};

export default Editor;
