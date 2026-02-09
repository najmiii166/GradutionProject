// src/components/mentor/MentorAvailability.jsx
import { motion } from "framer-motion";
import { CalendarDays, Clock, Edit3 } from "lucide-react";
import Spinner from "../Spinner";
import { DAYS } from "../../constants/systemData";

const formatTime = (time) => {
  if (!time || typeof time !== "string") return "--";
  const [h = "0", m = "00"] = time.split(":");
  let hours = parseInt(h, 10);
  if (Number.isNaN(hours)) return "--";
  const minutes = parseInt(m, 10) || 0;
  const period = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${hours}:${minutes.toString().padStart(2, "0")} ${period}`;
};

const getShortDay = (dayStr) => {
  if (!dayStr) return "";
  const found = DAYS.find((d) => d.key === dayStr || d.label === dayStr);
  return found ? found.key : dayStr;
};

export default function MentorAvailability({ profile, loading, onOpen }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="
        rounded-[2rem] bg-card/40 border border-border/50 p-6 
        shadow-xl backdrop-blur-xl relative overflow-hidden
        hover:shadow-cyan-500/5 hover:border-cyan-500/30 transition-all duration-500
      "
    >
      {/* Subtle Background Glow */}
      <div className="absolute -top-10 -right-10 h-32 w-32 bg-cyan-500/5 blur-[50px] rounded-full pointer-events-none" />

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <div className="p-1 rounded-md bg-cyan-500/10 text-cyan-500">
              <CalendarDays size={10} strokeWidth={3} />
            </div>
            <span className="text-[9px] uppercase tracking-[0.25em] font-black text-foreground/30">
              Schedule
            </span>
          </div>
          <h3 className="text-sm font-semibold tracking-wide text-foreground">
            Availability
          </h3>
        </div>

        <div className="flex items-center gap-3">
          {loading && (
            <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-foreground/[0.03] border border-border/50">
              <Spinner className="w-3 h-3 border-cyan-500/60" />
              <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-wider">Syncing</span>
            </div>
          )}

          <button
            onClick={onOpen}
            className="
              p-2 rounded-xl bg-cyan-500 text-white
              shadow-lg shadow-cyan-500/20 hover:bg-cyan-600 
              transition-all duration-300 group
            "
            title="Edit Schedule"
          >
            <Edit3 size={14} className="group-hover:rotate-12 transition-transform" />
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="relative z-10">
        {!profile || loading ? (
          <div className="py-8 flex justify-center">
             <Spinner className="w-6 h-6 border-cyan-500" />
          </div>
        ) : !profile.availability || profile.availability.length === 0 ? (
          <div className="py-6 px-4 rounded-2xl border border-dashed border-border/60 bg-foreground/[0.02] text-center">
            <p className="text-[11px] font-medium text-foreground/30 uppercase tracking-wide">
              No active slots configured
            </p>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-2.5">
            {profile.availability.map((slot, i) => (
              <motion.li
                key={i}
                whileHover={{ x: 4 }}
                className="
                  flex items-center justify-between 
                  rounded-2xl bg-background/40 border border-border/50 
                  px-3 sm:px-4 py-3 transition-all duration-300
                  hover:bg-card hover:border-cyan-500/20
                  gap-2 sm:gap-3
                "
              >
                {/* Day Label - min-w-0 allows the container to shrink if the time pill needs space */}
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.5)] shrink-0" />
                  <span className="text-xs font-bold text-foreground/80 truncate">
                    {getShortDay(slot.day)}
                  </span>
                </div>

                {/* Time Display Pill - Optimized for 2-digit hours */}
                <div className="
                  flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 
                  rounded-lg bg-cyan-500/5 border border-cyan-500/10 
                  shrink-0 whitespace-nowrap
                ">
                  <Clock size={10} className="text-cyan-500 shrink-0 hidden xs:block" />
                  <span className="
                    text-[9px] sm:text-[10px] font-black tracking-tight 
                    text-cyan-500/80 tabular-nums uppercase
                  ">
                    {formatTime(slot.from)} — {formatTime(slot.to)}
                  </span>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </motion.div>
  );
}