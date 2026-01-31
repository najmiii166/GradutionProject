// src/components/student/TimeRemaining.jsx
import React from 'react';
import { Clock, AlertCircle } from 'lucide-react';
import useCountdown from "../hooks/useCountdown";

export default function TimeRemaining({ expiryDate }) {
  const { text, isStarted, days, hours } = useCountdown(expiryDate);

  if (!expiryDate) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-foreground/[0.03] border border-border/50 backdrop-blur-md">
        <AlertCircle size={14} className="text-foreground/20" />
        <span className="text-[10px] uppercase tracking-widest font-bold text-foreground/40">No Enrollment</span>
      </div>
    );
  }

  const isExpired = isStarted || text === "Expired";
  // Determine if we are in the "Critical" zone (under 1 hour)
  const isCritical = !isExpired && days === 0 && hours === 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 px-1">
        <div className={`p-1 rounded-md transition-colors ${isCritical ? 'bg-rose-500/20 text-rose-500 animate-pulse' : 'bg-cyan-500/10 text-cyan-500'}`}>
          <Clock size={10} strokeWidth={3} />
        </div>
        <span className="text-[9px] uppercase tracking-[0.25em] font-black text-foreground/30">
          Subscription Track
        </span>
      </div>

      <div className={`
        relative overflow-hidden inline-flex items-center px-4 py-2 rounded-2xl border transition-all duration-500
        ${isExpired 
          ? 'bg-rose-500/10 border-rose-500/20 text-rose-500' 
          : isCritical
            ? 'bg-rose-500/5 border-rose-500/30 text-rose-500 shadow-lg shadow-rose-500/10'
            : 'bg-card/40 backdrop-blur-xl border-border/50 text-foreground shadow-xl shadow-cyan-500/5'}
      `}>
        {!isExpired && (
          <div className={`absolute inset-0 bg-gradient-to-r pointer-events-none ${isCritical ? 'from-rose-500/5' : 'from-cyan-500/10'} to-transparent`} />
        )}
        
        <span className={`relative z-10 text-[11px] font-bold tracking-tight uppercase tabular-nums ${!isExpired ? (isCritical ? 'text-rose-500' : 'text-cyan-500') : ''}`}>
          {isExpired ? 'Subscription Expired' : `${text} remaining`}
        </span>
      </div>
    </div>
  );
}