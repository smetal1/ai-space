import { create } from "zustand";
import type { ChatMessage, Provider, View } from "@/types";

interface AppState {
  view: View;
  provider: Provider;
  chatMessages: ChatMessage[];
  canvasContent: string;
  codeContent: string;
  codeLanguage: string;
  isStreaming: boolean;
  setView: (v: View) => void;
  setProvider: (p: Provider) => void;
  addChatMessage: (m: ChatMessage) => void;
  appendToLastMessage: (text: string) => void;
  setCanvasContent: (c: string) => void;
  setCodeContent: (c: string) => void;
  setCodeLanguage: (l: string) => void;
  setIsStreaming: (s: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  view: "split",
  provider: "claude",
  chatMessages: [],
  canvasContent: "",
  codeContent: "",
  codeLanguage: "python",
  isStreaming: false,
  setView: (view) => set({ view }),
  setProvider: (provider) => set({ provider }),
  addChatMessage: (m) =>
    set((s) => ({ chatMessages: [...s.chatMessages, m] })),
  appendToLastMessage: (text) =>
    set((s) => {
      const msgs = [...s.chatMessages];
      const last = msgs[msgs.length - 1];
      if (last && last.role === "assistant") {
        msgs[msgs.length - 1] = { ...last, content: last.content + text };
      }
      return { chatMessages: msgs };
    }),
  setCanvasContent: (canvasContent) => set({ canvasContent }),
  setCodeContent: (codeContent) => set({ codeContent }),
  setCodeLanguage: (codeLanguage) => set({ codeLanguage }),
  setIsStreaming: (isStreaming) => set({ isStreaming }),
}));
