"""
Core agent execution logic using LiteLLM.
Streams tokens to Redis pub/sub as agents generate responses.
"""
import json
import asyncio
import redis as sync_redis
from typing import Literal

import litellm
from app.core.config import get_settings
from app.models.debate import AgentOpinion, AgentRole
from app.agents.prompts import (
    AGENT_SYSTEM_PROMPTS,
    OPINION_FORMAT,
    REBUTTAL_FORMAT,
    VERDICT_FORMAT,
)

settings = get_settings()

# Configure LiteLLM API keys
litellm.api_key = settings.gemini_api_key or settings.groq_api_key


def _get_moderator_model() -> str:
    if settings.gemini_api_key:
        return "gemini/gemini-1.5-flash"
    if settings.groq_api_key:
        return "groq/llama3-8b-8192"
    return "openrouter/meta-llama/llama-3.1-8b-instruct:free"


def _get_domain_model() -> str:
    if settings.groq_api_key:
        return "groq/llama3-8b-8192"
    if settings.gemini_api_key:
        return "gemini/gemini-1.5-flash"
    return "openrouter/meta-llama/llama-3.1-8b-instruct:free"


# Model routing: moderator gets best model, domain agents get fast model
MODEL_MAP = {
    "moderator": _get_moderator_model(),
    "domain": _get_domain_model(),
}


def _get_api_key(model: str) -> str:
    if "gemini" in model:
        return settings.gemini_api_key
    if "groq" in model:
        return settings.groq_api_key
    if "openrouter" in model:
        return settings.openrouter_api_key
    return ""


def _publish(debate_id: str, event: dict):
    """Synchronous Redis publish (used inside sync Celery task context)."""
    r = sync_redis.from_url(settings.redis_url, decode_responses=True)
    r.publish(f"debate:{debate_id}", json.dumps(event))
    r.close()


async def run_domain_agent(
    role: AgentRole,
    question: str,
    debate_id: str,
    prior_opinions: list[AgentOpinion],
    is_rebuttal: bool = False,
) -> AgentOpinion:
    """Run a domain agent and stream tokens to Redis."""
    system_prompt = AGENT_SYSTEM_PROMPTS[role]
    format_prompt = REBUTTAL_FORMAT if is_rebuttal else OPINION_FORMAT

    # Build context from prior opinions
    context = ""
    if prior_opinions:
        context = "\n\nOther agents have argued:\n"
        for op in prior_opinions:
            context += f"\n{op.agent.upper()} ({op.stance}): {op.summary}\n"
            for arg in op.arguments:
                context += f"  - {arg}\n"

    user_message = f"""Question being debated: {question}
{context}
{format_prompt}"""

    event_type = "cross_exam" if is_rebuttal else "agent"
    model = MODEL_MAP["domain"]

    _publish(debate_id, {"type": f"{event_type}_start", "agent": role})

    full_response = ""
    try:
        response = await litellm.acompletion(
            model=model,
            api_key=_get_api_key(model),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            stream=True,
            temperature=0.7,
            max_tokens=600,
        )

        async for chunk in response:
            token = chunk.choices[0].delta.content or ""
            if token:
                full_response += token
                _publish(debate_id, {
                    "type": f"{event_type}_token",
                    "agent": role,
                    "token": token,
                })

    except Exception as e:
        # Fallback opinion on error
        full_response = json.dumps({
            "stance": "neutral",
            "summary": f"Unable to generate opinion: {str(e)}",
            "arguments": [],
            "confidence": 0,
            "influenced_by": [],
        })

    # Parse JSON response
    opinion = _parse_opinion(role, full_response)
    _publish(debate_id, {
        "type": f"{event_type}_done",
        "agent": role,
        "data": opinion.model_dump(),
    })

    return opinion


async def run_moderator(
    question: str,
    debate_id: str,
    opinions: list[AgentOpinion],
    rebuttals: list[AgentOpinion],
) -> str:
    """Run the moderator agent to synthesize and deliver verdict."""
    system_prompt = AGENT_SYSTEM_PROMPTS["moderator"]

    # Build full debate summary
    debate_summary = f"Question: {question}\n\n=== OPENING ARGUMENTS ===\n"
    for op in opinions:
        debate_summary += f"\n{op.agent.upper()} ({op.stance}, confidence: {op.confidence}%):\n"
        debate_summary += f"  {op.summary}\n"
        for arg in op.arguments:
            debate_summary += f"  - {arg}\n"

    if rebuttals:
        debate_summary += "\n=== CROSS-EXAMINATION ===\n"
        for rb in rebuttals:
            debate_summary += f"\n{rb.agent.upper()} rebuttal ({rb.stance}):\n"
            debate_summary += f"  {rb.summary}\n"

    user_message = f"{debate_summary}\n\n{VERDICT_FORMAT}"

    model = MODEL_MAP["moderator"]
    _publish(debate_id, {"type": "moderator_start", "agent": "moderator"})

    full_response = ""
    try:
        response = await litellm.acompletion(
            model=model,
            api_key=_get_api_key(model),
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            stream=True,
            temperature=0.5,
            max_tokens=800,
        )

        async for chunk in response:
            token = chunk.choices[0].delta.content or ""
            if token:
                full_response += token
                _publish(debate_id, {
                    "type": "moderator_token",
                    "agent": "moderator",
                    "token": token,
                })

    except Exception as e:
        full_response = json.dumps({
            "verdict": f"Moderator error: {str(e)}",
            "recommendation": "conditional",
            "confidence": 0,
            "key_factors": [],
        })

    verdict_text = _parse_verdict(full_response)
    _publish(debate_id, {
        "type": "verdict",
        "agent": "moderator",
        "data": verdict_text,
    })

    return verdict_text


def _parse_opinion(role: AgentRole, raw: str) -> AgentOpinion:
    """Extract JSON from LLM response and build AgentOpinion."""
    try:
        # Find JSON block in response
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start != -1 and end > start:
            data = json.loads(raw[start:end])
            return AgentOpinion(
                agent=role,
                stance=data.get("stance", "neutral"),
                summary=data.get("summary", ""),
                arguments=data.get("arguments", []),
                confidence=int(data.get("confidence", 50)),
                influenced_by=data.get("influenced_by", []),
            )
    except (json.JSONDecodeError, ValueError, KeyError):
        pass

    # Fallback: treat entire response as summary
    return AgentOpinion(
        agent=role,
        stance="neutral",
        summary=raw[:300] if raw else "No response generated.",
        arguments=[],
        confidence=50,
        influenced_by=[],
    )


def _parse_verdict(raw: str) -> str:
    """Extract verdict text from moderator response."""
    try:
        start = raw.find("{")
        end = raw.rfind("}") + 1
        if start != -1 and end > start:
            data = json.loads(raw[start:end])
            return data.get("verdict", raw)
    except (json.JSONDecodeError, ValueError):
        pass
    return raw
