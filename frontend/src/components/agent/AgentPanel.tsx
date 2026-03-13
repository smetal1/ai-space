import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/store/appStore";
import type { AgentEvent } from "@/types";
import { streamAgent } from "@/services/api";

export default function AgentPanel() {
  const provider = useAppStore((s) => s.provider);
  const [input, setInput] = useState("");
  const [events, setEvents] = useState<AgentEvent[]>([]);
  const [running, setRunning] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events]);

  const handleRun = async () => {
    if (!input.trim() || running) return;
    const task = input.trim();
    setInput("");
    setRunning(true);
    setEvents((prev) => [...prev, { type: "user", text: task }]);

    await streamAgent(
      { task, provider },
      (event) => {
        setEvents((prev) => [...prev, event]);
      },
      () => {
        setRunning(false);
      }
    );
  };

  const handleClear = () => {
    setEvents([]);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span style={styles.title}>Code Agent</span>
        <div style={styles.headerRight}>
          {running && <span style={styles.statusDot} />}
          <button onClick={handleClear} style={styles.clearBtn}>
            Clear
          </button>
        </div>
      </div>

      <div style={styles.events}>
        {events.length === 0 && (
          <div style={styles.empty}>
            <div style={styles.emptyTitle}>Code Agent</div>
            <div style={styles.emptyDesc}>
              Give me a task and I'll plan, code, and execute it autonomously.
              I can read/write files, run commands, and iterate until done.
            </div>
            <div style={styles.examples}>
              <div style={styles.example} onClick={() => setInput("Create a Python FastAPI app with CRUD endpoints for a todo list")}>
                "Create a FastAPI todo app with CRUD endpoints"
              </div>
              <div style={styles.example} onClick={() => setInput("Write unit tests for all Python files in the workspace")}>
                "Write unit tests for all Python files"
              </div>
              <div style={styles.example} onClick={() => setInput("Find and fix any bugs in the codebase")}>
                "Find and fix any bugs in the codebase"
              </div>
            </div>
          </div>
        )}

        {events.map((event, i) => (
          <EventBlock key={i} event={event} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={styles.inputArea}>
        <textarea
          style={styles.input}
          placeholder="Describe your coding task..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleRun();
            }
          }}
          rows={2}
          disabled={running}
        />
        <button
          onClick={handleRun}
          disabled={running || !input.trim()}
          style={{
            ...styles.runBtn,
            opacity: running || !input.trim() ? 0.5 : 1,
          }}
        >
          {running ? "Running..." : "Run Agent"}
        </button>
      </div>
    </div>
  );
}

function EventBlock({ event }: { event: AgentEvent }) {
  const [collapsed, setCollapsed] = useState(false);

  if (event.type === "user") {
    return (
      <div style={styles.eventUser}>
        <div style={styles.eventLabel}>TASK</div>
        <div style={styles.eventText}>{event.text}</div>
      </div>
    );
  }

  if (event.type === "text") {
    return (
      <div style={styles.eventAssistant}>
        <div style={styles.eventLabel}>AGENT</div>
        <div style={{ ...styles.eventText, whiteSpace: "pre-wrap" }}>
          {event.text}
        </div>
      </div>
    );
  }

  if (event.type === "tool_call") {
    return (
      <div style={styles.eventTool}>
        <div
          style={styles.toolHeader}
          onClick={() => setCollapsed(!collapsed)}
        >
          <span style={styles.toolIcon}>{">"}</span>
          <span style={styles.toolName}>{event.name}</span>
          <span style={styles.toolToggle}>{collapsed ? "+" : "-"}</span>
        </div>
        {!collapsed && (
          <pre style={styles.toolArgs}>
            {JSON.stringify(event.args, null, 2)}
          </pre>
        )}
      </div>
    );
  }

  if (event.type === "tool_result") {
    return (
      <div style={styles.eventToolResult}>
        <div
          style={styles.toolResultHeader}
          onClick={() => setCollapsed(!collapsed)}
        >
          <span style={styles.resultIcon}>{"<"}</span>
          <span style={styles.toolName}>{event.name} result</span>
          <span style={styles.toolToggle}>{collapsed ? "+" : "-"}</span>
        </div>
        {!collapsed && (
          <pre style={styles.toolResultContent}>{event.result}</pre>
        )}
      </div>
    );
  }

  if (event.type === "error") {
    return (
      <div style={styles.eventError}>
        <div style={styles.eventLabel}>ERROR</div>
        <div style={styles.eventText}>{event.text}</div>
      </div>
    );
  }

  if (event.type === "done") {
    return (
      <div style={styles.eventDone}>
        Agent completed task
      </div>
    );
  }

  return null;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    background: "var(--bg-secondary)",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 16px",
    borderBottom: "1px solid var(--border)",
    background: "var(--bg-tertiary)",
    flexShrink: 0,
  },
  title: { fontWeight: 600, fontSize: 14 },
  headerRight: { display: "flex", alignItems: "center", gap: 8 },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: "50%",
    background: "var(--success)",
    animation: "pulse 1.5s infinite",
  },
  clearBtn: {
    padding: "4px 10px",
    borderRadius: 4,
    fontSize: 11,
    background: "transparent",
    color: "var(--text-secondary)",
    border: "1px solid var(--border)",
  },
  events: {
    flex: 1,
    overflow: "auto",
    padding: 16,
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  empty: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    padding: "40px 20px",
    gap: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 700,
    color: "var(--accent)",
  },
  emptyDesc: {
    fontSize: 13,
    color: "var(--text-secondary)",
    textAlign: "center",
    maxWidth: 400,
    lineHeight: 1.6,
  },
  examples: {
    display: "flex",
    flexDirection: "column",
    gap: 6,
    marginTop: 12,
    width: "100%",
    maxWidth: 460,
  },
  example: {
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid var(--border)",
    fontSize: 12,
    color: "var(--text-secondary)",
    cursor: "pointer",
    transition: "all 0.15s",
    background: "var(--bg-primary)",
  },
  inputArea: {
    display: "flex",
    gap: 8,
    padding: 12,
    borderTop: "1px solid var(--border)",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--bg-primary)",
    color: "var(--text-primary)",
    fontSize: 13,
    fontFamily: "var(--font)",
    resize: "none",
    lineHeight: 1.5,
  },
  runBtn: {
    padding: "10px 20px",
    borderRadius: 8,
    background: "var(--accent)",
    color: "#fff",
    fontSize: 13,
    fontWeight: 600,
    transition: "all 0.15s",
    whiteSpace: "nowrap",
  },
  // Event styles
  eventUser: {
    padding: "12px 14px",
    borderRadius: 8,
    background: "var(--bg-tertiary)",
    border: "1px solid var(--border)",
  },
  eventAssistant: {
    padding: "12px 14px",
    borderRadius: 8,
    background: "var(--bg-primary)",
    border: "1px solid var(--border)",
  },
  eventLabel: {
    fontSize: 10,
    fontWeight: 700,
    color: "var(--accent)",
    marginBottom: 6,
    letterSpacing: "0.05em",
  },
  eventText: {
    fontSize: 13,
    lineHeight: 1.6,
    wordBreak: "break-word",
  },
  eventTool: {
    borderRadius: 8,
    border: "1px solid #2a4a3a",
    overflow: "hidden",
  },
  toolHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    background: "#1a2e24",
    cursor: "pointer",
    fontSize: 12,
  },
  toolIcon: {
    color: "var(--success)",
    fontWeight: 700,
    fontFamily: "monospace",
  },
  toolName: {
    flex: 1,
    fontWeight: 600,
    color: "var(--success)",
    fontSize: 12,
  },
  toolToggle: {
    color: "var(--text-secondary)",
    fontFamily: "monospace",
    fontSize: 14,
  },
  toolArgs: {
    padding: "8px 12px",
    margin: 0,
    fontSize: 11,
    lineHeight: 1.5,
    background: "#0f1f16",
    color: "#8fbc8f",
    overflow: "auto",
    maxHeight: 200,
    fontFamily: "'Fira Code', 'Cascadia Code', monospace",
  },
  eventToolResult: {
    borderRadius: 8,
    border: "1px solid #2a3a4a",
    overflow: "hidden",
  },
  toolResultHeader: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    background: "#1a2430",
    cursor: "pointer",
    fontSize: 12,
  },
  resultIcon: {
    color: "#6ba3d6",
    fontWeight: 700,
    fontFamily: "monospace",
  },
  toolResultContent: {
    padding: "8px 12px",
    margin: 0,
    fontSize: 11,
    lineHeight: 1.5,
    background: "#0f1820",
    color: "#8fb8d6",
    overflow: "auto",
    maxHeight: 300,
    fontFamily: "'Fira Code', 'Cascadia Code', monospace",
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
  },
  eventError: {
    padding: "12px 14px",
    borderRadius: 8,
    background: "#2a1a1a",
    border: "1px solid var(--danger)",
    color: "var(--danger)",
  },
  eventDone: {
    padding: "8px 14px",
    borderRadius: 8,
    background: "#1a2e24",
    border: "1px solid #2a4a3a",
    color: "var(--success)",
    fontSize: 12,
    fontWeight: 600,
    textAlign: "center",
  },
};
