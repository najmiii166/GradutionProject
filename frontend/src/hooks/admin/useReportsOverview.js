import { useState, useCallback } from 'react';

// useReportsOverview: loads mentor reports and metrics (verbatim logic)
export default function useReportsOverview(api) {
  const [data, setData] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadMentorReports = useCallback(async () => {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        api.get("/admin/reports/mentors"),
        api.get("/admin/metrics-debug"),
      ]);
      setData(r1.data || {});
      setMetrics(r2.data?.metrics || r2.data || {});
    } catch (err) {
      console.error("Failed to load mentor reports or metrics", err);
      setData(null);
      setMetrics(null);
    } finally {
      setLoading(false);
    }
  }, [api]);

  return {
    data,
    metrics,
    loading,
    loadMentorReports,
    setData,
    setMetrics,
  };
}
