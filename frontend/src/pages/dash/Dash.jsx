import "./Dash.css";
import AddIcon from "@mui/icons-material/Add";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import { useAuth } from "../../hooks/useAuth";
import { useDashboardData } from "../../hooks/dash/useDashData";
import { useError } from "/src/hooks/misc/useErrorContext";
import { useLoading } from "/src/hooks/useLoadingContext";
import { useEventContext } from "/src/hooks/event/useEventContext";

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Dash() {
  const { user, openProfile } = useAuth();
  const { events, templates, refreshDashboard, createEventFromTemplate } =
    useDashboardData();

  const { triggerError } = useError();
  const { startLoading, stopLoading } = useLoading();

  const { loadEvent } = useEventContext();

  const navigate = useNavigate();

  useEffect(() => {
    async function initializeWorkspace() {
      try {
        await refreshDashboard();
      } catch (err) {
        let errorTitle = "Workspace Sync Error";
        let errorDesc =
          err.message ||
          "Unable to establish a secure link to your active database cluster.";

        const backendDetail = err.response?.data?.detail;

        if (backendDetail) {
          if (typeof backendDetail === "string") {
            errorTitle = backendDetail;
          } else if (Array.isArray(backendDetail)) {
            errorTitle = "Data Validation Failure";
            errorDesc = backendDetail
              .map((e) => `${e.loc.join(".")}: ${e.msg}`)
              .join(" | ");
          } else if (typeof backendDetail === "object") {
            errorTitle = backendDetail.title || "Malformed Response Payload";
            errorDesc =
              backendDetail.description || JSON.stringify(backendDetail);
          }
        }

        triggerError(errorTitle, errorDesc);
      }
    }

    initializeWorkspace();
  }, [refreshDashboard, triggerError]);

  const handleTemplateSelect = async (templateId, templateTitle) => {
    startLoading(
      "Instantiating Blueprint",
      `Cloning database architecture sequences for the "${templateTitle}" node layout...`,
    );
    try {
      const newEventId = await createEventFromTemplate(templateId);
      console.log(newEventId);
      await loadEvent(newEventId);
      navigate(`/editor?id=${newEventId}`);
    } catch (err) {
      console.error("Template structural clone exception caught locally:", err);
    } finally {
      stopLoading();
    }
  };

  return (
    <>
      <div className="dash-container">
        {/* Header */}
        <header className="dash-header">
          <div className="logo">EventRoots</div>

          <div className="header-actions">
            <button className="icon-btn">
              <NotificationsNoneIcon fontSize="large" />
            </button>

            <div className="profile" onClick={openProfile}>
              <img src={user.pfp} alt="profile" />
            </div>
          </div>
        </header>

        <div className="header-welcome">
          <h2>Welcome back, {user.username}! 👋</h2>
        </div>

        {/* Event Templates */}
        {templates && (
          <section className="section-card">
            <h2>Event Templates</h2>

            <div className="template-scroll">
              {templates.map((item, index) => (
                <div
                  className="template-card"
                  key={index}
                  onClick={() => handleTemplateSelect(item.id, item.title)}
                  style={{ cursor: "pointer" }}
                >
                  <img
                    src={item.banner_url}
                    alt={item.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100%' height='100%' fill='%236750A4'/></svg>";
                    }}
                  />
                  <div className="template-content">
                    <h3>{item.title}</h3>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Your Events */}
        <section className="section-card">
          <h2>Your Events</h2>

          <div className="events-grid">
            <div className="create-card">
              <div className="plus">
                <AddIcon fontSize="large" />
              </div>
              <h3>Create New Event</h3>
            </div>

            {events.map((event, index) => (
              <div className="event-card" key={index}>
                <img src={event.image} alt={event.title} />

                <div className="event-content">
                  {event.data?.status && (
                    <span
                      className={`badge ${event.data?.status.toLowerCase()}`}
                    >
                      {event.data?.status}
                    </span>
                  )}

                  <h3>{event.title}</h3>

                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: event.data?.progress_percentage }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
