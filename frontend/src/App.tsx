import { useAppStore } from "@/store/appStore";
import Header from "@/components/layout/Header";
import CanvasEditor from "@/components/canvas/CanvasEditor";
import CodeEditor from "@/components/editor/CodeEditor";
import ChatPanel from "@/components/chat/ChatPanel";

export default function App() {
  const view = useAppStore((s) => s.view);

  return (
    <>
      <Header />
      <div style={styles.main}>
        <div style={styles.workspace}>
          {(view === "canvas" || view === "split") && (
            <div style={styles.panel}>
              <CanvasEditor />
            </div>
          )}
          {view === "split" && <div style={styles.divider} />}
          {(view === "code" || view === "split") && (
            <div style={styles.panel}>
              <CodeEditor />
            </div>
          )}
        </div>
        <ChatPanel />
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    flex: 1,
    display: "flex",
    overflow: "hidden",
  },
  workspace: {
    flex: 1,
    display: "flex",
    overflow: "hidden",
  },
  panel: {
    flex: 1,
    overflow: "hidden",
  },
  divider: {
    width: 1,
    background: "var(--border)",
    flexShrink: 0,
  },
};
