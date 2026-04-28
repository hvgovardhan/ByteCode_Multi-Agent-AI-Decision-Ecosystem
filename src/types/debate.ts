export type AgentRole =
  | "economy"
  | "environment"
  | "citizen"
  | "cost"
  | "moderator";

export type AgentStatus = "idle" | "thinking" | "speaking" | "done";

export type DebateStatus =
  | "pending"
  | "running"
  | "cross_examination"
  | "moderating"
  | "completed"
  | "failed";

export interface AgentOpinion {
  agent: AgentRole;
  stance: "for" | "against" | "neutral";
  summary: string;
  arguments: string[];
  confidence: number; // 0–100
  influenced_by: AgentRole[];
}

export interface DebateSession {
  id: string;
  question: string;
  status: DebateStatus;
  agent_opinions: AgentOpinion[];
  cross_exam_rounds: AgentOpinion[];
  final_verdict: string | null;
  confidence_scores: Record<AgentRole, number>;
  created_at: string;
  completed_at: string | null;
}

export interface StreamEvent {
  type:
    | "agent_start"
    | "agent_token"
    | "agent_done"
    | "cross_exam_start"
    | "cross_exam_token"
    | "cross_exam_done"
    | "moderator_start"
    | "moderator_token"
    | "verdict"
    | "debate_complete"
    | "error";
  agent?: AgentRole;
  token?: string;
  data?: unknown;
}
