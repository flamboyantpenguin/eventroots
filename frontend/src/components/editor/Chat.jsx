import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useEventContext } from "/src/hooks/event/useEventContext";
import {
  ChatBubbleOutlineOutlined,
  CloseOutlined,
  DeleteForeverOutlined,
} from "@mui/icons-material";
import styles from "./Chat.module.css";

const SUGGESTIONS = [
  "Change event type to Wedding and set budget to 500000",
  "Add a catering step block to my event flow",
  "Set start date to tomorrow at 10 AM",
];

export function Chat({ onCollapse }) {
  // Pulling state and the unified API layer wrapper from our context abstraction
  const { formData, sendWorkspaceMessage } = useEventContext();

  const [input, setInput] = useState("");
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const handleSendMessage = async (text) => {
    if (!text.trim() || isStreaming) return;

    // 1. Append human bubble immediately
    const userMessage = {
      id: `user-${Date.now()}`,
      role: "human",
      content: text,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsStreaming(true);

    try {
      /**
       * 2. Rely purely on context delegation.
       * Your useEventContext / api.js layer takes care of:
       * - Target URL resolution (/api/think/)
       * - Auth headers (Bearer tokens)
       * - JSON stringifying & structure mapping
       * - State syncing (e.g., running updateWholeFormData internally)
       */
      const aiReplyContent = await sendWorkspaceMessage(
        formData.id,
        text.trim(),
      );

      // 3. Append clean AI response string
      const assistantMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: aiReplyContent || "Changes processed successfully.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Generative layer interface error:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          content: `⚠️ Chat Failed: ${error.message}`,
        },
      ]);
    } finally {
      setIsStreaming(false);
    }
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
    await handleSendMessage(t);
  };

  return (
    <div className={styles.chatWrapper}>
      {/* Header */}
      <div className={styles.chatHeader}>
        <div className={styles.headerTitle}>
          <ChatBubbleOutlineOutlined fontSize="large" />
          <span>Workspace Assistant</span>
        </div>
        <div className={styles.headerActions}>
          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className={`${styles.actionBtn} ${styles.deleteBtn}`}
              disabled={isStreaming}
              title="Clear Chat"
            >
              <DeleteForeverOutlined style={{ fontSize: 20 }} />
            </button>
          )}
          {onCollapse && (
            <button
              onClick={onCollapse}
              className={`${styles.actionBtn} ${styles.secButton}`}
              title="Collapse Panel"
            >
              <CloseOutlined style={{ fontSize: 20 }} />
            </button>
          )}
        </div>
      </div>

      {/* Messages Feed */}
      <div className={styles.messagesFeed}>
        {messages.length === 0 ? (
          <EmptyState onSelectSuggestion={handleSendMessage} />
        ) : (
          messages.map((m) => <Bubble key={m.id} msg={m} />)
        )}
        {isStreaming && <TypingDots />}
        <div ref={bottomRef} />
      </div>

      {/* Input Composer */}
      <div className={styles.composerArea}>
        <div className={styles.inputContainer}>
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
            placeholder="Ask the AI to change layout variables..."
            disabled={isStreaming}
            rows={1}
            className={styles.chatTextarea}
          />
          <button
            onClick={submit}
            disabled={!input.trim() || isStreaming}
            className={styles.sendBtn}
          >
            ↑
          </button>
        </div>
        <p className={styles.composerHint}>
          Enter to send · Shift+Enter for newline
        </p>
      </div>
    </div>
  );
}

function EmptyState({ onSelectSuggestion }) {
  return (
    <div className={styles.emptyState}>
      <div className={styles.emptyIcon}>✨</div>
      <p className={styles.emptyText}>
        Modify values or append workflow categories via conversation.
      </p>
      <div className={styles.suggestionsList}>
        {SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            onClick={() => onSelectSuggestion && onSelectSuggestion(s)}
            className={styles.suggestionBtn}
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
    <div
      className={`${styles.bubbleRow} ${isUser ? styles.rowUser : styles.rowAssistant}`}
    >
      <div
        className={`${styles.msgBubble} ${isUser ? styles.bubbleUser : styles.bubbleAssistant}`}
      >
        <div className={styles.bubbleContent}>
          {isUser ? (
            <p className={styles.plainText}>{msg.content}</p>
          ) : (
            <div className={styles.markdownRenderZone}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {msg.content}
              </ReactMarkdown>
            </div>
          )}
        </div>
        <div className={styles.bubbleTime}>
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
    <div className={`${styles.bubbleRow} ${styles.rowAssistant}`}>
      <div
        className={`${styles.msgBubble} ${styles.bubbleAssistant} ${styles.typingIndicator}`}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={styles.dot}
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}
