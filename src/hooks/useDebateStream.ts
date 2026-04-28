import { useEffect, useRef, useState, useCallback } from "react";
import type { StreamEvent, AgentOpinion, AgentRole, DebateStatus } from "@/types/debate";

interface DebateStreamState {
  status: DebateStatus;
  activeAgent: AgentRole | null;
  agentTokens: Record<string, string>;
  opinions: AgentOpinion[];
  verdict: string;
  verdictTokens: string;
  error: string | null;
  isConnected: boolean;
}

export function useDebateStream(debateId: string | null) {
  const [state, setState] = useState<DebateStreamState>({
    status: "pending",
    activeAgent: null,
    agentTokens: {},
    opinions: [],
    verdict: "",
    verdictTokens: "",
    error: null,
    isConnected: false,
  });

  const eventSourceRef = useRef<EventSource | null>(null);

  const connect = useCallback(() => {
    if (!debateId) return;

    const es = new EventSource(`/api/debate/${debateId}/stream`);
    eventSourceRef.current = es;

    es.onopen = () => {
      setState((prev) => ({ ...prev, isConnected: true }));
    };

    es.onmessage = (event) => {
      const parsed: StreamEvent = JSON.parse(event.data);

      setState((prev) => {
        switch (parsed.type) {
          case "agent_start":
            return {
              ...prev,
              status: "running",
              activeAgent: parsed.agent ?? null,
              agentTokens: { ...prev.agentTokens, [parsed.agent!]: "" },
            };

          case "agent_token":
            return {
              ...prev,
              agentTokens: {
                ...prev.agentTokens,
                [parsed.agent!]:
                  (prev.agentTokens[parsed.agent!] ?? "") + (parsed.token ?? ""),
              },
            };

          case "agent_done":
            return {
              ...prev,
              activeAgent: null,
              opinions: [
                ...prev.opinions.filter((o) => o.agent !== parsed.agent),
                parsed.data as AgentOpinion,
              ],
            };

          case "cross_exam_start":
            return { ...prev, status: "cross_examination" };

          case "moderator_start":
            return { ...prev, status: "moderating", activeAgent: "moderator" };

          case "moderator_token":
            return {
              ...prev,
              verdictTokens: prev.verdictTokens + (parsed.token ?? ""),
            };

          case "verdict":
            return {
              ...prev,
              verdict: parsed.data as string,
              activeAgent: null,
            };

          case "debate_complete":
            es.close();
            return { ...prev, status: "completed", isConnected: false };

          case "error":
            es.close();
            return {
              ...prev,
              status: "failed",
              error: parsed.data as string,
              isConnected: false,
            };

          default:
            return prev;
        }
      });
    };

    es.onerror = () => {
      setState((prev) => ({
        ...prev,
        isConnected: false,
        error: "Connection lost. Please refresh.",
      }));
      es.close();
    };
  }, [debateId]);

  useEffect(() => {
    connect();
    return () => {
      eventSourceRef.current?.close();
    };
  }, [connect]);

  return state;
}
