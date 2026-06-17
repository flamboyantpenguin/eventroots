import { useContext } from "react";
import { PanelContext } from "/src/context/admin/PanelContext";

export function usePanelDir() {
  const context = useContext(PanelContext);
  if (!context) {
    throw new Error("usePanelDir must be used within an PanelProvder");
  }

  return context;
}
