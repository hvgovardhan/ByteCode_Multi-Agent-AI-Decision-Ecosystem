import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Zap } from "lucide-react";

const EXAMPLE_QUESTIONS = [
  "Should a city build a metro or improve its bus network?",
  "Should the government invest in nuclear energy or solar farms?",
  "Should remote work become the default for tech companies?",
  "Should cities ban private cars from downtown areas?",
];

export default function QuestionForm() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const res = await axios.post<{ debate_id: string }>("/api/debate", {
        question: question.trim(),
      });
      navigate(`/debate/${res.data.debate_id}`);
    } catch {
      setError("Failed to start debate. Make sure the backend is running.");
      setLoading(false);
    }
  };

  return (
    <Card className="border-border bg-card w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-center text-xl">
          Ask the Parliament
        </CardTitle>
        <p className="text-center text-sm text-muted-foreground">
          Pose a decision question — AI agents will debate and reach a verdict
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <Textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. Should a city build a metro or improve its bus network?"
            className="min-h-[100px] text-sm"
            disabled={loading}
            aria-label="Debate question"
          />

          {error && (
            <p className="text-sm text-red-400" role="alert">
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !question.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting debate...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Start Debate
              </>
            )}
          </Button>
        </form>

        {/* Example questions */}
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Try an example
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQuestion(q)}
                className="text-xs px-3 py-1.5 rounded-full border border-border hover:border-primary hover:text-primary transition-colors text-muted-foreground"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
