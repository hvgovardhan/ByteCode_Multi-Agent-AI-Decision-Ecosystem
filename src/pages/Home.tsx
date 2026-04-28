import { Link } from "react-router-dom";
import QuestionForm from "@/components/QuestionForm";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl" role="img" aria-label="Parliament">
            🏛️
          </span>
          <span className="font-bold text-lg tracking-tight">AI Parliament</span>
        </div>
        <Link to="/history">
          <Button variant="ghost" size="sm">
            <History className="mr-2 h-4 w-4" />
            History
          </Button>
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16 space-y-10">
        <div className="text-center space-y-4 max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight">
            Multi-Agent AI{" "}
            <span className="text-primary">Decision Ecosystem</span>
          </h1>
          <p className="text-muted-foreground text-lg">
            Specialized AI agents debate your question from every angle — economy,
            environment, citizen satisfaction, and cost — before a moderator
            delivers the final verdict.
          </p>
        </div>

        {/* Agent showcase */}
        <div className="flex flex-wrap justify-center gap-3">
          {[
            { emoji: "📈", label: "Economy", color: "text-emerald-400" },
            { emoji: "🌿", label: "Environment", color: "text-green-400" },
            { emoji: "👥", label: "Citizens", color: "text-blue-400" },
            { emoji: "💰", label: "Cost", color: "text-yellow-400" },
            { emoji: "⚖️", label: "Moderator", color: "text-purple-400" },
          ].map((agent) => (
            <div
              key={agent.label}
              className="flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card text-sm"
            >
              <span className="text-lg" role="img" aria-label={agent.label}>
                {agent.emoji}
              </span>
              <span className={agent.color}>{agent.label}</span>
            </div>
          ))}
        </div>

        <QuestionForm />
      </main>
    </div>
  );
}
