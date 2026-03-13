import Editor from "@monaco-editor/react";
import { useAppStore } from "@/store/appStore";
import { streamCode } from "@/services/api";
import CodeToolbar from "./CodeToolbar";

const LANGUAGES = [
  "python", "javascript", "typescript", "java", "go", "rust",
  "cpp", "c", "html", "css", "json", "yaml", "sql", "bash",
];

export default function CodeEditor() {
  const {
    codeContent, setCodeContent,
    codeLanguage, setCodeLanguage,
    provider, isStreaming, setIsStreaming,
  } = useAppStore();

  const handleAction = async (action: string, instruction?: string) => {
    if (isStreaming) return;
    setIsStreaming(true);
    let result = "";

    await streamCode(
      { action: action as any, code: codeContent, language: codeLanguage, instruction, provider },
      (chunk) => {
        result += chunk;
        // For code generation / fix / refactor, update live
        if (["generate", "fix", "refactor"].includes(action)) {
          setCodeContent(result);
        }
      },
      () => {
        if (["generate", "fix", "refactor"].includes(action)) {
          setCodeContent(result);
        }
        setIsStreaming(false);
      }
    );

    // For explain/review, put result below code as a comment
    if (["explain", "review"].includes(action)) {
      setCodeContent(codeContent + "\n\n# --- AI Output ---\n" + result);
    }
  };

  return (
    <div style={styles.container}>
      <CodeToolbar
        language={codeLanguage}
        languages={LANGUAGES}
        onLanguageChange={setCodeLanguage}
        onAction={handleAction}
      />
      <div style={styles.editorWrap}>
        <Editor
          height="100%"
          language={codeLanguage}
          value={codeContent}
          onChange={(val) => setCodeContent(val || "")}
          theme="vs-dark"
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            padding: { top: 16 },
            wordWrap: "on",
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
          }}
        />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    background: "var(--bg-primary)",
  },
  editorWrap: { flex: 1 },
};
