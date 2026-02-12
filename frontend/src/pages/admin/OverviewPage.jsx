// frontend/src/pages/admin/OverviewPage.jsx
import { motion } from "framer-motion";
import StatCard from "../../components/admin/StatCard";
import ChartBox from "../../components/admin/ChartBox";
import { Users, GraduationCap, Clock, TrendingUp, BarChart3 } from "lucide-react";
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
import { faculties } from "../../constants/systemData";

export default function OverviewPage({ stats, analytics }) {
  const CHART_COLORS = ["#06b6d4", "#8b5cf6", "#3b82f6", "#2dd4bf"];
  const uniData = ([...(analytics.studentUniversities || [])]
    .sort((a, b) => b.count - a.count)
    .slice(0, 5));

  const facultyNameMap = Object.fromEntries(
    faculties.map(faculty => [faculty.key, faculty.name])
  );

  const facultyData = (analytics.studentFaculties || [])
    .filter(item => item._id && item.count)
    .map(item => ({
      name: facultyNameMap[item._id] || item._id,
      count: item.count,
    }));

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

      {/* 2. Refined Charts Area */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-6">
        
        {/* Department Distribution */}
        <ChartBox title="Department Distribution" icon={<TrendingUp size={14} className="text-cyan-500" />}>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={facultyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
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
                dataKey="_id"
                stroke="currentColor"
                className="opacity-20"
                tick={{ fontSize: 8 }}
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
              <Bar dataKey="count" radius={[4, 4, 0, 0]} barSize={28}>
                {uniData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartBox>
      </div>
    </motion.section>
  );
}