// frontend/src/pages/admin/OverviewPage.jsx
import { motion } from "framer-motion";
import { useEffect, useState, useContext } from "react";
import { api } from "../../api/axios";
import DetailsModal from "../../components/admin/DetailsModal";
import StatCard from "../../components/admin/StatCard";
import ChartBox from "../../components/admin/ChartBox";
import { Users, GraduationCap, Clock, TrendingUp, BarChart3, Star } from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import { faculties, universities } from "../../constants/systemData";
import SocketContext from "../../Contexts/SocketContext";

const getUniversityName = (value) => {
  if (!value) return "—";
  const normalized = String(value).trim().toLowerCase();
  const match = universities.find((item) => String(item.key).toLowerCase() === normalized);
  return match?.name || value;
};

export default function OverviewPage({ stats, analytics }) {
  const { socket } = useContext(SocketContext) || {};

  // local state so we can update in realtime when socket events arrive
  const [localStats, setLocalStats] = useState(stats || {});
  const [localAnalytics, setLocalAnalytics] = useState(analytics || {});
  const CHART_COLORS = ["#06b6d4", "#8b5cf6", "#3b82f6", "#2dd4bf"];
  // Partner institutions: show combined students + mentors per university when available
  // use full list from analytics.universityStats and build Top + Other aggregation
  const _fullUni = (localAnalytics.universityStats || []).map(u => ({
    name: u.university || u._id || 'Unknown',
    students: u.students || 0,
    mentors: u.mentors || 0,
    total: (u.students || 0) + (u.mentors || 0),
  }));

  // Show all universities (no "Other" aggregation) — sort by total descending
  const uniData = _fullUni
    .slice()
    .sort((a, b) => (b.total || 0) - (a.total || 0));

  const facultyNameMap = Object.fromEntries(
    faculties.map(faculty => [faculty.key, faculty.name])
  );

  // Build a map of mentorship area keys -> friendly names from faculty.subs
  const areaNameMap = Object.fromEntries(
    faculties.flatMap(f => (f.subs || []).map(s => [s.key, s.name]))
  );

  // default faculty data (kept as fallback)
  const facultyData = (localAnalytics.studentFaculties || [])
    .filter(item => item._id && item.count)
    .map(item => ({
      name: facultyNameMap[item._id] || item._id,
      count: item.count,
    }));

  // Student area (mentorshipAreas) -- fetched from admin drilldown if not supplied
  const [studentAreas, setStudentAreas] = useState([]);
  const [topCompleted, setTopCompleted] = useState([]);
  const [topExpired, setTopExpired] = useState([]);
  const [topRatedMentor, setTopRatedMentor] = useState(null);
  const [sessionSummary, setSessionSummary] = useState({
    total: 0,
    upcoming: 0,
    ongoing: 0,
    completed: 0,
    expired: 0,
  });
  // re-fetch helpers
  const fetchOverview = async () => {
    try {
      const [a, t, m, s] = await Promise.all([
        api.get('/admin/reports/drilldown/students', { params: { type: 'topStudentAreas', top: 8 } }),
        api.get('/admin/reports/top-mentor-sessions', { params: { top: 8 } }),
        api.get('/admin/reports/mentors', { params: { top: 1 } }),
        api.get('/admin/reports/sessions', { params: { top: 1 } }),
      ]);
      const rows = a.data?.rows || [];
      setStudentAreas(rows.map(r => ({ name: areaNameMap[r._id] || (r._id || '').replace(/_/g, ' '), count: r.count })));

      setTopCompleted(t.data?.topCompleted || []);
      setTopExpired(t.data?.topExpired || []);
      setTopRatedMentor(m.data?.bestRatedMentor || null);
      setSessionSummary(s.data?.summary || { total: 0, upcoming: 0, ongoing: 0, completed: 0, expired: 0 });
    } catch (err) {
      console.error('Overview data load error:', err);
    }
  };

  const fetchStatsAndAnalytics = async () => {
    try {
      const [sRes, aRes] = await Promise.all([
        api.get('/admin/stats'),
        api.get('/admin/analytics'),
      ]);
      setLocalStats(sRes.data || {});
      setLocalAnalytics(aRes.data || {});
    } catch (err) {
      console.error('Failed to refresh stats/analytics', err);
    }
  };
  // Details modal state
  const [detailLoading, setDetailLoading] = useState(false);
  const [modalUser, setModalUser] = useState(null);
  const [modalProfile, setModalProfile] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const openMentorDetails = async (userId) => {
    try {
      setDetailLoading(true);
      setShowDetails(true);
      const res = await api.get(`/admin/users/${userId}`);
      setModalUser(res.data.user || null);
      setModalProfile(res.data.profile || null);
    } catch (err) {
      console.error('Failed to load mentor details', err);
      setModalUser(null);
      setModalProfile(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetails = () => {
    setShowDetails(false);
    setModalUser(null);
    setModalProfile(null);
    setDetailLoading(false);
  };

  const handleApprove = async (id) => {
    try {
      await api.post(`/admin/users/${id}/approve`);
      closeDetails();
    } catch (err) {
      console.error('Approve error', err);
    }
  };

  const handleReject = async (id) => {
    try {
      await api.post(`/admin/users/${id}/reject`);
      closeDetails();
    } catch (err) {
      console.error('Reject error', err);
    }
  };

  const handleUnverify = async (id) => {
    try {
      await api.post(`/admin/users/${id}/unverify`, { reason: '' });
      closeDetails();
    } catch (err) {
      console.error('Unverify error', err);
    }
  };

  useEffect(() => {
    let mounted = true;
    // initial load
    fetchOverview();
    // load full stats/analytics once on mount
    fetchStatsAndAnalytics();

    // socket listener: refresh on admin changes
    const onRefresh = () => {
      fetchStatsAndAnalytics();
      fetchOverview();
    };

    if (socket) socket.on('admin:refresh', onRefresh);

    return () => {
      mounted = false;
      try { if (socket) socket.off('admin:refresh', onRefresh); } catch (e) {}
    };
  }, [socket]);

  return (
    <motion.section 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      // Removed h-full scroll to let it breathe, but kept max-width for large screens
      className="p-4 md:p-6 flex flex-col gap-6 w-full max-w-[1600px] mx-auto"
    >
      {/* 1. Compact Stats Grid (Now the top of the page) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard 
          index={0} 
          title="Total Students" 
          value={stats.totalStudents} 
          icon={<Users size={20} className="stroke-[2.5px]" />}
          bg="bg-kpi-1"
          textColor="text-cyan-800 dark:text-cyan-400"
          glow="bg-cyan-500/20"
        />
        <StatCard 
          index={1} 
          title="Total Mentors" 
          value={stats.totalMentors} 
          icon={<GraduationCap size={20} className="stroke-[2.5px]" />}
          bg="bg-kpi-2"
          textColor="text-violet-800 dark:text-violet-400"
          glow="bg-violet-500/20"
        />
        <StatCard 
          index={2} 
          title="Pending Accounts" 
          value={stats.totalPending} 
          icon={<Clock size={20} className="stroke-[2.5px]" />}
          bg="bg-kpi-3"
          textColor="text-amber-800 dark:text-amber-400"
          glow="bg-amber-500/20"
        />
      </div>

      <div className="rounded-[2rem] border border-cyan-500/15 bg-gradient-to-br from-cyan-500/10 via-card to-transparent p-5 shadow-lg">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
              <Star size={15} />
              <span className="text-[10px] font-black uppercase tracking-[0.22em]">Top Rated Verified Mentor</span>
            </div>
            <h3 className="mt-3 text-2xl font-semibold text-foreground/90">
              {topRatedMentor?.name || "No rated mentor available yet"}
            </h3>
            <p className="mt-2 text-sm text-foreground/55">
              {getUniversityName(topRatedMentor?.institution)}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:min-w-[280px]">
            <div className="rounded-2xl border border-cyan-500/20 bg-background/80 px-4 py-3 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-foreground/35">Average Rating</p>
              <p className="mt-2 text-2xl font-semibold text-cyan-600">
                {topRatedMentor?.averageRating?.toFixed?.(1) || topRatedMentor?.averageRating || "0.0"}
              </p>
            </div>
            <div className="rounded-2xl border border-cyan-500/20 bg-background/80 px-4 py-3 text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-foreground/35">Total Ratings</p>
              <p className="mt-2 text-2xl font-semibold text-foreground/85">{topRatedMentor?.totalRatings || 0}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="rounded-[1.6rem] border border-border/50 bg-card/70 p-4 shadow-sm backdrop-blur-md">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-foreground/35">Total Sessions</p>
          <p className="mt-3 text-3xl font-semibold text-foreground/90">{sessionSummary.total || 0}</p>
          <p className="mt-2 text-xs text-foreground/45">All tracked verified sessions</p>
        </div>
        <div className="rounded-[1.6rem] border border-violet-500/15 bg-violet-500/5 p-4 shadow-sm backdrop-blur-md">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-foreground/35">Upcoming</p>
          <p className="mt-3 text-3xl font-semibold text-violet-600">{sessionSummary.upcoming || 0}</p>
          <p className="mt-2 text-xs text-foreground/45">Accepted sessions not started yet</p>
        </div>
        <div className="rounded-[1.6rem] border border-cyan-500/15 bg-cyan-500/5 p-4 shadow-sm backdrop-blur-md">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-foreground/35">Ongoing</p>
          <p className="mt-3 text-3xl font-semibold text-cyan-600">{sessionSummary.ongoing || 0}</p>
          <p className="mt-2 text-xs text-foreground/45">Sessions currently live</p>
        </div>
        <div className="rounded-[1.6rem] border border-emerald-500/15 bg-emerald-500/5 p-4 shadow-sm backdrop-blur-md">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-foreground/35">Completed</p>
          <p className="mt-3 text-3xl font-semibold text-emerald-600">{sessionSummary.completed || 0}</p>
          <p className="mt-2 text-xs text-foreground/45">Successfully finished sessions</p>
        </div>
        <div className="rounded-[1.6rem] border border-rose-500/15 bg-rose-500/5 p-4 shadow-sm backdrop-blur-md">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-foreground/35">Expired</p>
          <p className="mt-3 text-3xl font-semibold text-rose-600">{sessionSummary.expired || 0}</p>
          <p className="mt-2 text-xs text-foreground/45">Sessions ended without completion</p>
        </div>
      </div>

      {/* 2. Refined Charts Area */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-6">
        
        {/* Student Areas Distribution */}
        <ChartBox title="Student Areas (Mentorship Demand)" icon={<TrendingUp size={14} className="text-cyan-500" />}>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={studentAreas.length ? studentAreas : facultyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-[0.03]" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="currentColor"
                className="opacity-20"
                tick={{ fontSize: 9 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis stroke="currentColor" className="opacity-20" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '11px' }}
                itemStyle={{ color: '#06b6d4' }}
              />
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#06b6d4" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#areaGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartBox>

        {/* Partner Institutions */}
        <ChartBox title="Partner Institutions" icon={<BarChart3 size={14} className="text-purple-500" />}>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={uniData} margin={{ top: 10, right: 10, left: -25, bottom: 30 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-[0.03]" vertical={false} />
              <XAxis
                dataKey="name"
                stroke="currentColor"
                className="opacity-20"
                tick={{ fontSize: 10 }}
                interval={0}
                angle={-20}
                textAnchor="end"
                axisLine={false}
                tickLine={false}
              />
              <YAxis stroke="currentColor" className="opacity-20" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{ fill: 'currentColor', opacity: 0.02 }}
                contentStyle={{ backgroundColor: 'var(--card)', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '11px' }}
              />
              <Bar dataKey="students" name="Students" stackId="a" fill="#06b6d4" barSize={18} />
              <Bar dataKey="mentors" name="Mentors" stackId="a" fill="#8b5cf6" barSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>

      {/* 3. Top Mentors Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartBox title="Top Mentors — Completed Sessions" icon={<TrendingUp size={14} className="text-amber-500" />}>
          <div className="w-full overflow-auto">
            <table className="w-full text-sm table-auto">
              <thead>
                <tr className="text-left text-xs text-foreground/50 uppercase tracking-widest">
                  <th className="py-2 pr-4">#</th>
                  <th className="py-2 pr-4">Mentor</th>
                  <th className="py-2 pr-4">Completed Sessions</th>
                </tr>
              </thead>
              <tbody>
                {topCompleted.map((r, i) => (
                  <tr
                    key={r.userId || r.mentorProfileId || r._id}
                    className="border-t border-border/40 hover:bg-foreground/[0.02] cursor-pointer"
                    onClick={() => openMentorDetails(r.userId || r.mentorProfileId)}
                  >
                    <td className="py-2 pr-4 font-bold">{i + 1}</td>
                    <td className="py-2 pr-4">{r.name || 'Unknown'}</td>
                    <td className="py-2 pr-4 font-black text-cyan-600">{r.count}</td>
                  </tr>
                ))}
                {topCompleted.length === 0 && (
                  <tr><td colSpan={3} className="py-6 text-center text-foreground/40">No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </ChartBox>

        <ChartBox title="Top Mentors — Expired Sessions" icon={<TrendingUp size={14} className="text-rose-500" />}>
          <div className="w-full overflow-auto">
            <table className="w-full text-sm table-auto">
              <thead>
                <tr className="text-left text-xs text-foreground/50 uppercase tracking-widest">
                  <th className="py-2 pr-4">#</th>
                  <th className="py-2 pr-4">Mentor</th>
                  <th className="py-2 pr-4">Expired Sessions</th>
                </tr>
              </thead>
              <tbody>
                {topExpired.map((r, i) => (
                  <tr
                    key={r.userId || r.mentorProfileId || r._id}
                    className="border-t border-border/40 hover:bg-foreground/[0.02] cursor-pointer"
                    onClick={() => openMentorDetails(r.userId || r.mentorProfileId)}
                  >
                    <td className="py-2 pr-4 font-bold">{i + 1}</td>
                    <td className="py-2 pr-4">{r.name || 'Unknown'}</td>
                    <td className="py-2 pr-4 font-black text-rose-600">{r.count}</td>
                  </tr>
                ))}
                {topExpired.length === 0 && (
                  <tr><td colSpan={3} className="py-6 text-center text-foreground/40">No data</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </ChartBox>
      </div>

      {showDetails && (
        <DetailsModal
          modalUser={modalUser}
          modalProfile={modalProfile}
          detailLoading={detailLoading}
          closeDetails={closeDetails}
          handleApprove={handleApprove}
          handleReject={handleReject}
          handleUnverify={handleUnverify}
        />
      )}
    </motion.section>
  );
}