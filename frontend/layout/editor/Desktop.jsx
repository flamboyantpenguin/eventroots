import { Panel, Group, Separator } from "react-resizable-panels";
import { DeleteForeverOutlined, EditOutlined } from "@mui/icons-material";

import "./Desktop.css";

const Desktop = () => {
  return (
    <>
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
          <Panel
            defaultSize="20%"
            minSize="15%"
            maxSize="30%"
            collapsible={true}
            className="leftPanel"
            groupResizeBehavior="preserve-pixel-size"
          >
            <div className="panelHeader">Workspace</div>
            <nav className="navLinks">
              <div className="navItem active">📍 Dashboard</div>
              <div className="navItem">
                💬 Chat <span className="badge">3</span>
              </div>
              <div className="navItem">📅 Events</div>
              <div className="navItem">⚙️ Settings</div>
            </nav>
          </Panel>

          {/* 2. THE ACTUAL DRAG HANDLE */}
          <Separator className="resize-handle" />

          {/* PANEL 2: Main Content Area */}
          <Panel minSize="40%" className="centerPanel">
            <div className="panelHeader">💬 Team Sync Chat</div>
            <div className="chatContainer">
              <div className="message">
                <span className="avatar">🐧</span>
                <div className="msgBubble">
                  <strong>Penguin</strong>
                  <p>Yo, did we get the new three-pane layout working?</p>
                </div>
              </div>
              <div className="message reply">
                <span className="avatar">🤖</span>
                <div className="msgBubble">
                  <strong>Gemini</strong>
                  <p>Yes sir! Fully resizable and looking sharp.</p>
                </div>
              </div>
            </div>
            <div className="chatInputArea">
              <input
                type="text"
                placeholder="Type a message..."
                className="dummyInput"
              />
            </div>
          </Panel>

          {/* 3. THE ACTUAL DRAG HANDLE */}
          <Separator className="resize-handle" />

          {/* PANEL 3: Right Context Panel */}
          <Panel
            defaultSize="25%"
            minSize="20%"
            maxSize="40%"
            className="rightPanel"
          >
            <div className="panelHeader">📅 Event Editor</div>
            <div className="panelContent">
              <div className="formGroup">
                <label>Event Title</label>
                <input
                  type="text"
                  defaultValue="App Architecture Review"
                  className="dummyInput"
                />
              </div>
              <button className="dummyButton">Save Changes</button>
            </div>
          </Panel>
        </Group>
      </div>
    </>
  );
};

export default Desktop;
