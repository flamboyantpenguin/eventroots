import { useState } from "react";

import "./Phone.module.css";

import { Chat } from "../../components/editor/Chat";
import { Flow } from "../../components/editor/Flow";
import { Overview } from "../../components/editor/Overview";

const Phone = () => {
  const [currentTab, setCurrentTab] = useState("chat");

  return (
    <>
      <div className="mobileWrapper">
        {/* Main Content Viewport based on selected bottom tab */}
        <div className="mobileContent">
          {currentTab === "menu" && (
            <div className="mobilePanel">
              <Flow></Flow>
            </div>
          )}

          {currentTab === "chat" && (
            <div className="mobilePanel">
              <Chat></Chat>
            </div>
          )}

          {currentTab === "events" && (
            <div className="mobilePanel">
              <Overview></Overview>
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
