import { useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { LoadingContext } from "./LoadingContext";

export function LoadingProvider({ children }) {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState({
    title: "",
    description: "",
  });

  const startLoading = useCallback(
    (
      title = "Verifying Permissions",
      description = "Securing your active workspace canvas...",
    ) => {
      setLoadingMessage({ title, description });
      setIsLoading(true);
    },
    [],
  );

  const stopLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const contextValue = useMemo(
    () => ({
      startLoading,
      stopLoading,
      isLoading,
    }),
    [startLoading, stopLoading, isLoading],
  );

  return (
    <LoadingContext.Provider value={contextValue}>
      {children}{" "}
      {isLoading &&
        createPortal(
          <div
            className="loading-screen"
            style={{ position: "fixed", inset: 0, zIndex: 9999 }}
          >
            <div className="loading-card">
              <div className="spinner"></div>
              <h2>{loadingMessage.title}</h2>
              <p>{loadingMessage.description}</p>
            </div>
          </div>,
          document.body,
        )}
    </LoadingContext.Provider>
  );
}
