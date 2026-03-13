import json

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse

from app.models.schemas import CanvasAction, ChatRequest, CodeAction
from app.services.llm_service import canvas_action, code_action, stream_chat

router = APIRouter()


# ---- REST streaming endpoints ----


@router.post("/api/chat")
async def chat(req: ChatRequest):
    messages = [{"role": m.role, "content": m.content} for m in req.messages]

    async def event_stream():
        async for chunk in stream_chat(messages, req.provider):
            yield f"data: {json.dumps({'text': chunk})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/api/canvas")
async def canvas(req: CanvasAction):
    async def event_stream():
        async for chunk in canvas_action(
            req.action, req.content, req.selection, req.provider
        ):
            yield f"data: {json.dumps({'text': chunk})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@router.post("/api/code")
async def code(req: CodeAction):
    async def event_stream():
        async for chunk in code_action(
            req.action, req.code, req.language, req.instruction, req.provider
        ):
            yield f"data: {json.dumps({'text': chunk})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


# ---- WebSocket endpoint for real-time bi-directional streaming ----


@router.websocket("/ws/chat")
async def ws_chat(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            messages = data.get("messages", [])
            provider = data.get("provider")
            async for chunk in stream_chat(messages, provider):
                await websocket.send_json({"type": "chunk", "text": chunk})
            await websocket.send_json({"type": "done"})
    except WebSocketDisconnect:
        pass


@router.websocket("/ws/canvas")
async def ws_canvas(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            async for chunk in canvas_action(
                data.get("action", "generate"),
                data.get("content", ""),
                data.get("selection"),
                data.get("provider"),
            ):
                await websocket.send_json({"type": "chunk", "text": chunk})
            await websocket.send_json({"type": "done"})
    except WebSocketDisconnect:
        pass


@router.websocket("/ws/code")
async def ws_code(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_json()
            async for chunk in code_action(
                data.get("action", "generate"),
                data.get("code", ""),
                data.get("language", "python"),
                data.get("instruction", ""),
                data.get("provider"),
            ):
                await websocket.send_json({"type": "chunk", "text": chunk})
            await websocket.send_json({"type": "done"})
    except WebSocketDisconnect:
        pass
