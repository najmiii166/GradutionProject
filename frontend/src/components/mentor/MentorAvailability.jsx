// src/components/mentor/MentorAvailability.jsx
import { motion } from "framer-motion";
import { CalendarDays, Clock } from "lucide-react";
import Spinner from "../Spinner";

export default function MentorAvailability({ profile, loading, onOpen }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="
        rounded-2xl bg-slate-900/60 border border-slate-800 p-5 
        shadow-lg backdrop-blur 
        hover:shadow-[0_0_20px_rgba(56,189,248,0.25)] 
        hover:border-sky-500/40 transition
      "
    >
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-slate-200 flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-sky-400" />
          Availability
        </h3>

        <div className="flex items-center gap-2">
          {loading && (
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Spinner className="border-white/60" />
              Loading…
            </span>
          )}

          {/* GRADIENT EDIT BUTTON */}
          <button
            onClick={onOpen}
            className="
              px-3 py-1.5 rounded-full text-[11px] font-medium
              bg-gradient-to-r from-sky-500 to-blue-600 text-white
              shadow-sm hover:shadow-sky-500/30 transition
            "
          >
            Edit
          </button>
        </div>
      </div>

      {/* BODY */}
      {!profile || loading ? (
        <p className="text-xs text-slate-400">Loading…</p>
      ) : !profile.availability || profile.availability.length === 0 ? (
        <p className="text-xs text-slate-400">
          You have not set any availability yet.
        </p>
      ) : (
        <ul className="space-y-2 text-xs">
          {profile.availability.map((slot, i) => (
            <motion.li
              key={i}
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
              className="
                flex items-center justify-between 
                rounded-xl bg-slate-800/60 border border-slate-700 
                px-3 py-2 shadow-sm
                hover:border-sky-500/40 hover:shadow-sky-500/10
              "
            >
              {/* Day */}
              <span className="font-medium flex items-center gap-1 text-slate-200">
                <CalendarDays className="w-3 h-3 text-sky-400" />
                {slot.day}
              </span>

              {/* Time Range */}
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-sky-300" />
                {slot.from} – {slot.to}
              </span>
            </motion.li>
          ))}
        </ul>
      )}
    </motion.div>
  );
}
