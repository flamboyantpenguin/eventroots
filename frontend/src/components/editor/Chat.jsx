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

export function Chat({
  messages = [],
  isStreaming = false,
  onSendMessage,
  onClearMessages,
  onCollapse,
}) {
  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

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
    if (onSendMessage) await onSendMessage(t);
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
          {messages.length > 0 && onClearMessages && (
            <button
              onClick={onClearMessages}
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
          <EmptyState onSelectSuggestion={onSendMessage} />
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
        <span className="bubbleLabel">{isUser ? "You" : "Assistant"}</span>
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
