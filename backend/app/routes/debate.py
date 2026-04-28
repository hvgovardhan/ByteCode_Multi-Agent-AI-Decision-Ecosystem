"""
Debate API routes:
  POST /api/debate          — start a new debate
  GET  /api/debate/{id}     — get debate metadata
  GET  /api/debate/{id}/stream — SSE stream of debate events
  GET  /api/debate/history  — list past debates
"""
import asyncio
import json
from datetime import datetime

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.core.config import get_settings
from app.core.redis import get_redis
from app.models.debate import DebateDocument

settings = get_settings()
router = APIRouter(prefix="/api/debate", tags=["debate"])


class StartDebateRequest(BaseModel):
    question: str


class StartDebateResponse(BaseModel):
    debate_id: str


@router.post("", response_model=StartDebateResponse)
async def start_debate(body: StartDebateRequest):
    """Create a debate document and enqueue the Celery task."""
    if not body.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    # Create debate document
    debate = DebateDocument(question=body.question.strip())
    await debate.insert()

    # Enqueue Celery task
    from app.tasks.debate_task import run_debate_task
    run_debate_task.delay(str(debate.id), debate.question)

    return StartDebateResponse(debate_id=str(debate.id))


@router.get("/history")
async def get_history(limit: int = 20):
    """Return recent debates, newest first."""
    debates = (
        await DebateDocument.find_all()
        .sort(-DebateDocument.created_at)
        .limit(limit)
        .to_list()
    )
    return [d.model_dump() for d in debates]


@router.get("/{debate_id}")
async def get_debate(debate_id: str):
    """Return a single debate document."""
    debate = await DebateDocument.get(debate_id)
    if not debate:
        raise HTTPException(status_code=404, detail="Debate not found")
    return debate.model_dump()


@router.get("/{debate_id}/stream")
async def stream_debate(debate_id: str):
    """
    SSE endpoint. Subscribes to Redis pub/sub channel for the debate
    and forwards events to the client.
    """
    debate = await DebateDocument.get(debate_id)
    if not debate:
        raise HTTPException(status_code=404, detail="Debate not found")

    async def event_generator():
        redis = await get_redis()
        pubsub = redis.pubsub()
        await pubsub.subscribe(f"debate:{debate_id}")

        try:
            # If debate already completed, stream stored data
            if debate.status == "completed":
                for opinion in debate.agent_opinions:
                    yield _sse({"type": "agent_done", "agent": opinion.agent, "data": opinion.model_dump()})
                if debate.final_verdict:
                    yield _sse({"type": "verdict", "data": debate.final_verdict})
                yield _sse({"type": "debate_complete"})
                return

            # Stream live events
            timeout_seconds = 180
            elapsed = 0
            interval = 0.1

            while elapsed < timeout_seconds:
                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=0.05)
                if message and message["type"] == "message":
                    data = message["data"]
                    yield _sse(json.loads(data))

                    # Stop streaming on terminal events
                    parsed = json.loads(data)
                    if parsed.get("type") in ("debate_complete", "error"):
                        break

                await asyncio.sleep(interval)
                elapsed += interval

        finally:
            await pubsub.unsubscribe(f"debate:{debate_id}")
            await pubsub.close()

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


def _sse(data: dict) -> str:
    return f"data: {json.dumps(data)}\n\n"
