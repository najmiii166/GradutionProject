// src/components/student/KpiCards.jsx
import { motion } from "framer-motion";
import { Users, Clock, ListChecks, CheckCircle2 } from "lucide-react";

export default function KpiCards({ mentorsCount, activeCount, upcomingCount, completedCount }) {
  const cards = [
    {
      icon: Users,
      label: "Available Mentors",
      value: mentorsCount,
      hint: "Matched to your focus areas",
      color: "text-cyan-800 dark:text-cyan-400",
      glow: "bg-cyan-500/20",
      bg: "bg-kpi-1",
    },
    {
      icon: ListChecks,
      label: "Active Requests",
      value: activeCount,
      hint: "Pending or currently in progress",
      color: "text-violet-800 dark:text-violet-400",
      glow: "bg-violet-500/20",
      bg: "bg-kpi-2",
    },
    {
      icon: Clock,
      label: "Upcoming Sessions",
      value: upcomingCount,
      hint: "Ready to join soon",
      color: "text-amber-800 dark:text-amber-400",
      glow: "bg-amber-500/20",
      bg: "bg-kpi-3",
    },
    {
      icon: CheckCircle2,
      label: "Completed Sessions",
      value: completedCount,
      hint: "Finished mentorship sessions",
      color: "text-rose-800 dark:text-rose-400",
      glow: "bg-rose-500/20",
      bg: "bg-kpi-4",
    },
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
              {c.hint ? (
                <p className="mt-2 text-[11px] text-foreground/55 dark:text-foreground/50 font-medium">
                  {c.hint}
                </p>
              ) : null}
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