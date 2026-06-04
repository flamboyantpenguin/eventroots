import { useState } from "react";
import { Panel, Group, Separator } from "react-resizable-panels";
import { Chat } from "/src/components/editor/Chat";

import { DeleteForeverOutlined, EditOutlined } from "@mui/icons-material";

import "./Desktop.css";
import { Overview } from "../../components/editor/Overview";
import { EventProvider } from "../../context/EventProvider";
import { Flow } from "../../components/editor/Flow";

const Desktop = () => {
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const [isFlowCollapsed, setIsFlowCollapsed] = useState(false);

  return (
    <>
      <EventProvider>
        <div className="navbar">
          <div className="navActions">
            <h1 className="title">Saranya's Wedding</h1>
            <button className="actionsBtn stBtn">
              <EditOutlined />
            </button>
            <button className="actionsBtn deleteBtn">
              <DeleteForeverOutlined />
            </button>
          </div>
          <div className="navActions">
            <button className="profileBtn">
              <img
                src="https://i.pravatar.cc/100"
                alt="Pr"
                className="profileAvatar"
              />
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
              </>
            )}

            {/* 2. THE ACTUAL DRAG HANDLE */}
            <Separator className="resize-handle" />

            {/* PANEL 2: Main Content Area */}
            {!isChatCollapsed && (
              <>
                <Panel defaultSize="23%" minSize="10%">
                  <Chat onCollapse={() => setIsChatCollapsed(true)} />
                </Panel>
              </>
            )}

            {/* 3. THE ACTUAL DRAG HANDLE */}
            <Separator className="resize-handle" />

            {/* PANEL 3: Right Context Panel */}
            <Panel defaultSize="43%" minSize="10%" className="rightPanel">
              <Overview></Overview>
            </Panel>
          </Group>
        </div>
      </EventProvider>
    </>
  );
};

export default Desktop;
