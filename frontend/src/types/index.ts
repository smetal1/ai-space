export type Provider = "claude" | "vllm";

export type View = "canvas" | "code" | "split" | "agent";

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

export interface AgentRequestPayload {
  task: string;
  provider?: Provider;
}

export interface AgentEvent {
  type: "user" | "text" | "tool_call" | "tool_result" | "done" | "error" | "thinking";
  text?: string;
  name?: string;
  args?: Record<string, unknown>;
  result?: string;
  id?: string;
}
