import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUserReports } from "../api/reportApi";
import Toast from "../components/Toast";

export default function ReportsList() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const user = JSON.parse(localStorage.getItem("user") || "{}");
        if (!user._id) return setToast("User not found");
        const { data } = await getUserReports(user._id);
        setReports(data.reports || []);
      } catch (err) {
        console.error(err);
        setToast("Failed to load reports");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Reports</h2>
        <button
          className="px-3 py-1 rounded-full bg-sky-500 text-white"
          onClick={() => navigate("/reports/generate")}
        >
          Generate New Report
        </button>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-sm text-slate-400">Loading…</div>
        ) : reports.length === 0 ? (
          <div className="text-sm text-slate-400">No reports yet.</div>
        ) : (
          reports.map((r) => (
            <div key={r._id} className="card p-4 bg-slate-900/60 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white">{r.title || r.summary || `Report ${r._id}`}</div>
                  <div className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    className="text-sm px-3 py-1 rounded bg-slate-800 text-sky-400"
                    onClick={() => navigate(`/reports/${r._id}`)}
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}
