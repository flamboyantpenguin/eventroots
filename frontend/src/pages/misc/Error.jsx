// src/pages/SystemError.jsx
import {
  useNavigate,
  useRouteError,
  isRouteErrorResponse,
} from "react-router-dom";
import {
  ErrorOutlineOutlined,
  ReportProblemOutlined,
  ArrowBackOutlined,
  RefreshOutlined,
} from "@mui/icons-material";
import "./Error.css";

export default function SystemError() {
  const navigate = useNavigate();
  const error = useRouteError();

  // 🔍 THE CORRECTION: Check if it's a native 404 response OR if no error object exists at all
  // (which happens when arriving via the catch-all "*" path element)
  const is404 = (isRouteErrorResponse(error) && error.status === 404) || !error;

  const errorConfiguration = {
    // Fall back to a visual 404 string if it's a routing miss, otherwise show the structural status or 500
    code: is404 ? "404" : error?.status || "500",
    title: is404 ? "Canvas Lost in Space" : "System Core Exception",
    description: is404
      ? "The workspace page you are looking for doesn't exist, has been safely archived, or moved out of bounds."
      : "The application server encountered an unexpected glitch and couldn't process your request. Our telemetry data has logged this instance.",
    themeClass: is404 ? "m3-error-404" : "m3-error-500",
    icon: is404 ? (
      <ErrorOutlineOutlined className="m3-icon-large" />
    ) : (
      <ReportProblemOutlined className="m3-icon-large" />
    ),
  };

  return (
    <div
      className={`m3-theme m3-page-fullscreen error-page-wrapper ${errorConfiguration.themeClass}`}
    >
      <div className="error-card animate-surface">
        <div className="error-icon-container">{errorConfiguration.icon}</div>

        <header className="error-header">
          <h1 className="m3-display-large">{errorConfiguration.code}</h1>
          <h2 className="m3-headline-medium">{errorConfiguration.title}</h2>
        </header>

        <p className="m3-body-large text-secondary">
          {errorConfiguration.description}
        </p>

        <div className="error-actions">
          {is404 ? (
            <button
              type="button"
              className="m3-btn m3-btn-filled"
              onClick={() => navigate("/signup")}
            >
              <ArrowBackOutlined className="m3-btn-icon" />
              <span>Return to Safety</span>
            </button>
          ) : (
            <div className="button-group">
              <button
                type="button"
                className="m3-btn m3-btn-tonal"
                onClick={() => navigate(-1)}
              >
                <ArrowBackOutlined className="m3-btn-icon" />
                <span>Go Back</span>
              </button>
              <button
                type="button"
                className="m3-btn m3-btn-filled server-retry-btn"
                onClick={() => window.location.reload()}
              >
                <RefreshOutlined className="m3-btn-icon" />
                <span>Retry Connection</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
