import { useState, useCallback } from "react";
import { api } from "../../api/axios";

export function useAdminStats() {
  const [stats, setStats] = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/stats");
      setStats(data);
      return data;
    } catch (err) {
      console.error("Failed to fetch stats:", err);
      throw err;
    }
  }, []);

  return { stats, fetchStats };
}
