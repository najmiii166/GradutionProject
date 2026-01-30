// frontend/src/components/admin/SidebarButton.jsx
import { motion } from "framer-motion";

export default function SidebarButton({ icon, label, active, onClick, disabled, collapsed }) {
  return (
    <button
      disabled={disabled}
      onClick={!disabled ? onClick : undefined}
      className={`
        relative group w-full flex items-center rounded-2xl
        transition-all duration-300
        ${disabled ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
        ${collapsed ? "justify-center p-3" : "gap-3 px-4 py-3"}
        ${active 
          ? "text-cyan-500 dark:text-cyan-400 font-bold" 
          : "text-foreground/60 hover:text-foreground hover:bg-foreground/[0.03]"
        }
      `}
    >
      {active && (
        <motion.div
          layoutId="sidebar-active-pill"
          className="absolute inset-0 bg-cyan-500/10 dark:bg-cyan-500/[0.08] rounded-2xl border border-cyan-500/20"
          initial={false}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}

      {active && (
        <motion.div 
          layoutId="sidebar-active-indicator"
          className="absolute left-0 w-1 h-5 bg-gradient-to-b from-cyan-400 to-violet-500 rounded-r-full" 
        />
      )}

      <div className={`
        relative z-10 transition-transform duration-300 flex-shrink-0
        ${active ? "scale-110" : "opacity-50 group-hover:opacity-100 group-hover:scale-110"}
      `}>
        {icon}
      </div>

      {!collapsed && (
        <motion.span 
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative z-10 text-sm tracking-tight whitespace-nowrap"
        >
          {label}
        </motion.span>
      )}

      {!active && !collapsed && (
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 to-cyan-500/[0.02] opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity" />
      )}
    </button>
  );
}