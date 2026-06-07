import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";

import { useAuth } from "../../hooks/useAuth";
import { useDashboardData } from "../../hooks/dash/useDashData";
import { useError } from "/src/hooks/misc/useErrorContext";
import { useLoading } from "/src/hooks/useLoadingContext";
import { useEventContext } from "/src/hooks/event/useEventContext";

import styles from "./Dash.module.css";

export default function Dash() {
  const { user, openProfile } = useAuth();
  const {
    events,
    templates,
    refreshDashboard,
    createEmptyEvent,
    createEventFromTemplate,
  } = useDashboardData();

  const { triggerError } = useError();
  const { startLoading, stopLoading } = useLoading();
  const { loadEvent } = useEventContext();

  const navigate = useNavigate();

  // DRAG-TO-SCROLL ARCHITECTURE
  const scrollRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [dragDistance, setDragDistance] = useState(0);

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
    startLoading("Loading", `Creating an event based on "${templateTitle}"`);
    try {
      const newEventId = await createEventFromTemplate(templateId);
      await loadEvent(newEventId);
      navigate(`/editor?id=${newEventId}`);
    } catch (err) {
      triggerError(
        "Event Creation Failed",
        `Unable to create event from template: ${err}`,
      );
    } finally {
      stopLoading();
    }
  };

  const handleCreateEventSelect = async () => {
    startLoading("Loading", "Creating an empty event");
    try {
      const newEventId = await createEmptyEvent();
      await loadEvent(newEventId);
      navigate(`/editor?id=${newEventId}`);
    } catch (err) {
      triggerError(
        "Event Creation Failed",
        `Unable to create empty event: ${err}`,
      );
    } finally {
      stopLoading();
    }
  };

  const handleEventSelect = async (eventId) => {
    startLoading("Loading", "Loading event");
    try {
      await loadEvent(eventId);
      navigate(`/editor?id=${eventId}`);
    } catch (err) {
      triggerError(
        "Loading Event Failed",
        `Unable to load created event: ${err}`,
      );
    } finally {
      stopLoading();
    }
  };

  // INTERACTION CAPTURE ROUTERS
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
    setDragDistance(0); // Reset distance tracker on touch start
  };

  const handleMouseLeaveOrUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const currentWalk = x - startX;

    // Accumulate total dragging distance variance
    setDragDistance((prev) => prev + Math.abs(currentWalk));

    // Smooth standard sensitivity tracking multipliers
    scrollRef.current.scrollLeft = scrollLeft - currentWalk * 1.5;
  };

  const handleWheelTranslation = (e) => {
    if (e.deltaY !== 0) {
      scrollRef.current.scrollLeft += e.deltaY * 1.2;
    }
  };

  return (
    <div className={styles.dashContainer}>
      {/* Header */}
      <header className={styles.dashHeader}>
        <div className={styles.logo}>EventRoots</div>

        <div className={styles.headerActions}>
          <button className={styles.iconBtn}>
            <NotificationsNoneIcon fontSize="large" />
          </button>

          <div className={styles.profile} onClick={openProfile}>
            <img src={user?.pfp} alt="profile" />
          </div>
        </div>
      </header>

      <div className={styles.headerWelcome}>
        <h2>Welcome back, {user?.username}! 👋</h2>
      </div>

      {/* Event Templates */}
      {templates && (
        <section className={styles.sectionCard}>
          <h2>Event Templates</h2>

          <div
            ref={scrollRef}
            className={`${styles.templateScroll} ${isDragging ? styles.draggingActive : ""}`}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeaveOrUp}
            onMouseUp={handleMouseLeaveOrUp}
            onMouseMove={handleMouseMove}
            onWheel={handleWheelTranslation}
            style={{ cursor: isDragging ? "grabbing" : "grab" }}
          >
            {templates.map((item) => (
              <div
                className={styles.templateCard}
                key={item.id}
                onClick={() => {
                  if (dragDistance < 5) {
                    handleTemplateSelect(item.id, item.title);
                  }
                }}
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
                <div className={styles.templateContent}>
                  <h3>{item.title}</h3>
                  <p>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Your Events */}
      <section className={styles.sectionCard}>
        <h2>Your Events</h2>

        <div className={styles.eventsGrid}>
          <div className={styles.createCard} onClick={handleCreateEventSelect}>
            <div className={styles.plus}>
              <AddIcon fontSize="large" />
            </div>
            <h3>Create New Event</h3>
          </div>

          {events?.map((event, index) => (
            <div
              className={styles.eventCard}
              key={event.id || index}
              onClick={() => handleEventSelect(event.id)}
            >
              <img src={event.image} alt={event.title} />

              <div className={styles.eventContent}>
                {event.data?.status && (
                  <span
                    className={`${styles.badge} ${styles[event.data.status.toLowerCase()] || ""}`}
                  >
                    {event.data.status}
                  </span>
                )}

                <h3>{event.title}</h3>

                <div className={styles.progressBar}>
                  <div
                    className={styles.progressFill}
                    style={{ width: event.data?.progress_percentage }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
