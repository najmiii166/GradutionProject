// frontend/src/components/admin/ChartBox.jsx
import { motion } from "framer-motion";

export default function ChartBox({ title, children, icon }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="group rounded-[1.2rem] border border-border bg-card shadow-md p-4 flex flex-col relative overflow-hidden"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {icon ? icon : <div className="w-1 h-1 rounded-full bg-cyan-500" />}
          <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-foreground/50">
            {title}
          </h3>
        </div>
        <div className="text-[9px] text-foreground/20 font-bold uppercase tracking-widest hidden sm:block">
          Analysis
        </div>
      </div>

      {/* Reduced min-height to prevent forced scrolling */}
      <div className="flex-1 w-full min-h-[180px]">
        {children}
      </div>

      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-cyan-500/[0.02] to-transparent pointer-events-none group-hover:from-cyan-500/[0.05] transition-all duration-700" />
    </motion.div>
  );
}