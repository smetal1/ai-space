"""Code Agent — agentic loop with tool calling via Claude or vLLM."""

import json
from collections.abc import AsyncGenerator

import anthropic
import openai

from app.core.config import settings
from app.services.agent_tools import AGENT_TOOLS, execute_tool

SYSTEM_PROMPT = """You are a powerful code agent running inside AI Space. You can read, write, edit, and search files in the workspace, and run shell commands.

When the user asks you to build something, fix a bug, or perform any coding task:
1. Plan your approach first — explain what you'll do
2. Use tools to explore existing code if needed
3. Implement the solution step by step
4. Verify your work by reading files or running tests

You have access to these tools:
- read_file: Read file contents
- write_file: Create or overwrite a file
- edit_file: Replace a specific string in a file
- list_files: List directory contents
- search_files: Grep for patterns across files
- run_command: Execute shell commands (install deps, run tests, git, etc.)

Always explain what you're doing and why. Be thorough but efficient."""


# ---- Convert our tools to OpenAI function format for vLLM ----

OPENAI_TOOLS = [
    {
        "type": "function",
        "function": {
            "name": t["name"],
            "description": t["description"],
            "parameters": t["input_schema"],
        },
    }
    for t in AGENT_TOOLS
]


async def run_agent(
    task: str,
    messages: list[dict] | None = None,
    provider: str | None = None,
) -> AsyncGenerator[dict, None]:
    """Run the agentic loop, yielding events as they happen.

    Event types:
        {"type": "thinking", "text": "..."}
        {"type": "tool_call", "name": "...", "args": {...}}
        {"type": "tool_result", "name": "...", "result": "..."}
        {"type": "text", "text": "..."}
        {"type": "done"}
        {"type": "error", "text": "..."}
    """
    prov = provider or settings.default_provider

    conversation: list[dict] = messages or []
    if not conversation or conversation[0].get("role") != "user":
        conversation.append({"role": "user", "content": task})
    elif task:
        conversation.append({"role": "user", "content": task})

    max_iterations = 20  # safety limit

    for _iteration in range(max_iterations):
        if prov == "claude":
            async for event in _claude_agent_step(conversation):
                yield event
                if event["type"] == "done":
                    return
                if event["type"] == "error":
                    return
        else:
            async for event in _vllm_agent_step(conversation):
                yield event
                if event["type"] == "done":
                    return
                if event["type"] == "error":
                    return

    yield {"type": "error", "text": "Agent reached maximum iteration limit"}


async def _claude_agent_step(
    conversation: list[dict],
) -> AsyncGenerator[dict, None]:
    """Single Claude API call with tool use. Handles the full tool loop."""
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    try:
        response = await client.messages.create(
            model=settings.claude_model,
            max_tokens=4096,
            system=SYSTEM_PROMPT,
            tools=AGENT_TOOLS,
            messages=conversation,
        )
    except Exception as e:
        yield {"type": "error", "text": str(e)}
        return

    # Process response content blocks
    has_tool_use = False
    assistant_content = response.content
    text_parts = []

    for block in assistant_content:
        if block.type == "text":
            text_parts.append(block.text)
            yield {"type": "text", "text": block.text}
        elif block.type == "tool_use":
            has_tool_use = True
            yield {
                "type": "tool_call",
                "name": block.name,
                "args": block.input,
                "id": block.id,
            }

            # Execute the tool
            result = await execute_tool(block.name, block.input)
            yield {"type": "tool_result", "name": block.name, "result": result}

    # Add assistant message to conversation
    conversation.append({"role": "assistant", "content": assistant_content})

    if has_tool_use:
        # Add tool results and continue the loop
        tool_results = []
        for block in assistant_content:
            if block.type == "tool_use":
                result = await execute_tool(block.name, block.input)
                tool_results.append(
                    {
                        "type": "tool_result",
                        "tool_use_id": block.id,
                        "content": result,
                    }
                )
        conversation.append({"role": "user", "content": tool_results})
        # Don't yield done — the outer loop will call us again
    else:
        yield {"type": "done"}


async def _vllm_agent_step(
    conversation: list[dict],
) -> AsyncGenerator[dict, None]:
    """Single vLLM/OpenAI API call with function calling."""
    client = openai.AsyncOpenAI(
        base_url=settings.vllm_base_url,
        api_key=settings.vllm_api_key,
    )

    # Convert conversation to OpenAI format
    oai_messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for msg in conversation:
        if msg["role"] == "user":
            if isinstance(msg["content"], list):
                # Tool results — convert to OpenAI format
                for item in msg["content"]:
                    if item.get("type") == "tool_result":
                        oai_messages.append(
                            {
                                "role": "tool",
                                "tool_call_id": item["tool_use_id"],
                                "content": item["content"],
                            }
                        )
            else:
                oai_messages.append({"role": "user", "content": msg["content"]})
        elif msg["role"] == "assistant":
            if isinstance(msg["content"], list):
                # Reconstruct assistant message with tool calls
                text_parts = []
                tool_calls = []
                for block in msg["content"]:
                    if hasattr(block, "type"):
                        if block.type == "text":
                            text_parts.append(block.text)
                        elif block.type == "tool_use":
                            tool_calls.append(
                                {
                                    "id": block.id,
                                    "type": "function",
                                    "function": {
                                        "name": block.name,
                                        "arguments": json.dumps(block.input),
                                    },
                                }
                            )
                oai_msg: dict = {
                    "role": "assistant",
                    "content": " ".join(text_parts) if text_parts else None,
                }
                if tool_calls:
                    oai_msg["tool_calls"] = tool_calls
                oai_messages.append(oai_msg)
            else:
                oai_messages.append(
                    {"role": "assistant", "content": msg["content"]}
                )

    try:
        response = await client.chat.completions.create(
            model=settings.vllm_model,
            messages=oai_messages,
            tools=OPENAI_TOOLS,
            max_tokens=4096,
        )
    except Exception as e:
        yield {"type": "error", "text": str(e)}
        return

    choice = response.choices[0]
    message = choice.message

    if message.content:
        yield {"type": "text", "text": message.content}

    if message.tool_calls:
        # Build assistant content for conversation tracking
        conversation.append({"role": "assistant", "content": message.content or ""})

        tool_results = []
        for tc in message.tool_calls:
            args = json.loads(tc.function.arguments)
            yield {"type": "tool_call", "name": tc.function.name, "args": args, "id": tc.id}

            result = await execute_tool(tc.function.name, args)
            yield {"type": "tool_result", "name": tc.function.name, "result": result}

            tool_results.append(
                {
                    "type": "tool_result",
                    "tool_use_id": tc.id,
                    "content": result,
                }
            )

        conversation.append({"role": "user", "content": tool_results})
    else:
        conversation.append(
            {"role": "assistant", "content": message.content or ""}
        )
        yield {"type": "done"}
