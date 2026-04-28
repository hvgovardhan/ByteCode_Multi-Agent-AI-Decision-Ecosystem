import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { AGENT_CONFIGS } from "@/lib/agentConfig";
import type { AgentOpinion, AgentRole, AgentStatus } from "@/types/debate";

interface AgentCardProps {
  role: AgentRole;
  status: AgentStatus;
  streamingText?: string;
  opinion?: AgentOpinion;
  isActive: boolean;
}

export default function AgentCard({
  role,
  status,
  streamingText,
  opinion,
  isActive,
}: AgentCardProps) {
  const config = AGENT_CONFIGS[role];

  return (
    <Card
      className={cn(
        "border-2 transition-all duration-300",
        config.bgColor,
        isActive
          ? `${config.color} animate-pulse-glow`
          : status === "done"
          ? config.color
          : "border-border opacity-60"
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="text-xl" role="img" aria-label={config.label}>
              {config.emoji}
            </span>
            <span className={config.textColor}>{config.label}</span>
          </CardTitle>

          {opinion && (
            <Badge
              variant={
                opinion.stance === "for"
                  ? "for"
                  : opinion.stance === "against"
                  ? "against"
                  : "neutral"
              }
            >
              {opinion.stance.toUpperCase()}
            </Badge>
          )}

          {isActive && (
            <span className="flex h-2 w-2">
              <span
                className={cn(
                  "animate-ping absolute inline-flex h-2 w-2 rounded-full opacity-75",
                  config.textColor.replace("text-", "bg-")
                )}
              />
              <span
                className={cn(
                  "relative inline-flex rounded-full h-2 w-2",
                  config.textColor.replace("text-", "bg-")
                )}
              />
            </span>
          )}
        </div>

        <p className="text-xs text-muted-foreground">{config.description}</p>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Streaming text while agent is speaking */}
        {isActive && streamingText && (
          <div className="text-sm text-foreground/90 leading-relaxed min-h-[60px]">
            {streamingText}
            <span className="inline-block w-0.5 h-4 bg-current ml-0.5 animate-pulse" />
          </div>
        )}

        {/* Final opinion */}
        {opinion && !isActive && (
          <div className="space-y-3 animate-fade-in">
            <p className="text-sm text-foreground/90 leading-relaxed">
              {opinion.summary}
            </p>

            {opinion.arguments.length > 0 && (
              <ul className="space-y-1.5">
                {opinion.arguments.map((arg, i) => (
                  <li key={i} className="flex gap-2 text-xs text-muted-foreground">
                    <span className={cn("mt-0.5 shrink-0", config.textColor)}>
                      •
                    </span>
                    {arg}
                  </li>
                ))}
              </ul>
            )}

            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Confidence</span>
                <span className={config.textColor}>{opinion.confidence}%</span>
              </div>
              <Progress
                value={opinion.confidence}
                indicatorClassName={config.textColor.replace("text-", "bg-")}
              />
            </div>
          </div>
        )}

        {/* Idle state */}
        {status === "idle" && (
          <div className="h-12 flex items-center justify-center">
            <span className="text-xs text-muted-foreground">Waiting to speak...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
