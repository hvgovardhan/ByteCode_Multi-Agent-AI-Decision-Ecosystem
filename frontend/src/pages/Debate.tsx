import { useParams, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { useDebateStream } from "@/hooks/useDebateStream";
import AgentCard from "@/components/AgentCard";
import VerdictCard from "@/components/VerdictCard";
import DebateGraph from "@/components/DebateGraph";
import DebateStatusBar from "@/components/DebateStatusBar";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import { DEBATE_AGENTS } from "@/lib/agentConfig";
import type { AgentRole, AgentStatus } from "@/types/debate";

export default function Debate() {
  const { debateId } = useParams<{ debateId: string }>();
  const [question, setQuestion] = useState("");

  const {
    status,
    activeAgent,
    agentTokens,
    opinions,
    verdict,
    verdictTokens,
    error,
  } = useDebateStream(debateId ?? null);

  // Fetch debate metadata (question) on mount
  useEffect(() => {
    if (!debateId) return;
    axios
      .get<{ question: string }>(`/api/debate/${debateId}`)
      .then((res) => setQuestion(res.data.question))
      .catch(() => setQuestion("Debate in progress..."));
  }, [debateId]);

  const getAgentStatus = (role: AgentRole): AgentStatus => {
    if (activeAgent === role) return "thinking";
    if (opinions.find((o) => o.agent === role)) return "done";
    return "idle";
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center gap-4">
        <Link to="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            New Debate
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xl" role="img" aria-label="Parliament">
            🏛️
          </span>
          <span className="font-semibold">AI Parliament</span>
        </div>
      </header>

      <main className="flex-1 px-4 py-8 max-w-6xl mx-auto w-full space-y-8">
        {/* Status bar */}
        {question && (
          <DebateStatusBar status={status} question={question} />
        )}

        {/* Loading state */}
        {status === "pending" && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Assembling the parliament...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="rounded-lg border border-red-500/50 bg-red-950/20 p-4 text-center">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Agent cards grid */}
        {status !== "pending" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {DEBATE_AGENTS.map((role) => (
              <AgentCard
                key={role}
                role={role}
                status={getAgentStatus(role)}
                isActive={activeAgent === role}
                streamingText={agentTokens[role]}
                opinion={opinions.find((o) => o.agent === role)}
              />
            ))}
          </div>
        )}

        {/* Argument influence graph */}
        {opinions.length > 0 && <DebateGraph opinions={opinions} />}

        {/* Verdict */}
        {(status === "moderating" || status === "completed") && (
          <VerdictCard
            verdict={verdict}
            streamingText={verdictTokens}
            isStreaming={status === "moderating"}
            confidenceScores={
              status === "completed"
                ? Object.fromEntries(
                    opinions.map((o) => [o.agent, o.confidence])
                  ) as Record<AgentRole, number>
                : undefined
            }
          />
        )}
      </main>
    </div>
  );
}
