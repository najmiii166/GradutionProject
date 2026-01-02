import { useEffect, useState, useRef } from "react";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend } from "recharts";
import { api } from "../api/axios";
import { generateReport } from "../api/reportApi";
import jsPDF from "jspdf";

const RANGE_OPTIONS = [
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
  { value: "last30", label: "Last 30 Days" },
  { value: "quarter", label: "This Quarter" },
  { value: "custom", label: "Custom Range" },
];

function KPI({ label, value }) {
  return (
    <div className="bg-slate-900 p-4 rounded shadow-sm flex-1">
      <div className="text-sm text-slate-300">{label}</div>
      <div className="text-2xl font-semibold mt-1 text-white">{value}</div>
    </div>
  );
}

export default function ReportGenerate() {
  const [reportType, setReportType] = useState("Mentor Report");
  const [rangeToken, setRangeToken] = useState("last30");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [metrics, setMetrics] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const reportRef = useRef();

  useEffect(() => {
    // initial fetch: admin stats and analytics
    fetchOverview();
    fetchAnalytics();
  }, []);

  async function fetchOverview() {
    try {
      setError(null);
      const resp = await api.get("/reports/data");
      // resp.data.metrics.global contains totals
      setMetrics({ overview: resp.data.metrics?.global });
    } catch (err) {
      console.error(err);
      setError("Failed to load stats");
    }
  }

  async function fetchAnalytics() {
    try {
      const resp = await api.get("/admin/analytics");
      setAnalytics(resp.data || {});
    } catch (err) {
      console.error(err);
    }
  }

  function buildRangeParams() {
    if (rangeToken !== "custom") return { range: rangeToken };
    return { range: "custom", from: from || null, to: to || null };
  }

  async function refreshForType() {
    setLoading(true);
    setError(null);
    try {
      const payload = { type: reportType, ...buildRangeParams() };
      // Use the report generation endpoint to fetch authoritative metrics for the selected type/range
      const resp = await generateReport(payload);
      const output = resp.data.output || {};
      const returnedMetrics = resp.data.metrics || {};
      setMetrics((prev) => ({ ...prev, scopedReport: returnedMetrics, output }));
    } catch (err) {
      console.error("Refresh error", err);
      setError(err?.message || "Failed to refresh report data");
    } finally {
      setLoading(false);
    }
  }

  function prepareTopMentorsData() {
    const list = metrics?.scopedReport?.topMentors || metrics?.overview?.topMentors || [];
    return list.map((m) => ({ name: m.name || "Unknown", value: m.sessions || m.count || 0 }));
  }

  function prepareAreasData() {
    const supply = metrics?.scopedReport?.areaSupply || metrics?.overview?.areaSupply || {};
    const demand = metrics?.scopedReport?.areaDemand || metrics?.overview?.areaDemand || {};
    const keys = Array.from(new Set([...Object.keys(supply || {}), ...Object.keys(demand || {})]));
    return keys.map((k) => ({ area: k, supply: supply[k] || 0, demand: demand[k] || 0 }));
  }

  async function exportPdf() {
    const doc = new jsPDF({ unit: "px", format: "a4" });
    const el = reportRef.current;
    if (!el) return;
    await doc.html(el, { x: 20, y: 20, html2canvas: { scale: 1 } });
    doc.save("report.pdf");
  }

  async function handleGenerateAndSave() {
    // create and save a formal report (uses server-side AI or fallback)
    setLoading(true);
    try {
      const payload = { type: reportType, ...buildRangeParams() };
      const resp = await generateReport(payload);
      // open generated report view
      const id = resp.data.report?.id;
      if (id) window.open(`/reports/${id}`, "_blank");
    } catch (err) {
      console.error(err);
      setError(err?.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Reports Dashboard</h2>
        <div className="flex items-center gap-3">
          <select value={reportType} onChange={(e) => setReportType(e.target.value)} className="px-3 py-2 bg-slate-800 text-white rounded">
            <option>Mentor Report</option>
            <option>Student Report</option>
            <option>Area Analysis Report</option>
          </select>
          <select value={rangeToken} onChange={(e) => setRangeToken(e.target.value)} className="px-3 py-2 bg-slate-800 text-white rounded">
            {RANGE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          {rangeToken === 'custom' && (
            <div className="flex items-center gap-2">
              <input type="date" value={from} onChange={(e)=>setFrom(e.target.value)} className="px-2 py-1 bg-slate-800 text-white rounded" />
              <input type="date" value={to} onChange={(e)=>setTo(e.target.value)} className="px-2 py-1 bg-slate-800 text-white rounded" />
            </div>
          )}
          <button className="px-4 py-2 bg-sky-500 rounded text-white" onClick={refreshForType} disabled={loading}>{loading ? 'Loading…' : 'Refresh'}</button>
          <button className="px-4 py-2 bg-green-600 rounded text-white" onClick={handleGenerateAndSave}>Save Report</button>
          <button className="px-4 py-2 bg-neutral-700 rounded text-white" onClick={exportPdf}>Export PDF</button>
        </div>
      </div>

      {error && <div className="text-red-400 mb-4">{error}</div>}

      <div ref={reportRef} className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <KPI label="Total Mentors" value={metrics?.overview?.totalMentors ?? "—"} />
          <KPI label="Completed Sessions" value={metrics?.overview?.completedSessions ?? "—"} />
          <KPI label="Pending Requests" value={metrics?.overview?.pendingRequests ?? "—"} />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <KPI label="Total Students" value={metrics?.overview?.totalStudents ?? "—"} />
          <KPI label="Pending Accounts" value={metrics?.overview?.pendingAccounts ?? "—"} />
          <KPI label="Top Mentor Sessions" value={(metrics?.overview?.topMentors && metrics.overview.topMentors[0]?.sessions) || "—"} />
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1 bg-slate-900 p-4 rounded">
            <h4 className="text-sm text-white mb-2">Top Mentors</h4>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={prepareTopMentorsData()} layout="vertical">
                  <XAxis type="number" tick={{ fill: '#e6eef8' }} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fill: '#e6eef8' }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#38bdf8" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="col-span-1 bg-slate-900 p-4 rounded">
            <h4 className="text-sm text-white mb-2">Student Top Areas</h4>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={analytics?.studentMajors || []} dataKey="count" nameKey="_id" cx="50%" cy="50%" outerRadius={70} label>
                    {(analytics?.studentMajors || []).map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={["#60a5fa", "#34d399", "#f97316", "#f43f5e"][idx % 4]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="col-span-1 bg-slate-900 p-4 rounded">
            <h4 className="text-sm text-white mb-2">Top Universities</h4>
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(analytics?.studentUniversities || []).slice(0,8)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="_id" tick={{ fill: '#e6eef8' }} />
                  <YAxis tick={{ fill: '#e6eef8' }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="bg-slate-900 p-4 rounded">
          <h4 className="text-sm text-white mb-2">Supply vs Demand (Areas)</h4>
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={prepareAreasData()} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="area" tick={{ fill: '#e6eef8' }} />
                <YAxis tick={{ fill: '#e6eef8' }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="supply" fill="#60a5fa" />
                <Bar dataKey="demand" fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-1 bg-slate-900 p-4 rounded">
            <h4 className="text-sm text-white mb-2">Key Insights</h4>
            <ul className="list-disc list-inside text-sm">
              {(metrics?.output?.keyInsights || metrics?.output?.insights || []).map((i, idx) => (
                <li key={idx} className="text-gray-100">{i}</li>
              ))}
              {!(metrics?.output?.keyInsights || metrics?.output?.insights || []).length && (
                <li className="text-slate-400">No insights available</li>
              )}
            </ul>
          </div>

          <div className="col-span-1 bg-slate-900 p-4 rounded">
            <h4 className="text-sm text-white mb-2">Risks / Problems</h4>
            <ul className="list-disc list-inside text-sm">
              {(metrics?.output?.risks || []).map((r, idx) => <li key={idx} className="text-rose-300">{r}</li>)}
              {!(metrics?.output?.risks || []).length && <li className="text-slate-400">No risks identified</li>}
            </ul>
          </div>

          <div className="col-span-1 bg-slate-900 p-4 rounded">
            <h4 className="text-sm text-white mb-2">Recommendations</h4>
            <ul className="list-disc list-inside text-sm">
              {(metrics?.output?.recommendations || []).map((r, idx) => <li key={idx} className="text-gray-100">{r}</li>)}
              {!(metrics?.output?.recommendations || []).length && <li className="text-slate-400">No recommendations</li>}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
