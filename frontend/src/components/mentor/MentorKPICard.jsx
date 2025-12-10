// src/components/mentor/MentorKPICard.jsx

import { motion } from "framer-motion";

export default function MentorKPICard({ label, value, color, icon: Icon }) {
  return (
    <motion.div
      whileHover={{ scale: 1.04 }}
      transition={{ duration: 0.25 }}
      className="
        rounded-xl p-5 
        bg-slate-900/60 
        border border-slate-800 
        shadow-lg 
        hover:shadow-[0_0_15px_rgba(56,189,248,0.25)] 
        hover:border-sky-500/40 
        backdrop-blur-sm 
        transition
        flex items-center justify-between
      "
    >
      {/* LEFT TEXT */}
      <div>
        <p className="text-xs text-slate-400">{label}</p>

        <p className={`text-3xl font-bold bg-gradient-to-r ${color} bg-clip-text text-transparent`}>
          {value}
        </p>
      </div>

      {/* ICON */}
      {Icon && (
        <div
          className={`
            w-10 h-10 flex items-center justify-center rounded-lg
            bg-gradient-to-br ${color} 
            text-white shadow-md
          `}
        >
          <Icon className="w-5 h-5" />
        </div>
      )}
    </motion.div>
  );
}
