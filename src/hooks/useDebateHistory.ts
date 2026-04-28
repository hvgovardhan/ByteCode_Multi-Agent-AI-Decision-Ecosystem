import { useState, useEffect } from "react";
import axios from "axios";
import type { DebateSession } from "@/types/debate";

export function useDebateHistory() {
  const [debates, setDebates] = useState<DebateSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get<DebateSession[]>("/api/debate/history")
      .then((res) => setDebates(res.data))
      .catch(() => setError("Failed to load debate history"))
      .finally(() => setLoading(false));
  }, []);

  return { debates, loading, error };
}
