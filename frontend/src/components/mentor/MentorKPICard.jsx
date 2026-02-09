// src/components/mentor/MentorKPICard.jsx
import { motion } from "framer-motion";

export default function MentorKPICard({ label, value, color, icon: Icon }) {
  const colorMap = {
    cyan: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20 shadow-cyan-500/10",
    emerald: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20 shadow-emerald-500/10",
    amber: "text-amber-500 bg-amber-500/10 border-amber-500/20 shadow-amber-500/10",
    violet: "text-violet-500 bg-violet-500/10 border-violet-500/20 shadow-violet-500/10",
  };

  const selectedColor = colorMap[color] || colorMap.cyan;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="
        relative overflow-hidden
        rounded-3xl p-6 
        bg-card/40 backdrop-blur-xl
        border border-border/50 
        shadow-2xl shadow-black/5
        transition-all duration-300
        flex items-center justify-between
      "
    >
      {/* Background Accent */}
      <div className={`absolute -right-2 -bottom-2 w-20 h-20 rounded-full blur-[40px] opacity-10 ${selectedColor.split(' ')[0]}`} />

      {/* TEXT CONTENT */}
      <div className="space-y-1 relative z-10">
        <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-foreground/40">
          {label}
        </p>
        <h3 className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">
          {value}
        </h3>
      </div>

      {/* ICON - Student Style Squircle */}
      {Icon && (
        <div className={`
          relative z-10
          w-11 h-11 flex items-center justify-center rounded-xl
          border transition-all duration-500
          ${selectedColor}
        `}>
          <Icon size={20} strokeWidth={2} />
        </div>
      )}
    </motion.div>
  );
}