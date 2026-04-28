import { cn } from "@/lib/utils";
import type { DebateStatus } from "@/types/debate";

interface DebateStatusBarProps {
  status: DebateStatus;
  question: string;
}

const STATUS_STEPS: { key: DebateStatus; label: string }[] = [
  { key: "running", label: "Opening Arguments" },
  { key: "cross_examination", label: "Cross-Examination" },
  { key: "moderating", label: "Deliberation" },
  { key: "completed", label: "Verdict" },
];

const STATUS_ORDER: DebateStatus[] = [
  "pending",
  "running",
  "cross_examination",
  "moderating",
  "completed",
];

export default function DebateStatusBar({ status, question }: DebateStatusBarProps) {
  const currentIndex = STATUS_ORDER.indexOf(status);

  return (
    <div className="space-y-3">
      <h1 className="text-lg font-semibold text-center text-foreground/90 max-w-2xl mx-auto">
        "{question}"
      </h1>

      <div className="flex items-center justify-center gap-1">
        {STATUS_STEPS.map((step, i) => {
          const stepIndex = STATUS_ORDER.indexOf(step.key);
          const isCompleted = currentIndex > stepIndex;
          const isActive = currentIndex === stepIndex;

          return (
            <div key={step.key} className="flex items-center gap-1">
              <div
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all",
                  isCompleted
                    ? "bg-primary/20 text-primary"
                    : isActive
                    ? "bg-primary text-primary-foreground animate-pulse"
                    : "bg-secondary text-muted-foreground"
                )}
              >
                {isCompleted && <span>✓</span>}
                {step.label}
              </div>
              {i < STATUS_STEPS.length - 1 && (
                <div
                  className={cn(
                    "h-px w-4 transition-colors",
                    isCompleted ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
