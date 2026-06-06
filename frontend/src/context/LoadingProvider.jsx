import { useState, useCallback } from "react";

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

  return (
    <LoadingContext.Provider value={{ startLoading, stopLoading, isLoading }}>
      {children}

      {isLoading && (
        <div className="loading-screen">
          <div className="loading-card">
            <div className="spinner"></div>
            <h2>{loadingMessage.title}</h2>
            <p>{loadingMessage.description}</p>
          </div>
        </div>
      )}
    </LoadingContext.Provider>
  );
}
