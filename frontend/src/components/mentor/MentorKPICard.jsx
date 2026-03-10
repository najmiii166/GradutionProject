// src/components/mentor/MentorKPICard.jsx
import { motion } from "framer-motion";

export default function MentorKPICard({ 
  label, 
  value, 
  icon: Icon,
  hint,
  // New props for theme support
  bg = "bg-card/40", 
  textColor = "text-cyan-800 dark:text-cyan-400", 
  glow = "bg-cyan-500/20"
}) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`
        relative overflow-hidden
        rounded-3xl p-6 
        ${bg} backdrop-blur-md
        border border-border/10
        shadow-xl
        transition-all duration-300
        flex items-center justify-between
      `}
    >
      {/* Background Accent / Glow */}
      <div className={`absolute -right-4 -bottom-4 w-20 h-20 rounded-full blur-[40px] opacity-30 transition-opacity hover:opacity-50 ${glow}`} />

      {/* TEXT CONTENT */}
      <div className="space-y-1 relative z-10">
        <p className="text-[11px] font-bold uppercase tracking-[0.15em] opacity-70">
          {label}
        </p>
        <h3 className="text-3xl font-bold tracking-tight tabular-nums">
          {value}
        </h3>
        {hint ? (
          <p className="text-[11px] text-foreground/55 dark:text-foreground/50 font-medium">
            {hint}
          </p>
        ) : null}
      </div>

      {/* ICON - Enhanced Visibility */}
      {Icon && (
        <div className={`
          relative z-10
          w-12 h-12 flex items-center justify-center rounded-2xl
          bg-white/40 dark:bg-white/5 backdrop-blur-sm
          shadow-sm
          ${textColor}
        `}>
          <Icon size={24} strokeWidth={2.5} />
        </div>
      )}
      
       {/* Bottom Accent Line */}
       <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-current to-transparent opacity-20 hover:opacity-40 transition-opacity" />
    </motion.div>
  );
}