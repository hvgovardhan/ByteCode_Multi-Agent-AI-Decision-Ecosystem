"""
Celery task that runs the full debate graph asynchronously.
"""
import asyncio
import json
from datetime import datetime

import redis as sync_redis
from celery import Celery
from app.core.config import get_settings

settings = get_settings()

celery_app = Celery(
    "ai_parliament",
    broker=settings.redis_url,
    backend=settings.redis_url,
)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
)


@celery_app.task(bind=True, name="tasks.run_debate")
def run_debate_task(self, debate_id: str, question: str):
    """
    Celery task entry point. Runs the async debate graph in a new event loop.
    """
    asyncio.run(_run_debate_async(debate_id, question))


async def _run_debate_async(debate_id: str, question: str):
    """Async debate execution — initializes DB, runs graph, saves results."""
    from app.core.database import init_db
    from app.models.debate import DebateDocument
    from app.agents.graph import build_debate_graph

    await init_db()

    r = sync_redis.from_url(settings.redis_url, decode_responses=True)

    try:
        # Update status to running
        debate = await DebateDocument.get(debate_id)
        if not debate:
            r.publish(f"debate:{debate_id}", json.dumps({
                "type": "error",
                "data": "Debate not found",
            }))
            return

        debate.status = "running"
        await debate.save()

        # Build and run the graph
        graph = build_debate_graph()
        result = await graph.ainvoke({
            "debate_id": debate_id,
            "question": question,
            "agent_opinions": [],
            "cross_exam_rounds": [],
            "final_verdict": "",
            "current_round": 0,
        })

        # Save results to MongoDB
        debate.agent_opinions = result["agent_opinions"]
        debate.cross_exam_rounds = result.get("cross_exam_rounds", [])
        debate.final_verdict = result.get("final_verdict", "")
        debate.status = "completed"
        debate.completed_at = datetime.utcnow()
        debate.confidence_scores = {
            op.agent: op.confidence for op in result["agent_opinions"]
        }
        await debate.save()

        # Signal completion
        r.publish(f"debate:{debate_id}", json.dumps({"type": "debate_complete"}))

    except Exception as e:
        r.publish(f"debate:{debate_id}", json.dumps({
            "type": "error",
            "data": str(e),
        }))
        # Update DB status
        try:
            debate = await DebateDocument.get(debate_id)
            if debate:
                debate.status = "failed"
                await debate.save()
        except Exception:
            pass
    finally:
        r.close()
