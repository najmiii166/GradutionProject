import { useEffect, useState } from "react";
import { api } from "../api/axios";

export default function useMentorStats(setToast) {
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data } = await api.get("/mentor/stats");
        if (mounted) setStats(data || null);
      } catch {
        setToast && setToast("Failed to load stats.");
      } finally {
        if (mounted) setLoadingStats(false);
      }
    })();

    return () => (mounted = false);
  }, [setToast]);

  return { stats, loadingStats };
}
