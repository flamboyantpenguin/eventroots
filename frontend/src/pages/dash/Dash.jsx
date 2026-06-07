import "./Dash.css";
import AddIcon from "@mui/icons-material/Add";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import { useAuth } from "../../hooks/useAuth";
import { useDashboardData } from "../../hooks/dash/useDashData";
import { useError } from "/src/hooks/misc/useErrorContext";
import { useEffect } from "react";

export default function Dash() {
  const { user, openProfile } = useAuth();
  const { events, templates, error } = useDashboardData();

  const { triggerError } = useError();

  useEffect(() => {
    if (error) {
      let errorTitle = "Workspace Sync Error";
      let errorDesc =
        error.message ||
        "Unable to establish a secure link to your active database cluster.";

      const backendDetail = error.response?.data?.detail;

      if (backendDetail) {
        if (typeof backendDetail === "string") {
          errorTitle = backendDetail;
        } else if (Array.isArray(backendDetail)) {
          errorTitle = "Data Validation Failure";
          errorDesc = backendDetail
            .map((err) => `${err.loc.join(".")}: ${err.msg}`)
            .join(" | ");
        } else if (typeof backendDetail === "object") {
          errorTitle = backendDetail.title || "Malformed Response Payload";
          errorDesc =
            backendDetail.description || JSON.stringify(backendDetail);
        }
      }

      triggerError(errorTitle, errorDesc);
    }
  }, [error, triggerError]);

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
                <div className="template-card" key={index}>
                  <img src={item.banner_url} alt={item.title} />
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
                  <span className={`badge ${event.status.toLowerCase()}`}>
                    {event.status}
                  </span>

                  <h3>{event.title}</h3>

                  <p>{event.progress} Planned</p>

                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: event.progress }}
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
