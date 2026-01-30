// frontend/src/pages/admin/ReportsAdminPage.jsx
import { useEffect } from "react";
import { 
  FileText, 
  Filter, 
  Download, 
  Users as UsersIcon, 
  Calendar,
  ChevronDown,
  Activity
} from "lucide-react";
import useReportsOverview from "../../hooks/admin/useReportsOverview";
import useReportRows from "../../hooks/admin/useReportRows";
import useReportsDrilldown from "../../hooks/admin/useReportsDrilldown";

export default function ReportsAdminPage({ api }) {
  const { metrics, loading, loadMentorReports } = useReportsOverview(api);
  const {
    roleFilter, setRoleFilter,
    datePreset, setDatePreset,
    startDate, setStartDate,
    endDate, setEndDate,
    rows, setRows,
    originalRows,
    rowsLoading,
    applied, setApplied,
    loadUserRows,
    loadUniversityRatios,
    uniRatios,
    exportTablePdf,
  } = useReportRows(api);

  const {
    drillType, setDrillType,
    drillRows, loadDrilldown,
    selectedDrill, setSelectedDrill,
    applyDrillToRows,
  } = useReportsDrilldown(api, { datePreset, startDate, endDate });

  useEffect(() => {
    loadMentorReports();
  }, [loadMentorReports]);

  const getReportTitle = () => {
    if (!applied) return "System Report";
    const role = roleFilter === 'mentor' ? 'Mentors' : roleFilter === 'student' ? 'Students' : 'Global';
    return `${role} Analysis`;
  };

  return (
    <section className="p-8 h-full overflow-y-auto bg-background custom-scrollbar">
      
      {/* 1. HEADER SECTION */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-cyan-500">
            <FileText size={18} />
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Intelligence Terminal</span>
          </div>
          <h2 className="text-3xl font-light tracking-tight text-foreground">
            {getReportTitle().split(' ')[0]} <span className="italic font-serif text-foreground/40">{getReportTitle().split(' ')[1] || 'Report'}.</span>
          </h2>
          {applied && (
            <p className="text-[10px] text-cyan-500/60 font-bold uppercase tracking-widest mt-1">
              Generated: {new Date().toLocaleString()} • Scope: {roleFilter}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <button 
            onClick={loadUniversityRatios}
            className="px-4 py-2 rounded-xl border border-indigo-500/30 bg-indigo-500/5 text-indigo-400 text-[10px] font-bold uppercase tracking-widest hover:bg-indigo-500 hover:text-white transition-all"
          >
            Analytics Ratio
          </button>
          <button 
            onClick={() => exportTablePdf()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
          >
            <Download size={14} /> Export PDF
          </button>
        </div>
      </header>

      {/* 2. FILTER CONTROL PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border p-4 rounded-2xl space-y-3">
          <label className="text-[10px] uppercase tracking-widest font-bold text-foreground/40 flex items-center gap-2">
            <UsersIcon size={12} /> Target Role
          </label>
          <select 
            value={roleFilter} 
            onChange={(e) => { setRoleFilter(e.target.value); setApplied(false); }}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="mentor">Mentors Only</option>
            <option value="student">Students Only</option>
            <option value="all">Consolidated (All)</option>
          </select>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl space-y-3">
          <label className="text-[10px] uppercase tracking-widest font-bold text-foreground/40 flex items-center gap-2">
            <Calendar size={12} /> Temporal Scope
          </label>
          <select 
            value={datePreset} 
            onChange={(e)=>{ setDatePreset(e.target.value); setApplied(false); }}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="range">Custom Range</option>
            <option value="all">Full History</option>
          </select>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl space-y-3">
          <label className="text-[10px] uppercase tracking-widest font-bold text-foreground/40 flex items-center gap-2">
            <Activity size={12} /> Drilldown Depth
          </label>
          <select 
            value={drillType} 
            onChange={(e)=>{ setDrillType(e.target.value); setApplied(false); }}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="none">Standard Log</option>
            <option value="topStudentUniversities">Top Institutions</option>
            <option value="topStudentAreas">Top Interest Areas</option>
          </select>
        </div>

        <div className="flex items-end pb-1">
          <button 
            onClick={async ()=>{ await loadUserRows(); if(drillType !== 'none') await loadDrilldown(); }}
            className="w-full h-[52px] rounded-2xl bg-foreground text-background text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-cyan-500 hover:text-white transition-all shadow-xl"
          >
            Compile Report
          </button>
        </div>
      </div>

      {/* 3. CUSTOM RANGE PICKER (Conditional) */}
      {datePreset === 'range' && (
        <div className="flex items-center gap-4 mb-8 p-4 bg-cyan-500/5 border border-cyan-500/20 rounded-2xl">
          <input type="date" value={startDate} onChange={(e)=>setStartDate(e.target.value)} className="bg-background border border-border rounded-lg px-4 py-2 text-xs" />
          <span className="text-foreground/20 uppercase text-[10px] font-bold tracking-widest">To</span>
          <input type="date" value={endDate} onChange={(e)=>setEndDate(e.target.value)} className="bg-background border border-border rounded-lg px-4 py-2 text-xs" />
        </div>
      )}

      {/* 4. ANALYTICS RATIOS & DRILLDOWN TAGS */}
      <div className="space-y-6 mb-8">
        {uniRatios && uniRatios.length > 0 && (
          <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-6">
            <h5 className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-4">Saturation Metrics (Student → Mentor)</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {uniRatios.map((r, i) => (
                <div key={i} className="bg-background/50 p-3 rounded-xl border border-indigo-500/10">
                  <p className="text-[10px] text-foreground/40 truncate uppercase font-bold">{r.university}</p>
                  <p className="text-xl font-light text-foreground">{r.ratio || '0.0'} <span className="text-[10px] text-indigo-400 font-bold tracking-tighter">RATIO</span></p>
                </div>
              ))}
            </div>
          </div>
        )}

        {drillRows && drillRows.length > 0 && (
          <div className="flex flex-wrap gap-2 p-4 bg-foreground/[0.02] border border-border rounded-2xl">
            {drillRows.map((d) => (
              <button 
                key={d._id} 
                onClick={() => {
                  setSelectedDrill(d._id);
                  setRows(applyDrillToRows(originalRows, d));
                }}
                className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                  selectedDrill === d._id ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'bg-background border border-border text-foreground/60 hover:border-cyan-500'
                }`}
              >
                {d._id || 'Unknown'} <span className="opacity-40 ml-1">[{d.count}]</span>
              </button>
            ))}
            {selectedDrill && (
              <button onClick={() => { setSelectedDrill(null); setRows(originalRows); }} className="px-4 py-2 text-[10px] font-bold uppercase text-red-500 hover:underline">Reset</button>
            )}
          </div>
        )}
      </div>

      {/* 5. DATA TABLE */}
      <div className="rounded-[2.5rem] border border-border bg-card shadow-xl overflow-hidden">
        <div className="px-8 py-6 border-b border-border bg-foreground/[0.01]">
          <h4 className="text-[10px] uppercase tracking-[0.2em] font-bold text-foreground/40">Compiled Intelligence Logs</h4>
        </div>

        <div className="overflow-x-auto">
        <table
  id="mentor-users-table"
  className="w-full text-left border-collapse"
>

            <thead>
              <tr className="bg-foreground/[0.01] text-[10px] uppercase tracking-widest text-foreground/40 border-b border-border">
                <th className="py-5 px-8 font-bold">Identified User</th>
                <th className="py-5 px-8 font-bold">Role</th>
                <th className="py-5 px-8 font-bold">Affiliation</th>
                <th className="py-5 px-8 font-bold">Status</th>
                <th className="py-5 px-8 font-bold text-right">Entry Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-sm">
              {rowsLoading ? (
                <tr><td colSpan={5} className="py-20 text-center text-foreground/30 animate-pulse tracking-widest uppercase text-[10px] font-bold">Decrypting Records...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="py-20 text-center text-foreground/30 italic font-serif text-lg">No records found for the specified parameters.</td></tr>
              ) : rows.map((r) => (
                <tr key={r._id} className="hover:bg-foreground/[0.01] transition-colors group">
                  <td className="py-6 px-8">
                    <div className="font-semibold text-foreground group-hover:text-cyan-500 transition-colors uppercase text-[11px] tracking-wider">{r.name}</div>
                    <div className="text-[10px] text-foreground/40 lowercase">{r.email}</div>
                  </td>
                  <td className="py-6 px-8">
                    <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase ${r.role === 'mentor' ? 'bg-cyan-500/10 text-cyan-500' : 'bg-purple-500/10 text-purple-500'}`}>
                      {r.role}
                    </span>
                  </td>
                  <td className="py-6 px-8 text-foreground/60 text-xs italic font-serif">{r.institution}</td>
                  <td className="py-6 px-8">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-foreground/40">
                      <div className={`w-1.5 h-1.5 rounded-full ${r.status === 'active' || r.status === 'verified' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {r.status || 'Standard'}
                    </div>
                  </td>
                  <td className="py-6 px-8 text-right text-[10px] font-bold text-foreground/30 tabular-nums">
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}