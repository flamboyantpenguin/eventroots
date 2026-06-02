import { useState } from "react";

import "./Phone.css";

const Phone = () => {
  const [currentTab, setCurrentTab] = useState("chat");

  return (
    <>
      <div className="mobileWrapper">
        {/* Main Content Viewport based on selected bottom tab */}
        <div className="mobileContent">
          {currentTab === "menu" && (
            <div className="mobilePanel">
              <div className="panelHeader">Workspace</div>
              <nav className="navLinks">
                <div className="navItem active">📍 Dashboard</div>
                <div className="navItem">⚙️ Settings</div>
              </nav>
            </div>
          )}

          {currentTab === "chat" && (
            <div className="mobilePanel">
              <div className="panelHeader">💬 Team Sync Chat</div>
              <div className="chatContainer">
                <div className="message">
                  <span className="avatar">🐧</span>
                  <div className="msgBubble">
                    <p>Bottom nav setup is clean!</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentTab === "events" && (
            <div className="mobilePanel">
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
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Bottom Navbar */}
        <nav className="bottomNavbar">
          <button
            className={`navTab ${currentTab === "menu" ? "activeTab" : ""}`}
            onClick={() => setCurrentTab("menu")}
          >
            📁 <span className="tabLabel">Menu</span>
          </button>
          <button
            className={`navTab ${currentTab === "chat" ? "activeTab" : ""}`}
            onClick={() => setCurrentTab("chat")}
          >
            💬 <span className="tabLabel">Chat</span>
          </button>
          <button
            className={`navTab ${currentTab === "events" ? "activeTab" : ""}`}
            onClick={() => setCurrentTab("events")}
          >
            📅 <span className="tabLabel">Events</span>
          </button>
        </nav>
      </div>
    </>
  );
};

export default Phone;
