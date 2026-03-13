from pydantic import BaseModel


class ChatMessage(BaseModel):
    role: str  # "user" | "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    provider: str | None = None  # "claude" | "vllm" — defaults to config
    stream: bool = True


class CanvasAction(BaseModel):
    action: str  # "generate" | "edit" | "summarize" | "expand" | "improve"
    content: str
    selection: str | None = None  # selected text for targeted edits
    provider: str | None = None


class CodeAction(BaseModel):
    action: str  # "generate" | "explain" | "fix" | "refactor" | "review"
    code: str
    language: str = "python"
    instruction: str = ""
    provider: str | None = None
