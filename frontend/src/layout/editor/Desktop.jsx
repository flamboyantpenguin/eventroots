import { useState } from "react";
import { Panel, Group, Separator } from "react-resizable-panels";
import { Chat } from "/src/components/editor/Chat";

import { DeleteForeverOutlined, EditOutlined } from "@mui/icons-material";

import "./Desktop.css";

const MOCK_BOT_REPLIES = {
  "Update Guest List Details":
    "Opening the Guest Ledger... \n\nI found **142 confirmed attendees**. Would you like me to filter them by *Dietary Restrictions* or *Seating Chart clusters*?",
  "Add a new item to the timeline":
    "Let's update the itinerary. What time should we slot the new event? \n\nStandard placement for the *Cake Cutting ceremony* is usually right at **08:30 PM**, right before the dance floor opens.",
  "Rearrange the evening itinerary":
    "Understood. Fetching the evening grid...\n\nI can swap the *First Dance* and the *Toast Speeches*. Doing this gives the catering team an extra **15 minutes** to prep the main courses.",
  DEFAULT:
    "I’m processing that request against Saranya's Wedding data nodes right now. \n\nEverything looks perfectly aligned! Let me know if you want to push these updates live to the layout canvas.",
};

const Desktop = () => {
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);

  // 1. Core Chat state mimicking an actual database stream
  const [messages, setMessages] = useState([
    {
      id: "init",
      role: "assistant",
      content:
        "Hi! I am your workspace assistant. Select a suggestion below or type anything to alter the wedding canvas layout.",
    },
  ]);
  const [isStreaming, setIsStreaming] = useState(false);

  // 2. The Mock AI Engine (Streams responses word-by-word)
  const simulateAISender = (userText) => {
    setIsStreaming(true);

    // Pick a tailored response from our mock bank, or fallback to default
    const fullResponseText =
      MOCK_BOT_REPLIES[userText] || MOCK_BOT_REPLIES["DEFAULT"];
    const words = fullResponseText.split(" ");
    let currentWordIndex = 0;

    const botMessageId = Date.now();

    // Create an empty placeholder bubble for the assistant
    setMessages((prev) => [
      ...prev,
      { id: botMessageId, role: "assistant", content: "" },
    ]);

    // Text streaming interval loop
    const streamer = setInterval(() => {
      if (currentWordIndex < words.length) {
        const partialContent = words.slice(0, currentWordIndex + 1).join(" ");

        // Update the target message content dynamically
        setMessages((prev) =>
          prev.map((m) =>
            m.id === botMessageId ? { ...m, content: partialContent } : m,
          ),
        );

        currentWordIndex++;
      } else {
        // Stream completed cleanly
        clearInterval(streamer);
        setIsStreaming(false);
      }
    }, 80); // Adjusting speed of incoming words
  };

  // 3. Action callbacks passed cleanly to the child component
  const handleSendMessage = async (text) => {
    // Instantly append user chat bubble
    const userMessage = { id: Date.now(), role: "human", content: text };
    setMessages((prev) => [...prev, userMessage]);

    // Small delay to simulate server network round-trip before stream begins
    setTimeout(() => {
      simulateAISender(text);
    }, 600);
  };

  const handleClearChat = () => {
    if (!isStreaming) setMessages([]);
  };
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
          {!isChatCollapsed && (
            <>
              <Panel defaultSize={30} minSize={25}>
                <Chat
                  messages={messages}
                  isStreaming={isStreaming}
                  onSendMessage={handleSendMessage}
                  onClearMessages={handleClearChat}
                  onCollapse={() => setIsChatCollapsed(true)}
                />
              </Panel>
            </>
          )}

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
