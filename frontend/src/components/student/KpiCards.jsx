// src/components/student/KpiCards.jsx
import { motion } from "framer-motion";
import { Users, Clock, Mail, XCircle } from "lucide-react";

export default function KpiCards({ mentorsCount, upcomingCount, pendingCount, rejectedCount }) {
  const cards = [
    { icon: Users, label: "Matching Mentors", value: mentorsCount, color: "text-cyan-800 dark:text-cyan-400", glow: "bg-cyan-500/20", bg: "bg-kpi-1" },
    { icon: Clock, label: "Upcoming Sessions", value: upcomingCount, color: "text-violet-800 dark:text-violet-400", glow: "bg-violet-500/20", bg: "bg-kpi-2" },
    { icon: Mail, label: "Pending Requests", value: pendingCount, color: "text-amber-800 dark:text-amber-400", glow: "bg-amber-500/20", bg: "bg-kpi-3" },
    { icon: XCircle, label: "Rejected Requests", value: rejectedCount, color: "text-rose-800 dark:text-rose-400", glow: "bg-rose-500/20", bg: "bg-kpi-4" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {cards.map((c, i) => (
        <motion.div 
          key={i} 
          whileHover={{ y: -5 }} 
          className={`relative group overflow-hidden rounded-2xl p-5 ${c.bg} backdrop-blur-md border border-border/10 shadow-lg transition-all duration-300`}
        >
          {/* Subtle Background Glow */}
          <div className={`absolute -right-4 -bottom-4 w-20 h-20 rounded-full blur-2xl opacity-30 transition-opacity group-hover:opacity-50 ${c.glow}`} />

          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] uppercase tracking-[0.15em] opacity-70 font-bold mb-1">
                {c.label}
              </p>
              <p className="text-3xl font-bold tracking-tight">
                {c.value}
              </p>
            </div>
            
            <div className={`p-3 rounded-xl bg-white/40 dark:bg-white/5 ${c.color} shadow-sm backdrop-blur-sm`}>
              <c.icon size={22} strokeWidth={2.5} />
            </div>
          </div>

          {/* Bottom Accent Line */}
          <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-current to-transparent opacity-20 group-hover:opacity-40 transition-opacity" />
        </motion.div>
      ))}
    </motion.div>
  );
}