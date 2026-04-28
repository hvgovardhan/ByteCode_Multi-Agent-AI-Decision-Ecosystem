import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AGENT_CONFIGS } from "@/lib/agentConfig";
import type { AgentRole } from "@/types/debate";

interface VerdictCardProps {
  verdict: string;
  streamingText?: string;
  isStreaming: boolean;
  confidenceScores?: Record<AgentRole, number>;
}

export default function VerdictCard({
  verdict,
  streamingText,
  isStreaming,
  confidenceScores,
}: VerdictCardProps) {
  return (
    <Card className="border-2 border-purple-500 bg-purple-950/40 animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-400">
          <span className="text-2xl" role="img" aria-label="Moderator">
            ⚖️
          </span>
          Final Verdict
          <Badge variant="default" className="ml-auto bg-purple-500/20 text-purple-300">
            MODERATOR
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Streaming verdict */}
        {isStreaming && (
          <div className="text-sm text-foreground/90 leading-relaxed min-h-[80px]">
            {streamingText}
            <span className="inline-block w-0.5 h-4 bg-purple-400 ml-0.5 animate-pulse" />
          </div>
        )}

        {/* Final verdict text */}
        {!isStreaming && verdict && (
          <p className="text-sm text-foreground/90 leading-relaxed">{verdict}</p>
        )}

        {/* Confidence scores per agent */}
        {confidenceScores && !isStreaming && (
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
              Agent Influence Weights
            </p>
            {(Object.entries(confidenceScores) as [AgentRole, number][]).map(
              ([role, score]) => {
                const config = AGENT_CONFIGS[role];
                return (
                  <div key={role} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className={config.textColor}>
                        {config.emoji} {config.label}
                      </span>
                      <span className="text-muted-foreground">{score}%</span>
                    </div>
                    <Progress
                      value={score}
                      indicatorClassName={config.textColor.replace("text-", "bg-")}
                    />
                  </div>
                );
              }
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
