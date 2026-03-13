import { useAppStore } from "@/store/appStore";
import type { Provider, View } from "@/types";

const views: { value: View; label: string }[] = [
  { value: "canvas", label: "Canvas" },
  { value: "code", label: "Code" },
  { value: "split", label: "Split" },
  { value: "agent", label: "Agent" },
];

const providers: { value: Provider; label: string }[] = [
  { value: "claude", label: "Claude" },
  { value: "vllm", label: "vLLM (OSS)" },
];

export default function Header() {
  const { view, setView, provider, setProvider } = useAppStore();

  return (
    <header style={styles.header}>
      <div style={styles.left}>
        <span style={styles.logo}>AI Space</span>
      </div>

      <div style={styles.center}>
        {views.map((v) => (
          <button
            key={v.value}
            onClick={() => setView(v.value)}
            style={{
              ...styles.tab,
              ...(view === v.value ? styles.tabActive : {}),
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      <div style={styles.right}>
        <select
          value={provider}
          onChange={(e) => setProvider(e.target.value as Provider)}
          style={styles.select}
        >
          {providers.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: 52,
    padding: "0 20px",
    borderBottom: "1px solid var(--border)",
    background: "var(--bg-secondary)",
    flexShrink: 0,
  },
  left: { display: "flex", alignItems: "center", gap: 8 },
  logo: { fontWeight: 700, fontSize: 18, color: "var(--accent)" },
  center: {
    display: "flex",
    gap: 4,
    background: "var(--bg-primary)",
    borderRadius: 8,
    padding: 3,
  },
  tab: {
    padding: "6px 16px",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 500,
    background: "transparent",
    color: "var(--text-secondary)",
    transition: "all 0.15s",
  },
  tabActive: {
    background: "var(--accent)",
    color: "#fff",
  },
  right: { display: "flex", alignItems: "center", gap: 8 },
  select: {
    padding: "6px 12px",
    borderRadius: 6,
    border: "1px solid var(--border)",
    background: "var(--bg-primary)",
    color: "var(--text-primary)",
    fontSize: 13,
  },
};
