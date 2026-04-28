from datetime import datetime
from typing import Literal
from beanie import Document
from pydantic import BaseModel, Field
import uuid

AgentRole = Literal["economy", "environment", "citizen", "cost", "moderator"]
DebateStatus = Literal[
    "pending", "running", "cross_examination", "moderating", "completed", "failed"
]


class AgentOpinion(BaseModel):
    agent: AgentRole
    stance: Literal["for", "against", "neutral"] = "neutral"
    summary: str = ""
    arguments: list[str] = Field(default_factory=list)
    confidence: int = 50  # 0–100
    influenced_by: list[AgentRole] = Field(default_factory=list)


class DebateDocument(Document):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    question: str
    status: DebateStatus = "pending"
    agent_opinions: list[AgentOpinion] = Field(default_factory=list)
    cross_exam_rounds: list[AgentOpinion] = Field(default_factory=list)
    final_verdict: str | None = None
    confidence_scores: dict[str, int] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: datetime | None = None

    class Settings:
        name = "debates"
        use_state_management = True
