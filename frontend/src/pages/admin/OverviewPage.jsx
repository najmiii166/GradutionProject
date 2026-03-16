// frontend/src/pages/admin/OverviewPage.jsx
import { motion } from "framer-motion";
import { useEffect, useState, useContext } from "react";
import { api } from "../../api/axios";
import DetailsModal from "../../components/admin/DetailsModal";
import StatCard from "../../components/admin/StatCard";
import ChartBox from "../../components/admin/ChartBox";
import { Users, GraduationCap, Clock, TrendingUp, BarChart3, Star, Layers, CalendarClock, PlayCircle, CheckCircle2, XOctagon } from "lucide-react";
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
      students: item.count,
      mentors: 0,
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
      const [a, mAreasRes, t, m, s] = await Promise.all([
        api.get('/admin/reports/drilldown/students', { params: { type: 'topStudentAreas', top: 8 } }),
        api.get('/admin/reports/drilldown/mentors', { params: { type: 'topMentorAreas', top: 8 } }),
        api.get('/admin/reports/top-mentor-sessions', { params: { top: 8 } }),
        api.get('/admin/reports/mentors', { params: { top: 1 } }),
        api.get('/admin/reports/sessions', { params: { top: 1 } }),
      ]);
      
      const sRows = a.data?.rows || [];
      const mRows = mAreasRes.data?.rows || [];
      
      const mergedAreas = {};
      sRows.forEach(r => {
        if (r._id) mergedAreas[r._id] = { name: areaNameMap[r._id] || r._id.replace(/_/g, ' '), students: r.count, mentors: 0 };
      });
      mRows.forEach(r => {
        if (r._id) {
          if (mergedAreas[r._id]) mergedAreas[r._id].mentors = r.count;
          else mergedAreas[r._id] = { name: areaNameMap[r._id] || r._id.replace(/_/g, ' '), students: 0, mentors: r.count };
        }
      });
      setStudentAreas(Object.values(mergedAreas).sort((x, y) => (y.students + y.mentors) - (x.students + x.mentors)).slice(0, 8));

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
      className="p-3 md:p-4 flex flex-col gap-4 w-full max-w-[1600px] mx-auto"
    >
      {/* Top Section: Stats Left, Top Mentor Right */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 mb-4">
        
        {/* Left Side: Main Stats & Session Summaries */}
        <div className="xl:col-span-3 flex flex-col gap-4 justify-between h-full">
          {/* Main Users Stats Row */}
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

          {/* Sessions Summary Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="rounded-[1.2rem] border border-border/50 bg-card/70 px-4 py-3.5 shadow-sm backdrop-blur-md flex flex-col justify-center">
              <div className="flex items-center gap-1.5 opacity-70">
                <Layers size={13} className="text-foreground shrink-0" />
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-foreground line-clamp-1" title="Total Sessions">Total Sessions</p>
              </div>
              <p className="mt-1.5 text-2xl font-bold text-foreground/90 leading-none">{sessionSummary.total || 0}</p>
            </div>
            <div className="rounded-[1.2rem] border border-violet-500/15 bg-violet-500/5 px-4 py-3.5 shadow-sm backdrop-blur-md flex flex-col justify-center">
              <div className="flex items-center gap-1.5 opacity-80">
                <CalendarClock size={13} className="text-violet-500 shrink-0" />
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-violet-600 line-clamp-1" title="Upcoming Sessions">Upcoming   </p>
              </div>
              <p className="mt-1.5 text-2xl font-bold text-violet-600 leading-none">{sessionSummary.upcoming || 0}</p>
            </div>
            <div className="rounded-[1.2rem] border border-cyan-500/15 bg-cyan-500/5 px-4 py-3.5 shadow-sm backdrop-blur-md flex flex-col justify-center">
              <div className="flex items-center gap-1.5 opacity-80">
                <PlayCircle size={13} className="text-cyan-500 shrink-0" />
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-cyan-600 line-clamp-1" title="Ongoing Sessions">Ongoing </p>
              </div>
              <p className="mt-1.5 text-2xl font-bold text-cyan-600 leading-none">{sessionSummary.ongoing || 0}</p>
            </div>
            <div className="rounded-[1.2rem] border border-emerald-500/15 bg-emerald-500/5 px-4 py-3.5 shadow-sm backdrop-blur-md flex flex-col justify-center">
              <div className="flex items-center gap-1.5 opacity-80">
                <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-emerald-600 line-clamp-1" title="Completed Sessions">Completed </p>
              </div>
              <p className="mt-1.5 text-2xl font-bold text-emerald-600 leading-none">{sessionSummary.completed || 0}</p>
            </div>
            <div className="rounded-[1.2rem] border border-rose-500/15 bg-rose-500/5 px-4 py-3.5 shadow-sm backdrop-blur-md flex flex-col justify-center">
              <div className="flex items-center gap-1.5 opacity-80">
                <XOctagon size={13} className="text-rose-500 shrink-0" />
                <p className="text-[9px] font-black uppercase tracking-[0.12em] text-rose-600 line-clamp-1" title="Expired Sessions">Expired </p>
              </div>
              <p className="mt-1.5 text-2xl font-bold text-rose-600 leading-none">{sessionSummary.expired || 0}</p>
            </div>
          </div>
        </div>

        {/* Right Side: Top Mentor Vertically Long */}
        <div className="xl:col-span-1 border border-cyan-500/15 bg-gradient-to-b from-cyan-500/10 via-card to-transparent rounded-[1.2rem] p-4 shadow-sm flex flex-col justify-between items-center text-center relative overflow-hidden h-full">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-3xl rounded-full z-0"></div>
          
          <div className="w-10 h-10 rounded-full hidden xl:flex bg-cyan-500/10 items-center justify-center mb-1.5 shadow-inner z-10 shrink-0">
            <Star size={18} className="fill-cyan-500/40 text-cyan-500" />
          </div>
          
          <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 mb-1 xl:hidden z-10 shrink-0">
            <Star size={12} className="fill-cyan-500/20" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Top Rated Mentor</span>
          </div>
          
          <span className="hidden xl:block text-[8px] font-black uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400 mb-1.5 z-10 shrink-0">
            Top Rated Mentor
          </span>
          
          <div className="flex flex-col items-center justify-center w-full px-1 min-h-0 z-10 flex-1">
            <h3 className="text-[1.05rem] leading-tight font-bold text-foreground/90 line-clamp-2" title={topRatedMentor?.name || "No rated mentor"}>
              {topRatedMentor?.name || "None"}
            </h3>
            <p className="text-[9px] text-foreground/55 line-clamp-1 mt-1">
              {getUniversityName(topRatedMentor?.institution)}
            </p>
          </div>

          <div className="flex items-center justify-center gap-4 w-full mt-2 pt-2.5 border-t border-cyan-500/20 z-10 shrink-0">
            <div className="flex-1 text-right">
              <p className="text-[8px] font-black uppercase tracking-wider text-foreground/45 mb-1">Rating</p>
              <div className="flex items-center justify-end gap-1">
                <span className="text-[1.15rem] font-bold text-cyan-500 leading-none">
                  {topRatedMentor?.averageRating?.toFixed?.(1) || topRatedMentor?.averageRating || "0.0"}
                </span>
                <Star size={9} className="fill-currentColor text-cyan-500" />
              </div>
            </div>
            <div className="w-px h-5 bg-border/60"></div>
            <div className="flex-1 text-left">
              <p className="text-[8px] font-black uppercase tracking-wider text-foreground/45 mb-1">Reviews</p>
              <p className="text-[1.15rem] font-bold text-foreground/80 leading-none">
                {topRatedMentor?.totalRatings || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Refined Charts Area */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 pb-2">
        
        {/* Demand vs Supply Areas */}
        <ChartBox title="Mentorship Areas (Demand vs Supply)" icon={<TrendingUp size={14} className="text-cyan-500" />}>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={studentAreas.length ? studentAreas : facultyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="areaGradientMentor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
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
              />
              <Area 
                type="monotone" 
                dataKey="mentors"
                name="Mentor Supply" 
                stroke="#8b5cf6" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#areaGradientMentor)"
              />
              <Area 
                type="monotone" 
                dataKey="students" 
                name="Student Demand"
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
          <ResponsiveContainer width="100%" height={220}>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartBox title="Top Mentors — Completed Sessions" icon={<TrendingUp size={14} className="text-amber-500" />}>
          <div className="w-full overflow-auto max-h-[180px]">
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
          <div className="w-full overflow-auto max-h-[180px]">
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