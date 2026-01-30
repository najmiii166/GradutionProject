import { useState, useCallback } from "react";
import { api } from "../../api/axios";

export function useAdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      const { data } = await api.get("/admin/analytics");
      setAnalytics(data);
      return data;
    } catch (err) {
      console.error("Analytics fetch error:", err);
      throw err;
    }
  }, []);

  return { analytics, fetchAnalytics };
}
