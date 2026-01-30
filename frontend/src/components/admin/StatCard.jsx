// frontend/src/components/admin/StatCard.jsx
import { motion } from "framer-motion";

export default function StatCard({ title, value, icon, index = 0 }) {
  const accents = {
    "Total Students": "from-cyan-500 to-blue-500",
    "Total Mentors": "from-violet-500 to-purple-500",
    "Pending Accounts": "from-amber-400 to-orange-500",
  };

  const accentGradient = accents[title] || "from-cyan-500 to-violet-500";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="group relative p-4 rounded-[1.5rem] border border-border bg-card shadow-lg hover:border-cyan-500/30 transition-all duration-500 overflow-hidden"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Smaller, sleeker icon container */}
          <div className={`p-3 rounded-xl bg-gradient-to-br ${accentGradient} bg-opacity-10 text-white shadow-sm`}>
            <div className="w-5 h-5 transition-transform duration-500 group-hover:scale-110">
              {icon}
            </div>
          </div>

          <div className="flex flex-col">
            <p className="text-[9px] uppercase tracking-[0.2em] text-foreground/40 font-bold">
              {title}
            </p>
            <h2 className="text-2xl font-light tracking-tight text-foreground">
              {value}
            </h2>
          </div>
        </div>
        
        <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-foreground/[0.03] text-foreground/20 uppercase tracking-tighter">
          Real-time
        </span>
      </div>

      <div className={`absolute bottom-0 left-0 h-[1.5px] w-0 bg-gradient-to-r ${accentGradient} group-hover:w-full transition-all duration-700`} />
    </motion.div>
  );
}