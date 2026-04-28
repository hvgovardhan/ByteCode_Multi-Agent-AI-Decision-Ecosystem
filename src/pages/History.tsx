import { Link } from "react-router-dom";
import { useDebateHistory } from "@/hooks/useDebateHistory";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2, Clock } from "lucide-react";

export default function History() {
  const { debates, loading, error } = useDebateHistory();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-6 py-4 flex items-center gap-4">
        <Link to="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xl" role="img" aria-label="Parliament">
            🏛️
          </span>
          <span className="font-semibold">Debate History</span>
        </div>
      </header>

      <main className="flex-1 px-4 py-8 max-w-3xl mx-auto w-full">
        {loading && (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}

        {error && (
          <p className="text-center text-red-400 text-sm">{error}</p>
        )}

        {!loading && debates.length === 0 && (
          <div className="text-center py-20 space-y-3">
            <p className="text-4xl">🏛️</p>
            <p className="text-muted-foreground">No debates yet. Start one!</p>
            <Link to="/">
              <Button>Start a Debate</Button>
            </Link>
          </div>
        )}

        <div className="space-y-3">
          {debates.map((debate) => (
            <Link key={debate.id} to={`/debate/${debate.id}`}>
              <Card className="border-border hover:border-primary/50 transition-colors cursor-pointer">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-sm font-medium text-foreground/90 leading-snug">
                      {debate.question}
                    </CardTitle>
                    <Badge
                      variant={
                        debate.status === "completed" ? "default" : "secondary"
                      }
                      className="shrink-0"
                    >
                      {debate.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {new Date(debate.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  {debate.final_verdict && (
                    <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                      {debate.final_verdict}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
