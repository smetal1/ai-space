import type { Editor } from "@tiptap/react";
import { useAppStore } from "@/store/appStore";

interface Props {
  onAction: (action: string) => void;
  editor: Editor | null;
}

const actions = [
  { id: "generate", label: "Generate", icon: "+" },
  { id: "improve", label: "Improve", icon: "\u2191" },
  { id: "summarize", label: "Summarize", icon: "\u2261" },
  { id: "expand", label: "Expand", icon: "\u2194" },
  { id: "edit", label: "Edit Selection", icon: "\u270E" },
];

const formatButtons = [
  { action: "toggleBold", label: "B", style: { fontWeight: 700 } as React.CSSProperties },
  { action: "toggleItalic", label: "I", style: { fontStyle: "italic" } as React.CSSProperties },
  { action: "toggleHeading", label: "H1", style: {} as React.CSSProperties, attrs: { level: 1 } },
  { action: "toggleHeading", label: "H2", style: {} as React.CSSProperties, attrs: { level: 2 } },
  { action: "toggleBulletList", label: "\u2022", style: {} as React.CSSProperties },
  { action: "toggleBlockquote", label: "\u201C", style: {} as React.CSSProperties },
];

export default function CanvasToolbar({ onAction, editor }: Props) {
  const isStreaming = useAppStore((s) => s.isStreaming);

  return (
    <div style={styles.toolbar}>
      <div style={styles.group}>
        {formatButtons.map((btn) => (
          <button
            key={btn.label}
            onClick={() => {
              if (!editor) return;
              const chain = editor.chain().focus() as any;
              if (btn.attrs) {
                chain[btn.action](btn.attrs).run();
              } else {
                chain[btn.action]().run();
              }
            }}
            style={{ ...styles.fmtBtn, ...btn.style }}
            title={btn.action}
          >
            {btn.label}
          </button>
        ))}
      </div>

      <div style={styles.divider} />

      <div style={styles.group}>
        {actions.map((a) => (
          <button
            key={a.id}
            onClick={() => onAction(a.id)}
            disabled={isStreaming}
            style={{
              ...styles.aiBtn,
              opacity: isStreaming ? 0.5 : 1,
            }}
          >
            <span>{a.icon}</span> {a.label}
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
    padding: "8px 16px",
    borderBottom: "1px solid var(--border)",
    background: "var(--bg-tertiary)",
    flexShrink: 0,
    flexWrap: "wrap",
  },
  group: { display: "flex", gap: 4 },
  divider: {
    width: 1,
    height: 24,
    background: "var(--border)",
    margin: "0 8px",
  },
  fmtBtn: {
    width: 32,
    height: 32,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    fontSize: 13,
    background: "transparent",
    color: "var(--text-primary)",
    border: "1px solid transparent",
  },
  aiBtn: {
    padding: "6px 12px",
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 500,
    background: "var(--bg-primary)",
    color: "var(--accent)",
    border: "1px solid var(--border)",
    display: "flex",
    alignItems: "center",
    gap: 4,
    transition: "all 0.15s",
  },
};
