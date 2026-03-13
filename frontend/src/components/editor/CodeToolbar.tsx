import { useState } from "react";
import { useAppStore } from "@/store/appStore";

interface Props {
  language: string;
  languages: string[];
  onLanguageChange: (lang: string) => void;
  onAction: (action: string, instruction?: string) => void;
}

const codeActions = [
  { id: "generate", label: "Generate" },
  { id: "fix", label: "Fix" },
  { id: "refactor", label: "Refactor" },
  { id: "explain", label: "Explain" },
  { id: "review", label: "Review" },
];

export default function CodeToolbar({ language, languages, onLanguageChange, onAction }: Props) {
  const isStreaming = useAppStore((s) => s.isStreaming);
  const [instruction, setInstruction] = useState("");

  return (
    <div style={styles.toolbar}>
      <select
        value={language}
        onChange={(e) => onLanguageChange(e.target.value)}
        style={styles.select}
      >
        {languages.map((l) => (
          <option key={l} value={l}>{l}</option>
        ))}
      </select>

      <input
        style={styles.input}
        placeholder="Instruction (e.g., 'create a REST API')"
        value={instruction}
        onChange={(e) => setInstruction(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && instruction.trim()) {
            onAction("generate", instruction);
            setInstruction("");
          }
        }}
      />

      <div style={styles.actions}>
        {codeActions.map((a) => (
          <button
            key={a.id}
            onClick={() => {
              onAction(a.id, instruction || undefined);
              if (a.id === "generate") setInstruction("");
            }}
            disabled={isStreaming}
            style={{
              ...styles.btn,
              opacity: isStreaming ? 0.5 : 1,
            }}
          >
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  toolbar: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "8px 12px",
    borderBottom: "1px solid var(--border)",
    background: "var(--bg-tertiary)",
    flexShrink: 0,
    flexWrap: "wrap",
  },
  select: {
    padding: "6px 10px",
    borderRadius: 6,
    border: "1px solid var(--border)",
    background: "var(--bg-primary)",
    color: "var(--text-primary)",
    fontSize: 13,
  },
  input: {
    flex: 1,
    minWidth: 200,
    padding: "7px 12px",
    borderRadius: 6,
    border: "1px solid var(--border)",
    background: "var(--bg-primary)",
    color: "var(--text-primary)",
    fontSize: 13,
  },
  actions: { display: "flex", gap: 4 },
  btn: {
    padding: "6px 12px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 500,
    background: "var(--bg-primary)",
    color: "var(--accent)",
    border: "1px solid var(--border)",
    transition: "all 0.15s",
  },
};
