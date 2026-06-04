import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ChatBubbleOutlineOutlined,
  CloseOutlined,
  DeleteForeverOutlined,
} from "@mui/icons-material";
import "./Chat.css"; // Pure CSS styles below

const SUGGESTIONS = [
  "Update Guest List Details",
  "Add a new item to the timeline",
  "Rearrange the evening itinerary",
];

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

export function Chat({ onCollapse }) {
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);

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

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [input]);

  const submit = async () => {
    const t = input.trim();
    if (!t || isStreaming) return;
    setInput("");
    if (handleSendMessage) await handleSendMessage(t);
  };

  return (
    <div className="chatWrapper">
      {/* Header */}
      <div className="chatHeader">
        <div className="headerTitle">
          <ChatBubbleOutlineOutlined fontSize="large" />
          <span>Chat</span>
        </div>
        <div className="headerActions">
          {messages.length > 0 && handleClearChat && (
            <button
              onClick={handleClearChat}
              className="actionBtn deleteBtn"
              title="Clear Chat"
            >
              <DeleteForeverOutlined style={{ fontSize: 20 }} />
            </button>
          )}
          {onCollapse && (
            <button
              onClick={onCollapse}
              className="actionBtn secButton"
              title="Collapse Panel"
            >
              <CloseOutlined style={{ fontSize: 20 }} />
            </button>
          )}
        </div>
      </div>

      {/* Messages Feed */}
      <div className="messagesFeed">
        {messages.length === 0 ? (
          <EmptyState onSelectSuggestion={handleSendMessage} />
        ) : (
          messages.map((m) => <Bubble key={m.id || m.timestamp} msg={m} />)
        )}
        {isStreaming && <TypingDots />}
        <div ref={bottomRef} />
      </div>

      {/* Input Composer */}
      <div className="composerArea">
        <div className="inputContainer">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Type a message..."
            disabled={isStreaming}
            rows={1}
            className="chatTextarea"
          />
          <button
            onClick={submit}
            disabled={!input.trim() || isStreaming}
            className="sendBtn"
          >
            ↑
          </button>
        </div>
        <p className="composerHint">Enter to send · Shift+Enter for new line</p>
      </div>
    </div>
  );
}

function EmptyState({ onSelectSuggestion }) {
  return (
    <div className="emptyState">
      <div className="emptyIcon">✨</div>
      <p className="emptyText">What would you like to update or check?</p>
      <div className="suggestionsList">
        {SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            onClick={() => onSelectSuggestion && onSelectSuggestion(s)}
            className="suggestionBtn"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function Bubble({ msg }) {
  const isUser = msg.role === "human" || msg.role === "user";

  return (
    <div className={`bubbleRow ${isUser ? "rowUser" : "rowAssistant"}`}>
      <div className={`msgBubble ${isUser ? "bubbleUser" : "bubbleAssistant"}`}>
        <div className="bubbleContent">
          {isUser ? (
            <p className="plainText">{msg.content}</p>
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {msg.content}
            </ReactMarkdown>
          )}
        </div>
        <div className="bubbleTime">
          {new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="bubbleRow rowAssistant">
      <div className="msgBubble bubbleAssistant typingIndicator">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="dot"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
