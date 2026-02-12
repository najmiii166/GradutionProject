// frontend/src/components/admin/StatCard.jsx
import { motion } from "framer-motion";

export default function StatCard({ 
  title, 
  value, 
  icon, 
  index = 0,
  bg = "bg-card",
  textColor = "text-cyan-800 dark:text-cyan-400",
  glow = "bg-cyan-500/20"
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className={`group relative p-5 rounded-[1.5rem] border border-border/10 ${bg} shadow-lg hover:shadow-xl transition-all duration-500 overflow-hidden backdrop-blur-md`}
    >
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-[50px] opacity-30 transition-opacity hover:opacity-50 ${glow}`} />

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          {/* Smaller, sleeker icon container */}
          <div className={`p-3.5 rounded-2xl bg-white/40 dark:bg-white/5 backdrop-blur-sm shadow-sm ${textColor}`}>
            <div className="w-5 h-5 transition-transform duration-500 group-hover:scale-110 flex items-center justify-center">
              {icon}
            </div>
          </div>

          <div className="flex flex-col">
            <p className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-70 mb-0.5">
              {title}
            </p>
            <h2 className="text-3xl font-bold tracking-tight">
              {value}
            </h2>
          </div>
        </div>
        
        <span className="text-[8px] font-bold px-2 py-1 rounded-full bg-black/5 dark:bg-white/5 uppercase tracking-wider backdrop-blur-sm border border-black/5 dark:border-white/5">
          Real-time
        </span>
      </div>

       {/* Bottom Accent Line */}
       <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-current to-transparent opacity-20 hover:opacity-40 transition-opacity" />
    </motion.div>
  );
}