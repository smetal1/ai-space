import type { AgentEvent, AgentRequestPayload, CanvasActionPayload, ChatMessage, CodeActionPayload } from "@/types";

const BASE = "";

export async function streamFetch(
  url: string,
  body: unknown,
  onChunk: (text: string) => void,
  onDone?: () => void
) {
  const res = await fetch(`${BASE}${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const reader = res.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const payload = line.slice(6);
        if (payload === "[DONE]") {
          onDone?.();
          return;
        }
        try {
          const parsed = JSON.parse(payload);
          onChunk(parsed.text);
        } catch {
          // skip malformed
        }
      }
    }
  }
  onDone?.();
}

export function streamChat(
  messages: ChatMessage[],
  provider: string | undefined,
  onChunk: (text: string) => void,
  onDone?: () => void
) {
  return streamFetch("/api/chat", { messages, provider, stream: true }, onChunk, onDone);
}

export function streamCanvas(
  payload: CanvasActionPayload,
  onChunk: (text: string) => void,
  onDone?: () => void
) {
  return streamFetch("/api/canvas", payload, onChunk, onDone);
}

export function streamCode(
  payload: CodeActionPayload,
  onChunk: (text: string) => void,
  onDone?: () => void
) {
  return streamFetch("/api/code", payload, onChunk, onDone);
}

export async function streamAgent(
  payload: AgentRequestPayload,
  onEvent: (event: AgentEvent) => void,
  onDone?: () => void
) {
  const res = await fetch(`${BASE}/api/agent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const reader = res.body?.getReader();
  if (!reader) return;
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const payload = line.slice(6);
        if (payload === "[DONE]") {
          onDone?.();
          return;
        }
        try {
          const parsed = JSON.parse(payload) as AgentEvent;
          onEvent(parsed);
        } catch {
          // skip malformed
        }
      }
    }
  }
  onDone?.();
}
