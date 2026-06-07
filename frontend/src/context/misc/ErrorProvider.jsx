import { useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { ErrorContext } from "./ErrorContext";

export function ErrorProvider({ children }) {
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState({
    title: "",
    description: "",
  });

  const triggerError = useCallback(
    (
      title = "System Encountered an Error",
      description = "Something went wrong on our end. Please verify your connection or try again.",
    ) => {
      setErrorMessage({ title, description });
      setHasError(true);
    },
    [],
  );

  const clearError = useCallback(() => {
    setHasError(false);
    setErrorMessage({ title: "", description: "" });
  }, []);

  const contextValue = useMemo(
    () => ({
      triggerError,
      clearError,
      hasError,
    }),
    [triggerError, clearError, hasError],
  );

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}

      {hasError &&
        createPortal(
          <div
            className="error-screen-overlay"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 99999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              // Material 3 Scrim color token (typically standard black at 40% transparency)
              backgroundColor: "rgba(0, 0, 0, 0.4)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
            }}
          >
            <div
              className="error-card"
              style={{
                // 🎨 M3 Surface Container & Shape tokens
                background: "var(--md-sys-color-surface-container, #ffffff)",
                padding: "24px", // M3 Spacing baseline
                borderRadius: "28px", // M3 Extra Large shape scale token
                maxWidth: "400px",
                width: "90%",
                // M3 Elevation Level 3 shadow profile
                boxShadow:
                  "0px 4px 8px 3px rgba(0,0,0,0.15), 0px 1px 3px rgba(0,0,0,0.3)",
                textAlign: "center",
                border:
                  "1px solid var(--md-sys-color-outline-variant, transparent)",
              }}
            >
              {/* Material Error Icon Anchor */}
              <div
                style={{
                  fontSize: "2rem",
                  marginBottom: "16px",
                  color: "var(--md-sys-color-error, #ba1a1a)",
                }}
              >
                ⚠️
              </div>

              {/* M3 Headline Small text token style */}
              <h2
                style={{
                  margin: "0 0 12px 0",
                  color: "var(--md-sys-color-on-surface, #1d1b20)",
                  fontSize: "1.5rem",
                  fontWeight: "400", // Material prefers clean typographic weights over heavy bolds
                  letterSpacing: "0",
                }}
              >
                {errorMessage.title}
              </h2>

              {/* M3 Body Medium text token style */}
              <p
                style={{
                  margin: "0 0 24px 0",
                  color: "var(--md-sys-color-on-surface-variant, #49454f)",
                  fontSize: "0.875rem",
                  lineHeight: "1.43",
                  letterSpacing: "0.25px",
                }}
              >
                {errorMessage.description}
              </p>

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                {/* M3 Filled Tonal / Destructive Action Button */}
                <button
                  onClick={clearError}
                  style={{
                    // Container: standard error container token color palette
                    background: "var(--md-sys-color-error-container, #ffdad6)",
                    // Text: high-contrast on-error content color token
                    color: "var(--md-sys-color-on-error-container, #410002)",
                    border: "none",
                    padding: "10px 24px",
                    height: "40px",
                    borderRadius: "20px", // Fully pill-shaped M3 button spec
                    fontWeight: "500",
                    fontSize: "0.875rem",
                    cursor: "pointer",
                    transition: "box-shadow 0.2s, opacity 0.2s",
                    width: "100%", // Filled profile choice
                  }}
                  onMouseOver={(e) => (e.target.style.opacity = "0.9")}
                  onMouseOut={(e) => (e.target.style.opacity = "1")}
                >
                  Acknowledge & Close
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </ErrorContext.Provider>
  );
}
