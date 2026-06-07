import { useState } from "react";
import { useEventContext } from "/src/hooks/event/useEventContext";
import { Panel, Group, Separator } from "react-resizable-panels";
import { Chat } from "/src/components/editor/Chat";
import {
  CheckOutlined,
  DeleteForeverOutlined,
  EditOutlined,
} from "@mui/icons-material";
import { Overview } from "../../components/editor/Overview";
import { Flow } from "../../components/editor/Flow";
import "./Desktop.css";
import { useAuth } from "../../hooks/useAuth";

const Desktop = () => {
  const { user, openProfile } = useAuth();
  const { formData, saveEvent, updateFormData } = useEventContext();
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [isFlowCollapsed, setIsFlowCollapsed] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [transientTitle, setTransientTitle] = useState("");

  // 2. Open edit mode and seed the current title value
  const handleStartEditing = () => {
    setTransientTitle(formData.title || "");
    setIsEditing(true);
  };

  const handleSaveTitle = () => {
    setIsEditing(false);
    const cleanTitle = transientTitle.trim();

    if (!cleanTitle || cleanTitle === formData.title) return;

    // Direct, synchronous updates to your context and backend pipeline
    updateFormData("title", null, cleanTitle);
    saveEvent(formData.id, { title: cleanTitle });
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSaveTitle();
    if (e.key === "Escape") setIsEditing(false);
  };

  return (
    <>
      <div className="navbar">
        <div className="navActions">
          {/* Dynamic Title from our loaded context */}
          {isEditing ? (
            <div
              className="titleEditWrapper"
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <input
                type="text"
                className="m3Input titleInput"
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
              <button className="actionsBtn stBtn" onClick={handleSaveTitle}>
                <CheckOutlined />
              </button>
            </div>
          ) : (
            <>
              {/* Read directly from context here—no local state synchronization needed! */}
              <h1 className="title" onDoubleClick={handleStartEditing}>
                {formData.title || "Untitled Workspace"}
              </h1>
              <button className="actionsBtn stBtn" onClick={handleStartEditing}>
                <EditOutlined />
              </button>
            </>
          )}
          <button className="actionsBtn deleteBtn">
            <DeleteForeverOutlined />
          </button>
        </div>
        <div className="navActions">
          <button className="profileBtn" onClick={openProfile}>
            <img src={user.pfp} alt="Profile" className="profileAvatar" />
          </button>
        </div>
      </div>
      <div className="container">
        <Group orientation="horizontal">
          {/* PANEL 1: Left Menu */}
          {!isFlowCollapsed && (
            <>
              <Panel defaultSize="33%" className="leftPanel" minSize="10%">
                <Flow onCollapse={() => setIsFlowCollapsed(true)} />
              </Panel>
              <Separator className="resize-handle" />
            </>
          )}

          {/* PANEL 2: Main Content Area */}
          {!isChatCollapsed && (
            <>
              <Panel defaultSize="23%" minSize="10%">
                <Chat onCollapse={() => setIsChatCollapsed(true)} />
              </Panel>
              <Separator className="resize-handle" />
            </>
          )}

          {/* PANEL 3: Right Context Panel */}
          <Panel defaultSize="43%" minSize="10%" className="rightPanel">
            <Overview />
          </Panel>
        </Group>
      </div>
    </>
  );
};

export default Desktop;
