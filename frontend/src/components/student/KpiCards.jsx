// src/components/student/KpiCards.jsx
import { motion } from "framer-motion";
import { Users, Clock, Mail, XCircle } from "lucide-react";

export default function KpiCards({ mentorsCount, upcomingCount, pendingCount, rejectedCount }) {
  const cards = [
    { icon: Users, label: "Connected Mentors", value: mentorsCount, color: "text-cyan-500", glow: "bg-cyan-500/10" },
    { icon: Clock, label: "Upcoming Sessions", value: upcomingCount, color: "text-violet-500", glow: "bg-violet-500/10" },
    { icon: Mail, label: "Pending Requests", value: pendingCount, color: "text-amber-500", glow: "bg-amber-500/10" },
    { icon: XCircle, label: "Rejected Requests", value: rejectedCount, color: "text-rose-500", glow: "bg-rose-500/10" },
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
          className="relative group overflow-hidden rounded-2xl p-5 bg-card/40 backdrop-blur-md border border-border/50 shadow-xl transition-all duration-300"
        >
          {/* Subtle Background Glow */}
          <div className={`absolute -right-4 -bottom-4 w-16 h-16 rounded-full blur-2xl opacity-20 transition-opacity group-hover:opacity-40 ${c.glow}`} />

          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-foreground/40 font-bold mb-1">
                {c.label}
              </p>
              <p className="text-3xl font-light tracking-tight text-foreground">
                {c.value}
              </p>
            </div>
            
            <div className={`p-2.5 rounded-xl ${c.glow} ${c.color} border border-current/10 shadow-sm`}>
              <c.icon size={20} strokeWidth={2.5} />
            </div>
          </div>

          {/* Bottom Accent Line */}
          <div className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-current to-transparent opacity-10 group-hover:opacity-30 transition-opacity" />
        </motion.div>
      ))}
    </motion.div>
  );
}