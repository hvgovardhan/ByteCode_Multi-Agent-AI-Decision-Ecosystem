"""
LangGraph debate graph.
Each node is an agent turn. State flows through all nodes sequentially.
"""
from typing import TypedDict, Annotated
import operator
import json
import asyncio

from langgraph.graph import StateGraph, END
from app.agents.base import run_domain_agent, run_moderator
from app.models.debate import AgentOpinion


class DebateState(TypedDict):
    debate_id: str
    question: str
    agent_opinions: Annotated[list[AgentOpinion], operator.add]
    cross_exam_rounds: Annotated[list[AgentOpinion], operator.add]
    final_verdict: str
    current_round: int


async def economy_node(state: DebateState) -> dict:
    opinion = await run_domain_agent(
        role="economy",
        question=state["question"],
        debate_id=state["debate_id"],
        prior_opinions=[],
    )
    return {"agent_opinions": [opinion]}


async def environment_node(state: DebateState) -> dict:
    opinion = await run_domain_agent(
        role="environment",
        question=state["question"],
        debate_id=state["debate_id"],
        prior_opinions=state["agent_opinions"],
    )
    return {"agent_opinions": [opinion]}


async def citizen_node(state: DebateState) -> dict:
    opinion = await run_domain_agent(
        role="citizen",
        question=state["question"],
        debate_id=state["debate_id"],
        prior_opinions=state["agent_opinions"],
    )
    return {"agent_opinions": [opinion]}


async def cost_node(state: DebateState) -> dict:
    opinion = await run_domain_agent(
        role="cost",
        question=state["question"],
        debate_id=state["debate_id"],
        prior_opinions=state["agent_opinions"],
    )
    return {"agent_opinions": [opinion]}


async def cross_examination_node(state: DebateState) -> dict:
    """Each agent gets one rebuttal round."""
    rebuttals: list[AgentOpinion] = []
    for role in ["economy", "environment", "citizen", "cost"]:
        rebuttal = await run_domain_agent(
            role=role,  # type: ignore
            question=state["question"],
            debate_id=state["debate_id"],
            prior_opinions=state["agent_opinions"],
            is_rebuttal=True,
        )
        rebuttals.append(rebuttal)
    return {"cross_exam_rounds": rebuttals}


async def moderator_node(state: DebateState) -> dict:
    verdict = await run_moderator(
        question=state["question"],
        debate_id=state["debate_id"],
        opinions=state["agent_opinions"],
        rebuttals=state["cross_exam_rounds"],
    )
    return {"final_verdict": verdict}


def build_debate_graph() -> StateGraph:
    graph = StateGraph(DebateState)

    graph.add_node("economy", economy_node)
    graph.add_node("environment", environment_node)
    graph.add_node("citizen", citizen_node)
    graph.add_node("cost", cost_node)
    graph.add_node("cross_examination", cross_examination_node)
    graph.add_node("moderator", moderator_node)

    graph.set_entry_point("economy")
    graph.add_edge("economy", "environment")
    graph.add_edge("environment", "citizen")
    graph.add_edge("citizen", "cost")
    graph.add_edge("cost", "cross_examination")
    graph.add_edge("cross_examination", "moderator")
    graph.add_edge("moderator", END)

    return graph.compile()
