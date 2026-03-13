import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/store/appStore";
import { streamChat } from "@/services/api";

export default function ChatPanel() {
  const {
    chatMessages, addChatMessage, appendToLastMessage,
    provider, isStreaming, setIsStreaming,
  } = useAppStore();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    const userMsg = { role: "user" as const, content: input.trim() };
    addChatMessage(userMsg);
    setInput("");
    setIsStreaming(true);

    const allMessages = [...chatMessages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    addChatMessage({ role: "assistant", content: "" });

    await streamChat(allMessages, provider, (chunk) => {
      appendToLastMessage(chunk);
    });
    setIsStreaming(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>Chat</div>
      <div style={styles.messages}>
        {chatMessages.length === 0 && (
          <div style={styles.empty}>
            Ask me anything — generate content, write code, or get help.
          </div>
        )}
        {chatMessages.map((msg, i) => (
          <div
            key={i}
            style={{
              ...styles.message,
              ...(msg.role === "user" ? styles.userMsg : styles.assistantMsg),
            }}
          >
            <div style={styles.role}>{msg.role === "user" ? "You" : "AI"}</div>
            <div style={styles.content}>{msg.content}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div style={styles.inputArea}>
        <input
          style={styles.input}
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          disabled={isStreaming}
        />
        <button
          onClick={handleSend}
          disabled={isStreaming || !input.trim()}
          style={{
            ...styles.sendBtn,
            opacity: isStreaming || !input.trim() ? 0.5 : 1,
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    width: 340,
    borderLeft: "1px solid var(--border)",
    background: "var(--bg-secondary)",
    flexShrink: 0,
  },
  header: {
    padding: "12px 16px",
    fontWeight: 600,
    fontSize: 14,
    borderBottom: "1px solid var(--border)",
  },
  messages: { flex: 1, overflow: "auto", padding: 12 },
  empty: {
    color: "var(--text-secondary)",
    fontSize: 13,
    textAlign: "center",
    padding: "40px 16px",
  },
  message: {
    marginBottom: 12,
    padding: "10px 12px",
    borderRadius: 8,
    fontSize: 13,
    lineHeight: 1.6,
  },
  userMsg: { background: "var(--bg-tertiary)" },
  assistantMsg: { background: "var(--bg-primary)", border: "1px solid var(--border)" },
  role: {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--accent)",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  content: { whiteSpace: "pre-wrap", wordBreak: "break-word" },
  inputArea: {
    display: "flex",
    gap: 8,
    padding: 12,
    borderTop: "1px solid var(--border)",
  },
  input: {
    flex: 1,
    padding: "8px 12px",
    borderRadius: 6,
    border: "1px solid var(--border)",
    background: "var(--bg-primary)",
    color: "var(--text-primary)",
    fontSize: 13,
  },
  sendBtn: {
    padding: "8px 16px",
    borderRadius: 6,
    background: "var(--accent)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 500,
    transition: "all 0.15s",
  },
};
