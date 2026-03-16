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
      className={`group relative p-4 lg:p-5 rounded-[1.4rem] border border-border/10 ${bg} shadow-md hover:shadow-lg transition-all duration-500 overflow-hidden backdrop-blur-md flex flex-col justify-center min-h-[96px]`}
    >
      <div className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-[40px] opacity-30 transition-opacity hover:opacity-50 ${glow}`} />

      <div className="flex items-center justify-between relative z-10 w-full gap-2">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className={`p-2.5 rounded-xl bg-white/40 dark:bg-white/5 backdrop-blur-sm shadow-sm ${textColor} flex-shrink-0`}>
            <div className="w-5 h-5 transition-transform duration-500 group-hover:scale-110 flex items-center justify-center">
              {icon}
            </div>
          </div>

          <div className="flex flex-col min-w-0 pr-1">
            <p className="text-[9px] lg:text-[10px] uppercase tracking-widest font-bold opacity-70 mb-0.5 truncate" title={title}>
              {title}
            </p>
            <h2 className="text-2xl lg:text-3xl font-bold tracking-tight leading-none truncate">
              {value}
            </h2>
          </div>
        </div>
        
        <div className="flex-shrink-0 self-start hidden lg:block">
          <span className="text-[8px] font-bold px-2 py-1 rounded-full bg-black/5 dark:bg-white/5 uppercase tracking-wider backdrop-blur-sm border border-black/5 dark:border-white/5 whitespace-nowrap">
            Live
          </span>
        </div>
      </div>

       {/* Bottom Accent Line */}
       <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-current to-transparent opacity-20 hover:opacity-40 transition-opacity" />
    </motion.div>
  );
}