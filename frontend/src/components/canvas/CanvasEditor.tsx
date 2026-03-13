import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Highlight from "@tiptap/extension-highlight";
import Typography from "@tiptap/extension-typography";
import { useAppStore } from "@/store/appStore";
import { streamCanvas } from "@/services/api";
import CanvasToolbar from "./CanvasToolbar";
import { useEffect } from "react";

export default function CanvasEditor() {
  const { canvasContent, setCanvasContent, provider, isStreaming, setIsStreaming } =
    useAppStore();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: "Start writing or use AI to generate content..." }),
      Highlight,
      Typography,
    ],
    content: canvasContent,
    onUpdate: ({ editor }) => {
      setCanvasContent(editor.getHTML());
    },
  });

  useEffect(() => {
    if (editor && canvasContent && !editor.isFocused) {
      const currentHTML = editor.getHTML();
      if (currentHTML !== canvasContent) {
        editor.commands.setContent(canvasContent, false);
      }
    }
  }, [canvasContent, editor]);

  const handleAction = async (action: string) => {
    if (isStreaming || !editor) return;
    setIsStreaming(true);

    const selection = editor.state.selection;
    const selectedText =
      selection.from !== selection.to
        ? editor.state.doc.textBetween(selection.from, selection.to)
        : undefined;

    const content = selectedText || editor.getText();
    let result = "";

    await streamCanvas(
      { action: action as any, content, selection: selectedText, provider },
      (chunk) => {
        result += chunk;
      },
      () => {
        if (action === "edit" && selectedText) {
          editor.chain().focus().deleteSelection().insertContent(result).run();
        } else {
          editor.commands.setContent(result);
        }
        setCanvasContent(editor.getHTML());
        setIsStreaming(false);
      }
    );
  };

  return (
    <div style={styles.container}>
      <CanvasToolbar onAction={handleAction} editor={editor} />
      <div style={styles.editorWrap}>
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    background: "var(--bg-secondary)",
  },
  editorWrap: {
    flex: 1,
    overflow: "auto",
  },
};
