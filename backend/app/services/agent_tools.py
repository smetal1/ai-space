"""Tools available to the code agent for filesystem and shell operations."""

import asyncio
import os
from pathlib import Path

# Sandboxed workspace root — agent can only operate within this directory
WORKSPACE_ROOT = Path(os.environ.get("AGENT_WORKSPACE", "/tmp/agent-workspace"))
WORKSPACE_ROOT.mkdir(parents=True, exist_ok=True)


def _resolve_path(relative: str) -> Path:
    """Resolve a path relative to workspace root, preventing traversal."""
    resolved = (WORKSPACE_ROOT / relative).resolve()
    if not str(resolved).startswith(str(WORKSPACE_ROOT.resolve())):
        raise PermissionError(f"Path escapes workspace: {relative}")
    return resolved


# ---- Tool definitions for Claude tool_use API ----

AGENT_TOOLS = [
    {
        "name": "read_file",
        "description": "Read the contents of a file in the workspace. Returns the file content as text.",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "Relative path from workspace root",
                }
            },
            "required": ["path"],
        },
    },
    {
        "name": "write_file",
        "description": "Write content to a file in the workspace. Creates parent directories if needed.",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "Relative path from workspace root",
                },
                "content": {
                    "type": "string",
                    "description": "Content to write",
                },
            },
            "required": ["path", "content"],
        },
    },
    {
        "name": "list_files",
        "description": "List files and directories at a path in the workspace.",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "Relative directory path (default: root)",
                    "default": ".",
                }
            },
        },
    },
    {
        "name": "search_files",
        "description": "Search for a text pattern across files in the workspace using grep-like search.",
        "input_schema": {
            "type": "object",
            "properties": {
                "pattern": {
                    "type": "string",
                    "description": "Text or regex pattern to search for",
                },
                "path": {
                    "type": "string",
                    "description": "Directory to search in (default: root)",
                    "default": ".",
                },
                "file_glob": {
                    "type": "string",
                    "description": "File glob pattern (e.g. '*.py')",
                    "default": "*",
                },
            },
            "required": ["pattern"],
        },
    },
    {
        "name": "run_command",
        "description": "Execute a shell command in the workspace directory. Use for running tests, linting, installing packages, git operations, etc. The command runs in a sandboxed environment.",
        "input_schema": {
            "type": "object",
            "properties": {
                "command": {
                    "type": "string",
                    "description": "Shell command to execute",
                },
                "timeout": {
                    "type": "integer",
                    "description": "Timeout in seconds (default: 30, max: 120)",
                    "default": 30,
                },
            },
            "required": ["command"],
        },
    },
    {
        "name": "edit_file",
        "description": "Edit a file by replacing an exact string match with new content.",
        "input_schema": {
            "type": "object",
            "properties": {
                "path": {
                    "type": "string",
                    "description": "Relative path from workspace root",
                },
                "old_string": {
                    "type": "string",
                    "description": "Exact string to find and replace",
                },
                "new_string": {
                    "type": "string",
                    "description": "Replacement string",
                },
            },
            "required": ["path", "old_string", "new_string"],
        },
    },
]


# ---- Tool execution functions ----


async def execute_tool(name: str, args: dict) -> str:
    """Execute a tool and return the result as a string."""
    try:
        if name == "read_file":
            return _read_file(args["path"])
        elif name == "write_file":
            return _write_file(args["path"], args["content"])
        elif name == "list_files":
            return _list_files(args.get("path", "."))
        elif name == "search_files":
            return await _search_files(
                args["pattern"], args.get("path", "."), args.get("file_glob", "*")
            )
        elif name == "run_command":
            return await _run_command(
                args["command"], min(args.get("timeout", 30), 120)
            )
        elif name == "edit_file":
            return _edit_file(args["path"], args["old_string"], args["new_string"])
        else:
            return f"Unknown tool: {name}"
    except Exception as e:
        return f"Error: {type(e).__name__}: {e}"


def _read_file(path: str) -> str:
    resolved = _resolve_path(path)
    if not resolved.exists():
        return f"Error: File not found: {path}"
    if not resolved.is_file():
        return f"Error: Not a file: {path}"
    content = resolved.read_text(errors="replace")
    lines = content.split("\n")
    numbered = "\n".join(f"{i + 1:4d} | {line}" for i, line in enumerate(lines))
    return numbered


def _write_file(path: str, content: str) -> str:
    resolved = _resolve_path(path)
    resolved.parent.mkdir(parents=True, exist_ok=True)
    resolved.write_text(content)
    return f"Written {len(content)} bytes to {path}"


def _list_files(path: str) -> str:
    resolved = _resolve_path(path)
    if not resolved.exists():
        return f"Error: Path not found: {path}"
    if not resolved.is_dir():
        return f"Error: Not a directory: {path}"
    entries = []
    for item in sorted(resolved.iterdir()):
        rel = item.relative_to(WORKSPACE_ROOT)
        suffix = "/" if item.is_dir() else ""
        size = f" ({item.stat().st_size} bytes)" if item.is_file() else ""
        entries.append(f"  {rel}{suffix}{size}")
    if not entries:
        return "(empty directory)"
    return "\n".join(entries)


async def _search_files(pattern: str, path: str, file_glob: str) -> str:
    resolved = _resolve_path(path)
    try:
        proc = await asyncio.create_subprocess_exec(
            "grep",
            "-rn",
            "--include",
            file_glob,
            pattern,
            str(resolved),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        stdout, _ = await asyncio.wait_for(proc.communicate(), timeout=15)
        output = stdout.decode(errors="replace")
        # Make paths relative to workspace
        output = output.replace(str(WORKSPACE_ROOT) + "/", "")
        lines = output.strip().split("\n")
        if len(lines) > 50:
            return "\n".join(lines[:50]) + f"\n... ({len(lines) - 50} more matches)"
        return output.strip() or "No matches found."
    except asyncio.TimeoutError:
        return "Error: Search timed out"


async def _run_command(command: str, timeout: int) -> str:
    proc = await asyncio.create_subprocess_shell(
        command,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
        cwd=str(WORKSPACE_ROOT),
    )
    try:
        stdout, stderr = await asyncio.wait_for(proc.communicate(), timeout=timeout)
    except asyncio.TimeoutError:
        proc.kill()
        return f"Error: Command timed out after {timeout}s"

    result = ""
    if stdout:
        result += stdout.decode(errors="replace")
    if stderr:
        result += "\n[stderr]\n" + stderr.decode(errors="replace")
    result += f"\n[exit code: {proc.returncode}]"

    # Truncate very long outputs
    if len(result) > 10000:
        result = result[:5000] + "\n...(truncated)...\n" + result[-2000:]
    return result.strip()


def _edit_file(path: str, old_string: str, new_string: str) -> str:
    resolved = _resolve_path(path)
    if not resolved.exists():
        return f"Error: File not found: {path}"
    content = resolved.read_text(errors="replace")
    count = content.count(old_string)
    if count == 0:
        return f"Error: String not found in {path}"
    if count > 1:
        return f"Error: Found {count} occurrences — provide more context to make it unique"
    new_content = content.replace(old_string, new_string, 1)
    resolved.write_text(new_content)
    return f"Edited {path}: replaced 1 occurrence"
