export type Provider = "claude" | "vllm";

export type View = "canvas" | "code" | "split";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface CanvasActionPayload {
  action: "generate" | "edit" | "summarize" | "expand" | "improve";
  content: string;
  selection?: string;
  provider?: Provider;
}

export interface CodeActionPayload {
  action: "generate" | "explain" | "fix" | "refactor" | "review";
  code: string;
  language?: string;
  instruction?: string;
  provider?: Provider;
}
