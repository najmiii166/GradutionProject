import { useEffect, useState } from "react";
import { api } from "../api/axios";
import Brand from "../components/Brand";
import Button from "../components/Button";
import Toast from "../components/Toast";
import { Home, Users, Clock, LogOut, FileText } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts";

const API_ROOT = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

const buildIdCardSrc = (url) => {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (!url.startsWith("/")) url = "/" + url;
  return `${API_ROOT}${url}`;
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState("overview");
  const [activeRole, setActiveRole] = useState("student");
  const [pending, setPending] = useState([]);
  const [pendingCounts, setPendingCounts] = useState({ students: 0, mentors: 0 });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [selectedUser, setSelectedUser] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [usersList, setUsersList] = useState([]);
const [usersView, setUsersView] = useState("verified");

const fetchUsersByStatus = async (status) => {
  setLoading(true);
  try {
    const { data } = await api.get(`/admin/users`, { params: { status } });
    setUsersList(data.users);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  if (activePage === "users") fetchUsersByStatus(usersView);
}, [activePage, usersView]);


  const [stats, setStats] = useState({
    totalStudents: 0,
    totalMentors: 0,
    totalPending: 0,
  });

  const [analytics, setAnalytics] = useState({
    mentorDepartments: [],
    mentorUniversities: [],
    studentMajors: [],
    studentUniversities: [],
    interestAreas: [],
  });

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "admin") window.location.href = "/login";
    fetchStats();
    fetchAnalytics();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get("/admin/stats");
      setStats(data);
      setPendingCounts({
        students: data.pendingStudents || 0,
        mentors: data.pendingMentors || 0,
      });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const { data } = await api.get("/admin/analytics");
      setAnalytics(data);
    } catch (err) {
      console.error("Analytics fetch error:", err);
    }
  };

  const fetchPending = async (role) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/pending`, { params: { role } });
      setPending(data.users || data);
      if (role === "student")
        setPendingCounts((prev) => ({ ...prev, students: data.users.length }));
      else
        setPendingCounts((prev) => ({ ...prev, mentors: data.users.length }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activePage === "pending") fetchPending(activeRole);
  }, [activePage, activeRole]);

  const openDetails = async (user) => {
    setSelectedUser(user);
    setDetail(null);
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/admin/users/${user._id}`);
      setDetail(data);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedUser(null);
    setDetail(null);
  };

      {activePage === 'reports' && (
        <main className="flex-1 p-8 overflow-auto">
          <ReportsAdminPage api={api} />
        </main>
      )}
  const handleApprove = async (userId) => {
    try {
      await api.post(`/admin/users/${userId}/approve`);
      setToast("User approved ✅");
      setPending((prev) => prev.filter((u) => u._id !== userId));
      closeDetails();
      fetchStats();
      fetchAnalytics();
    } catch {
      setToast("Failed to approve user.");
    }
  };

  const handleReject = async (userId) => {
    try {
      await api.post(`/admin/users/${userId}/reject`);
      setToast("User rejected ❌");
      setPending((prev) => prev.filter((u) => u._id !== userId));
      closeDetails();
      fetchStats();
      fetchAnalytics();
    } catch {
      setToast("Failed to reject user.");
    }
  };

  
  const modalUser = detail?.user || selectedUser;
  const modalProfile = detail?.profile || null;

  return (
    <div className="h-screen bg-slate-950 text-white flex overflow-hidden">

      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900 flex flex-col">
        <div className="px-5 py-5 border-b border-slate-800">
          <Brand />
          <p className="text-[0.7rem] uppercase tracking-widest text-slate-500">Admin Dashboard</p>
        </div>

        <nav className="flex-1 px-3 py-5 space-y-2 text-sm">
          <SidebarButton active={activePage === "overview"} icon={<Home size={15} />} label="Overview" onClick={() => setActivePage("overview")} />
          <SidebarButton active={activePage === "pending"} icon={<Clock size={15} />} label="Pending Users" onClick={() => setActivePage("pending")} />
          <SidebarButton active={activePage === "users"} icon={<Users size={15} />} label="Users " onClick={() => setActivePage("users")}/>
          <SidebarButton icon={<FileText size={15} />} label="Reports" onClick={() => setActivePage('reports')} />
          <SidebarButton icon={<FileText size={15} />} label="Tickets" onClick={() => navigate('/admin/tickets')} />
        </nav>

        <div className="border-t border-slate-800 px-5 py-4 text-xs text-slate-500 flex items-center justify-between">
          <p>Logged in as Admin</p>
          <LogOut
            size={15}
            onClick={() => {
              localStorage.clear();
              window.location.href = "/login";
            }}
            className="text-slate-400 cursor-pointer hover:text-red-400"
          />
        </div>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="border-b border-slate-800 px-8 py-4 flex items-center justify-between">
          <div>
              <h1 className="text-lg font-semibold">
                {activePage === "overview" ? "🏠 Overview" : activePage === "pending" ? "⏳ Pending Users Approval" : activePage === 'reports' ? 'Report' : 'Users'}
              </h1>
              <p className="text-xs text-slate-400">
                {activePage === "overview"
                  ? "Summary of analytics and platform statistics."
                  : activePage === "pending"
                  ? "Review student and mentor account requests"
                  : activePage === 'reports'
                  ? ''
                  : ''}
              </p>
            </div>
        </header>

    {activePage === "overview" ? (
      <OverviewPage stats={stats} analytics={analytics} />
    ) : activePage === "pending" ? (
      <PendingPage {...{
        pending,
        loading,
        activeRole,
        setActiveRole,
        openDetails,
        selectedUser,
        detailLoading,
        modalUser,
        modalProfile,
        handleApprove,
        handleReject,
        closeDetails,
        toast,
        setToast,
        pendingCounts,
      }} />
    ) : activePage === 'reports' ? (
      <ReportsAdminPage api={api} />
    ) : (
      <UsersManagementPage
        users={usersList}
        loading={loading}
        view={usersView}
        setView={setUsersView}
      />
    )}
  </main>
    </div>
  );
}

/* ---------------- Sidebar Button ---------------- */
function SidebarButton({ icon, label, active, onClick, disabled }) {
  return (
    <button
      className={`flex items-center gap-3 px-4 py-2 rounded-lg w-full ${
        active ? "bg-sky-900/50 text-sky-300" : "text-slate-400 hover:text-white hover:bg-slate-800"
      } ${disabled && "opacity-40 cursor-not-allowed"}`}
      onClick={!disabled ? onClick : undefined}
    >
      {icon}
      {label}
    </button>
  );
}


/* ---------------- Overview Page ---------------- */
function OverviewPage({ stats, analytics }) {
  const COLORS = ["#0ea5e9", "#10b981", "#facc15", "#a855f7", "#ef4444", "#06b6d4"];

  // Compute percentages for pie chart
  const total = analytics.studentUniversities?.reduce((sum, v) => sum + v.count, 0) || 1;
  const uniData = analytics.studentUniversities?.map((u) => ({
    ...u,
    percentage: ((u.count / total) * 100).toFixed(1),
  })) || [];

  return (
    <section className="p-6 flex flex-col gap-6 h-full overflow-hidden">

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Total Students" value={stats.totalStudents} icon={<Users size={20} />} />
        <StatCard title="Total Mentors" value={stats.totalMentors} icon={<Home size={20} />} />
        <StatCard title="Pending Accounts" value={stats.totalPending} icon={<Clock size={20} />} />
      </div>

      {/* Charts Area */}
<div className="grid grid-cols-2 gap-6 h-[400px]">

  {/* Line Chart */}
  <ChartBox title="Top Student Majors">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={analytics.studentMajors || []}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
        <XAxis dataKey="_id" stroke="#94a3b8" />
        <YAxis stroke="#94a3b8" />
        <Tooltip />
        <Line type="monotone" dataKey="count" stroke="#38bdf8" strokeWidth={3} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  </ChartBox>

  {/* Top Universities Bar Chart */}
<ChartBox title="Top 5 Universities">
  <ResponsiveContainer width="100%" height="100%">
    <BarChart
      data={[...(analytics.studentUniversities || [])]
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
      }
      margin={{ top: 20, right: 10, left: 0, bottom: 5 }}
    >
      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
      <XAxis
  dataKey="_id"
  stroke="#94a3b8"
  tick={{ fontSize: 8 }}
  interval={0}
  angle={-45}
  textAnchor="end"
  height={60}  // gives more space for text
  tickFormatter={(value) =>
    value.length > 18 ? value.slice(0, 18) + "…" : value
  }
/>

      <YAxis stroke="#94a3b8" />
      <Tooltip />
      <Bar dataKey="count" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
</ChartBox>


</div>



    </section>
  );
}


function StatCard({ title, value, icon }) {
  // Define color set
  const colorThemes = {
    "Total Students": "text-sky-400",
    "Total Mentors": "text-emerald-400",
    "Pending Accounts": "text-amber-400",
  };

  const resolvedColor = colorThemes[title] || "text-slate-300";

  return (
    <div
      className="group p-3 rounded-lg border border-slate-800 bg-slate-900/70
      shadow-sm hover:shadow-md hover:border-opacity-40 transition-all duration-200
      flex items-center gap-3"
    >
      {/* Icon with unique color */}
      <div className={`transition ${resolvedColor}`}>
        {icon}
      </div>

      <div className="flex flex-col leading-tight">
        <p className="text-[0.7rem] tracking-wider text-slate-400 uppercase">
          {title}
        </p>
        <h2 className={`text-xl font-bold transition ${resolvedColor}`}>
          {value}
        </h2>
      </div>
    </div>
  );
}




function ChartBox({ title, children }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 flex flex-col">
      <h3 className="text-sm text-slate-300 mb-2">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}


/* ---------------- Reports Admin Page ---------------- */
function ReportsAdminPage({ api }) {
  // view buttons removed; use `roleFilter` dropdown instead
  const [data, setData] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState('mentor');
  const [datePreset, setDatePreset] = useState('this_month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rows, setRows] = useState([]);
  const [originalRows, setOriginalRows] = useState([]);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [applied, setApplied] = useState(false);
  const [drillType, setDrillType] = useState('none');
  const [drillRows, setDrillRows] = useState([]);
  const [selectedDrill, setSelectedDrill] = useState(null);
  const [uniRatios, setUniRatios] = useState([]);

  useEffect(() => {
    loadMentorReports();
  }, []);

  async function loadMentorReports() {
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
  }

  // removed charts and full-report PDF export per request

  async function loadUserRows() {
    setRowsLoading(true);
    try {
      let start = null;
      let end = null;
      const now = new Date();
      if (datePreset === 'this_month') {
        start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        end = new Date().toISOString();
      } else if (datePreset === 'last_month') {
        const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const last = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        start = first.toISOString();
        end = last.toISOString();
      } else if (datePreset === 'range') {
        if (startDate) start = new Date(startDate).toISOString();
        if (endDate) {
          const d = new Date(endDate);
          d.setHours(23,59,59,999);
          end = d.toISOString();
        }
      }

      const params = { role: roleFilter };
      if (datePreset === 'all') {
        // 'All' removes date filtering and requests full rows
        params.full = true;
      } else {
        if (start) params.start = start;
        if (end) params.end = end;
        params.top = 1000;
      }

      const { data } = await api.get('/admin/reports/users', { params });
      setRows(data.rows || []);
      setOriginalRows(data.rows || []);
      setApplied(true);
    } catch (err) {
      console.error('Failed to load rows', err);
      setRows([]);
    } finally {
      setRowsLoading(false);
    }
  }

  async function loadDrilldown() {
    try {
      let start = null;
      let end = null;
      const now = new Date();
      if (datePreset === 'this_month') {
        start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        end = new Date().toISOString();
      } else if (datePreset === 'last_month') {
        const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const last = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        start = first.toISOString();
        end = last.toISOString();
      } else if (datePreset === 'range') {
        if (startDate) start = new Date(startDate).toISOString();
        if (endDate) {
          const d = new Date(endDate);
          d.setHours(23,59,59,999);
          end = d.toISOString();
        }
      }

      if (drillType === 'topStudentUniversities') {
        const params = { type: 'topStudentUniversities', top: 50 };
        if (datePreset !== 'all') {
          if (start) params.start = start;
          if (end) params.end = end;
        }
        const { data } = await api.get('/admin/reports/drilldown/students', { params });
        setDrillRows(data.rows || []);
      } else if (drillType === 'topStudentAreas') {
        const params = { type: 'topStudentAreas', top: 50 };
        if (datePreset !== 'all') {
          if (start) params.start = start;
          if (end) params.end = end;
        }
        const { data } = await api.get('/admin/reports/drilldown/students', { params });
        setDrillRows(data.rows || []);
      } else {
        setDrillRows([]);
      }
    } catch (err) {
      console.error('Failed to load drilldown', err);
      setDrillRows([]);
    }
  }

  async function loadUniversityRatios() {
    try {
      const { data } = await api.get('/admin/reports/university-ratios');
      setUniRatios(data.rows || []);
    } catch (err) {
      console.error('Failed to load university ratios', err);
      setUniRatios([]);
    }
  }

  async function exportTablePdf() {
    try {
      const mod = await import('jspdf');
      const jsPDF = (mod && (mod.jsPDF || mod.default)) || null;
      if (!jsPDF) throw new Error('jspdf module not found');
      const doc = new jsPDF({ unit: 'px', format: 'a4' });
      const el = document.getElementById('mentor-users-table');
      if (!el) return alert('Table element not found');
      try {
        await doc.html(el, { x: 10, y: 10 });
        doc.save(`users-table-${Date.now()}.pdf`);
      } catch (innerErr) {
        // fallback: simple text PDF dump
        console.warn('html export failed, falling back to text PDF', innerErr);
        const fallback = new jsPDF({ unit: 'pt', format: 'a4' });
        const lines = [];
        const headers = ['Name', 'Email', 'Role', 'Institution', 'Joined'];
        lines.push(headers.join(' | '));
        (rows || []).forEach(r => {
          lines.push([r.name || '-', r.email || '-', r.role || '-', r.institution || '-', r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-'].join(' | '));
        });
        let y = 40;
        fallback.setFontSize(10);
        fallback.text('Users Table', 40, 24);
        lines.forEach(line => {
          fallback.text(line, 40, y);
          y += 12;
          if (y > 750) { y = 40; fallback.addPage(); }
        });
        fallback.save(`users-table-${Date.now()}.pdf`);
      }
    } catch (err) {
      console.error('Export table PDF failed', err);
      alert('Failed to export table PDF: ' + (err?.message || err));
    }
  }

  return (
    <section className="p-6 h-full overflow-auto" id="mentor-report-root">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3"></div>
        <div className="flex items-center gap-2">{/* using role selector below */}</div>
      </div>

      {loading && <div className="text-sm text-slate-400">Loading report...</div>}

      <div id="mentor-report" className="space-y-6">
          <header className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">{applied ? (roleFilter === 'mentor' ? 'Mentors — Report' : roleFilter === 'student' ? 'Students — Report' : 'All Users — Report') : 'Report'}</h2>
              {applied && <p className="text-sm text-slate-400">Generated: {new Date().toLocaleString()}</p>}
            </div>
            <div className="text-right">
              {applied && <p className="text-sm text-slate-400">Scope: {roleFilter === 'mentor' ? 'Mentors' : roleFilter === 'student' ? 'Students' : 'All Users'}</p>}
              {applied && <p className="text-sm text-slate-400">Date: {datePreset === 'range' ? `${startDate || '—'} to ${endDate || '—'}` : datePreset.replace('_',' ')}</p>}
            </div>
          </header>

          {/* Filters Row: Role, Date Preset, Range, Show All, Apply */}
          <div className="mt-4 flex items-center gap-4">
            <div>
              <select aria-label="role" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setApplied(false); }} className="ml-2 bg-slate-800 px-2 py-1 rounded">
                <option value="mentor">Mentors</option>
                <option value="student">Students</option>
                <option value="all">All Users</option>
              </select>
            </div>

            <div>
              <div className="mt-1">
                <select aria-label="date" value={datePreset} onChange={(e)=>{ setDatePreset(e.target.value); setApplied(false); if(e.target.value !== 'range'){ setStartDate(''); setEndDate(''); } }} className="bg-slate-800 px-3 py-1 rounded text-sm">
                  <option value="this_month">This Month</option>
                  <option value="last_month">Last Month</option>
                  <option value="range">Custom Range</option>
                  <option value="all">All</option>
                </select>
              </div>
            </div>

            {datePreset === 'range' && (
              <div className="flex items-center gap-2">
                <input type="date" value={startDate} onChange={(e)=>{ setStartDate(e.target.value); setApplied(false); }} className="bg-slate-800 px-2 py-1 rounded" />
                <span className="text-slate-400">to</span>
                <input type="date" value={endDate} onChange={(e)=>{ setEndDate(e.target.value); setApplied(false); }} className="bg-slate-800 px-2 py-1 rounded" />
              </div>
            )}

            {/* 'Show All' removed; use Date → All to return full list */}

            <div className="ml-4">
              <label className="text-xs text-slate-400 mr-2">Drilldown</label>
              <select value={drillType} onChange={(e)=>{ setDrillType(e.target.value); setApplied(false); }} className="bg-slate-800 px-2 py-1 rounded mr-4 text-sm">
                <option value="none">None</option>
                <option value="topStudentUniversities">Top Universities (Students)</option>
                <option value="topStudentAreas">Top Areas (Students)</option>
              </select>
            </div>

            <div className="ml-auto flex items-center gap-3">
              <button className="px-3 py-1 bg-sky-600 rounded" onClick={async ()=>{ await loadUserRows(); if(drillType !== 'none') await loadDrilldown(); }}>Apply</button>
              <button className="px-3 py-1 bg-green-600 rounded text-white" onClick={()=>exportTablePdf()}>Export Table PDF</button>
              <button className="px-3 py-1 bg-indigo-600 rounded text-white" onClick={loadUniversityRatios}>Student→Mentor Ratio</button>
            </div>
          </div>

          {/* Removed KPIs, charts, heatmap and detailed lists per request */}

          {/* Table view */}
          <section className="bg-slate-900 p-5 rounded">
            <h4 className="text-slate-300 mb-2">Users</h4>
            {/* University ratios view */}
            {uniRatios && uniRatios.length > 0 && (
              <div className="mb-4 rounded border border-slate-800 bg-slate-950/40 p-3">
                <p className="text-sm text-slate-300 mb-2">Student → Mentor Ratios (higher means more students per mentor)</p>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm text-left">
                    <thead className="text-slate-400 text-xs">
                      <tr>
                        <th className="px-2 py-1">University / Institution</th>
                        <th className="px-2 py-1">Students</th>
                        <th className="px-2 py-1">Mentors</th>
                        <th className="px-2 py-1">Student→Mentor Ratio</th>
                      </tr>
                    </thead>
                    <tbody className="text-slate-100">
                      {uniRatios.map((r, i) => (
                        <tr key={i} className="border-t border-slate-800">
                          <td className="px-2 py-1">{r.university}</td>
                          <td className="px-2 py-1">{r.students}</td>
                          <td className="px-2 py-1">{r.mentors}</td>
                          <td className="px-2 py-1">{r.ratio === null ? '—' : r.ratio}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            {/* Drilldown results (Top Universities) */}
            {drillRows && drillRows.length > 0 && (
              <div className="mb-4 rounded border border-slate-800 bg-slate-950/40 p-3">
                <p className="text-sm text-slate-300 mb-2">{drillType === 'topStudentAreas' ? 'Top Areas (Students)' : 'Top Universities (Students)'}</p>
                <div className="flex flex-wrap gap-2">
                  {drillRows.map((d) => (
                    <button key={d._id} onClick={() => {
                      setSelectedDrill(d._id);
                      // filter rows client-side by institution/university or by area
                      if (drillType === 'topStudentUniversities') {
                        setRows((originalRows || []).filter(r => (r.institution || '').toLowerCase() === String(d._id || '').toLowerCase()));
                      } else if (drillType === 'topStudentAreas') {
                        setRows((originalRows || []).filter(r => {
                          const areas = Array.isArray(r.mentorshipAreas) ? r.mentorshipAreas : (r.mentorshipAreas ? [r.mentorshipAreas] : []);
                          return areas.map(a => String(a || '').toLowerCase()).includes(String(d._id || '').toLowerCase());
                        }));
                      }
                    }} className={`px-3 py-1 rounded text-xs ${selectedDrill === d._id ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-200'}`}>
                      {d._id || '—'} <span className="text-[0.7rem] text-slate-400">({d.count})</span>
                    </button>
                  ))}
                  <button onClick={() => { setSelectedDrill(null); setRows(originalRows || []); }} className="px-3 py-1 rounded text-xs bg-gray-700 text-white">Clear</button>
                </div>
              </div>
            )}
            <div className="overflow-x-auto">
              <table id="mentor-users-table" className="min-w-full table-auto divide-y divide-slate-700">
                <thead>
                  <tr className="text-left text-slate-300">
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Role</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">University / Institution</th>
                    <th className="px-3 py-2">Joined</th>
                  </tr>
                </thead>
                <tbody className="text-slate-100">
                  {rowsLoading ? (
                    <tr><td colSpan={5} className="py-4 text-center text-slate-400">Loading rows...</td></tr>
                  ) : rows.length === 0 ? (
                    <tr><td colSpan={5} className="py-4 text-center text-slate-400">No rows. Click Apply to load.</td></tr>
                  ) : rows.map((r) => (
                    <tr key={r._id} className="border-t border-slate-800">
                      <td className="px-3 py-2">{r.name}</td>
                      <td className="px-3 py-2">{r.email}</td>
                      <td className="px-3 py-2">{r.role}</td>
                      <td className="px-3 py-2">{r.status || '-'}</td>
                      <td className="px-3 py-2">{r.institution}</td>
                      <td className="px-3 py-2">{r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

      {/* student-specific view removed; use Role filter and table above */}
    </section>
  );
}


function PendingPage({
  pending,
  loading,
  activeRole,
  setActiveRole,
  openDetails,
  selectedUser,
  detailLoading,
  modalUser,
  modalProfile,
  handleApprove,
  handleReject,
  closeDetails,
  toast,
  setToast,
  pendingCounts,
}) {
  return (
    <section className="px-8 py-8 bg-slate-950">
      {/* Tabs for Students & Mentors */}
      <div className="mb-6 flex items-center gap-4 text-sm">
        {/* Students Tab */}
        <button
          onClick={() => setActiveRole("student")}
          className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full transition-all font-medium
            ${
              activeRole === "student"
                ? "bg-sky-900/60 text-sky-300 border border-sky-800 shadow-sm"
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/50"
            }`}
        >
          Students
          <span
            className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[0.7rem] font-semibold
              ${
                activeRole === "student"
                  ? "bg-sky-500/80 text-white"
                  : "bg-slate-700 text-slate-300"
              }`}
          >
            {pendingCounts.students}
          </span>
        </button>

        {/* Mentors Tab */}
        <button
          onClick={() => setActiveRole("mentor")}
          className={`relative flex items-center gap-2 px-5 py-2.5 rounded-full transition-all font-medium
            ${
              activeRole === "mentor"
                ? "bg-sky-900/60 text-sky-300 border border-sky-800 shadow-sm"
                : "text-slate-400 hover:text-slate-100 hover:bg-slate-900/50"
            }`}
        >
          Mentors
          <span
            className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[0.7rem] font-semibold
              ${
                activeRole === "mentor"
                  ? "bg-sky-500/80 text-white"
                  : "bg-slate-700 text-slate-300"
              }`}
          >
            {pendingCounts.mentors}
          </span>
        </button>
      </div>

      {/* Pending List */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 shadow-lg">
        {loading ? (
          <div className="py-10 text-center text-sm text-slate-400 animate-pulse">
            Loading pending {activeRole === "student" ? "students" : "mentors"}…
          </div>
        ) : pending.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">
            No pending {activeRole === "student" ? "students" : "mentors"} at the moment.
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto max-h-[60vh] custom-scrollbar">

            <table className="min-w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-slate-800 bg-slate-900/60 text-slate-400">
                <tr>
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3">Email</th>
                  <th className="py-2 px-3 hidden sm:table-cell">
                    University / Institution
                  </th>
                  <th className="py-2 px-3 hidden md:table-cell">Requested</th>
                  <th className="py-2 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((u) => (
                  <tr
                    key={u._id}
                    className="border-b border-slate-900/60 hover:bg-slate-900/40 transition"
                  >
                    <td className="py-2 px-3 font-medium text-slate-100">{u.fullName}</td>
                    <td className="py-2 px-3 text-slate-300">{u.email}</td>
                    <td className="py-2 px-3 hidden sm:table-cell text-slate-300">
                      {u.university || u.institution || "—"}
                    </td>
                    <td className="py-2 px-3 hidden md:table-cell text-slate-400 text-xs">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => openDetails(u)}
                        className="rounded-lg border border-slate-600 px-3 py-1 text-xs font-medium text-slate-100 hover:bg-sky-600/20 hover:border-sky-600 transition"
                      >
                        View details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Toast
        message={toast}
        onClose={() => setToast(null)}
        type={
          toast && (toast.includes("approved") || toast.includes("rejected"))
            ? "success"
            : "error"
        }
      />

      {selectedUser && (
        <DetailsModal
          {...{
            modalUser,
            modalProfile,
            detailLoading,
            closeDetails,
            handleApprove,
            handleReject,
          }}
        />
      )}
    </section>
  );
}
function UsersManagementPage({ users, loading, view, setView }) {
  return (
    <section className="px-8 py-8 bg-slate-950">
      {/* Tabs */}
      <div className="mb-6 flex items-center gap-4 text-sm">
        <button
          onClick={() => setView("verified")}
          className={`px-5 py-2.5 rounded-full transition-all font-medium ${
            view === "verified"
              ? "bg-emerald-900/60 text-emerald-300 border border-emerald-700 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-900/50"
          }`}
        >
          Verified Users
        </button>

        <button
          onClick={() => setView("rejected")}
          className={`px-5 py-2.5 rounded-full transition-all font-medium ${
            view === "rejected"
              ? "bg-red-900/60 text-red-300 border border-red-700 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-slate-900/50"
          }`}
        >
          Rejected Users
        </button>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 shadow-lg">
        {loading ? (
          <div className="py-10 text-center text-sm text-slate-400 animate-pulse">
            Loading {view} users…
          </div>
        ) : users.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-400">
            No {view} users found.
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-auto max-h-[60vh] custom-scrollbar">

            <table className="min-w-full text-left text-xs sm:text-sm">
              <thead className="border-b border-slate-800 bg-slate-900/60 text-slate-400">
                <tr>
                  <th className="py-2 px-3">Name</th>
                  <th className="py-2 px-3">Email</th>
                  <th className="py-2 px-3">Role</th>
                  <th className="py-2 px-3">University / Institution</th>
                  <th className="py-2 px-3 hidden md:table-cell">Created</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u._id}
                    className="border-b border-slate-900/60 hover:bg-slate-900/40 transition"
                  >
                    <td className="py-2 px-3 font-medium text-slate-100">{u.fullName}</td>
                    <td className="py-2 px-3 text-slate-300">{u.email}</td>
                    <td className="py-2 px-3 text-slate-300">{u.role}</td>
                    <td className="py-2 px-3 text-slate-300">
                      {u.university || u.institution || "—"}
                    </td>
                    <td className="py-2 px-3 text-slate-400 text-xs hidden md:table-cell">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
}


function DetailsModal({
  modalUser,
  modalProfile,
  detailLoading,
  closeDetails,
  handleApprove,
  handleReject,
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-slate-500 mb-1">
              {modalUser?.role === "mentor" ? "Mentor" : "Student"} Details
            </p>
            <h2 className="text-lg font-semibold text-white">{modalUser?.fullName}</h2>
            <p className="text-xs text-slate-400">{modalUser?.email}</p>
          </div>
          <button
            onClick={closeDetails}
            className="text-slate-500 hover:text-slate-200 text-lg"
          >
            ✕
          </button>
        </div>

        {detailLoading ? (
          <div className="py-8 text-center text-sm text-slate-400 animate-pulse">
            Loading full profile…
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 text-xs text-slate-200 mb-4">
              <InfoItem label="Role" value={modalUser?.role} />
              <InfoItem label="Status" value={modalUser?.status || "pending"} />
              <InfoItem label="University" value={modalUser?.university || "—"} />
              <InfoItem
                label="Created at"
                value={
                  modalUser?.createdAt
                    ? new Date(modalUser.createdAt).toLocaleString()
                    : "—"
                }
              />
            </div>

            {modalUser?.role === "student" && modalProfile && (
              <>
                <h3 className="mt-2 text-xs font-semibold text-slate-300">
                  Student Profile
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <InfoItem label="Major" value={modalProfile.major} />
                  <InfoItem label="Semester" value={modalProfile.semester} />
                </div>
                {modalProfile.idCardUrl && (
                  <div className="mt-3">
                    <p className="text-[0.7rem] text-slate-400 mb-1">Student ID Card</p>
                    <img
                      src={buildIdCardSrc(modalProfile.idCardUrl)}
                      alt="Student ID Card"
                      className="max-h-52 rounded-xl border border-slate-800 object-contain bg-slate-900 shadow-inner"
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  </div>
                )}
              </>
            )}

            {modalUser?.role === "mentor" && modalProfile && (
              <>
                <h3 className="mt-2 text-xs font-semibold text-slate-300">
                  Mentor Profile
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <InfoItem label="Institution" value={modalProfile.institution} />
                  <InfoItem label="Faculty" value={modalProfile.faculty} />
                  <InfoItem label="Department" value={modalProfile.department} />
                  <InfoItem
                    label="Years of Experience"
                    value={modalProfile.yearsOfExperience}
                  />
                </div>
                {modalProfile.bio && (
                  <div className="mt-3">
                    <p className="text-[0.7rem] text-slate-400 mb-1">Bio</p>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {modalProfile.bio}
                    </p>
                  </div>
                )}
              </>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => handleReject(modalUser._id)}
                className="rounded-lg border border-red-500/60 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/10 transition"
              >
                Reject
              </button>
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 px-4 py-1.5 text-xs shadow-sm"
                onClick={() => handleApprove(modalUser._id)}
              >
                Approve
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function InfoItem({ label, value }) {
  return (
    <div>
      <p className="text-[0.7rem] text-slate-400 mb-0.5">{label}</p>
      <p className="text-xs text-slate-100 font-medium">{value || "—"}</p>
    </div>
  );
}
