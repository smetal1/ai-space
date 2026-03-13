from collections.abc import AsyncGenerator

import anthropic
import openai

from app.core.config import settings


def _get_provider(provider: str | None) -> str:
    return provider or settings.default_provider


async def stream_chat(
    messages: list[dict], provider: str | None = None
) -> AsyncGenerator[str, None]:
    prov = _get_provider(provider)
    if prov == "claude":
        async for chunk in _stream_claude(messages):
            yield chunk
    else:
        async for chunk in _stream_vllm(messages):
            yield chunk


async def _stream_claude(messages: list[dict]) -> AsyncGenerator[str, None]:
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    async with client.messages.stream(
        model=settings.claude_model,
        max_tokens=4096,
        messages=messages,
    ) as stream:
        async for text in stream.text_stream:
            yield text


async def _stream_vllm(messages: list[dict]) -> AsyncGenerator[str, None]:
    client = openai.AsyncOpenAI(
        base_url=settings.vllm_base_url,
        api_key=settings.vllm_api_key,
    )
    stream = await client.chat.completions.create(
        model=settings.vllm_model,
        messages=messages,
        stream=True,
        max_tokens=4096,
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta
        if delta.content:
            yield delta.content


# ---- Non-streaming helpers for canvas / code actions ----


CANVAS_PROMPTS = {
    "generate": "Generate well-structured content based on the following prompt:\n\n{content}",
    "edit": "Edit the following content according to the instruction.\n\nContent:\n{content}\n\nInstruction: {selection}",
    "summarize": "Summarize the following content concisely:\n\n{content}",
    "expand": "Expand on the following content with more detail and examples:\n\n{content}",
    "improve": "Improve the writing quality, clarity, and structure of:\n\n{content}",
}

CODE_PROMPTS = {
    "generate": "Generate code in {language}. Respond ONLY with the code, no explanation.\n\nTask: {instruction}",
    "explain": "Explain this {language} code clearly and concisely:\n\n```{language}\n{code}\n```",
    "fix": "Fix any bugs in this {language} code. Respond ONLY with the corrected code:\n\n```{language}\n{code}\n```",
    "refactor": "Refactor this {language} code for better readability and performance. Respond ONLY with the refactored code:\n\n```{language}\n{code}\n```",
    "review": "Review this {language} code. List issues, suggestions, and an overall assessment:\n\n```{language}\n{code}\n```",
}


async def canvas_action(
    action: str,
    content: str,
    selection: str | None = None,
    provider: str | None = None,
) -> AsyncGenerator[str, None]:
    template = CANVAS_PROMPTS.get(action, CANVAS_PROMPTS["generate"])
    prompt = template.format(content=content, selection=selection or "")
    messages = [{"role": "user", "content": prompt}]
    async for chunk in stream_chat(messages, provider):
        yield chunk


async def code_action(
    action: str,
    code: str,
    language: str = "python",
    instruction: str = "",
    provider: str | None = None,
) -> AsyncGenerator[str, None]:
    template = CODE_PROMPTS.get(action, CODE_PROMPTS["generate"])
    prompt = template.format(code=code, language=language, instruction=instruction)
    messages = [{"role": "user", "content": prompt}]
    async for chunk in stream_chat(messages, provider):
        yield chunk
