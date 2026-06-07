import { useState } from "react";
import { useEventContext } from "/src/hooks/event/useEventContext";
import { Panel, Group, Separator } from "react-resizable-panels";
import { Chat } from "/src/components/editor/Chat";
import {
  ChatOutlined,
  CheckOutlined,
  DeleteForeverOutlined,
  EditOutlined,
  SaveOutlined,
} from "@mui/icons-material";
import { Overview } from "../../components/editor/Overview";
import { Flow } from "../../components/editor/Flow";
import styles from "./Desktop.module.css"; // 🛠️ Correctly binding styles object
import { useAuth } from "../../hooks/useAuth";

const Desktop = () => {
  const { user, openProfile } = useAuth();
  const { formData, saveEvent, updateFormData, contextLoading } =
    useEventContext();
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [isFlowCollapsed, setIsFlowCollapsed] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [transientTitle, setTransientTitle] = useState("");

  const handleStartEditing = () => {
    setTransientTitle(formData.title || "");
    setIsEditing(true);
  };

  const handleSaveTitle = () => {
    setIsEditing(false);
    const cleanTitle = transientTitle.trim();

    if (!cleanTitle || cleanTitle === formData.title) return;

    updateFormData("title", null, cleanTitle);
    saveEvent(formData.id, { title: cleanTitle });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSaveTitle();
    if (e.key === "Escape") setIsEditing(false);
  };

  return (
    <div className={styles.layoutViewport}>
      <div className={styles.navbar}>
        <div className={styles.navActions}>
          {/* Dynamic Title */}
          {isEditing ? (
            <div
              className={styles.titleEditWrapper}
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <input
                type="text"
                className="m3Input titleInput" // Keep global styles naked if they don't live in Desktop.module.css
                value={transientTitle}
                onChange={(e) => setTransientTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={handleKeyDown}
                autoFocus
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  padding: "4px 8px",
                }}
              />
              <button
                className={`${styles.actionsBtn} ${styles.stBtn}`}
                onClick={handleSaveTitle}
              >
                <CheckOutlined />
              </button>
            </div>
          ) : (
            <>
              <h1 className={styles.title} onDoubleClick={handleStartEditing}>
                {formData.title || "Untitled Workspace"}
              </h1>
              <button
                className={`${styles.actionsBtn} ${styles.stBtn}`}
                onClick={handleStartEditing}
              >
                <EditOutlined />
              </button>
            </>
          )}
          <button className={`${styles.actionsBtn} ${styles.deleteBtn}`}>
            <DeleteForeverOutlined />
          </button>

          {/* Dynamic state modifiers combined smoothly using Template Literals */}
          <button
            className={`${styles.actionsBtn} ${styles.longBtn} ${isChatCollapsed ? styles.scnBtn : ""}`}
            onClick={() => setIsChatCollapsed(!isChatCollapsed)}
          >
            <ChatOutlined />
            Chat
          </button>
        </div>

        <div className={styles.navActions}>
          {contextLoading && (
            <div className={`${styles.actionsBtn} ${styles.longBtn}`}>
              <SaveOutlined />
              Saving...
            </div>
          )}
          <button className={styles.profileBtn} onClick={openProfile}>
            <img
              src={user.pfp}
              alt="Profile"
              className={styles.profileAvatar}
            />
          </button>
        </div>
      </div>

      <div className={styles.container}>
        <Group orientation="horizontal">
          {/* PANEL 1: Left Menu */}
          {!isFlowCollapsed && (
            <>
              <Panel
                defaultSize="33%"
                className={styles.leftPanel}
                minSize="10%"
              >
                <Flow onCollapse={() => setIsFlowCollapsed(true)} />
              </Panel>
              <Separator className={styles.resizeHandle} />
            </>
          )}

          {/* PANEL 2: Main Content Area */}
          {!isChatCollapsed && (
            <>
              <Panel defaultSize="23%" minSize="10%">
                <Chat onCollapse={() => setIsChatCollapsed(true)} />
              </Panel>
              <Separator className={styles.resizeHandle} />
            </>
          )}

          {/* PANEL 3: Right Context Panel */}
          <Panel defaultSize="43%" minSize="10%" className={styles.rightPanel}>
            <Overview />
          </Panel>
        </Group>
      </div>
    </div>
  );
};

export default Desktop;
