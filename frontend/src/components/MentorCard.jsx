import { motion } from "framer-motion";
import { Calendar, Sparkles, Briefcase } from "lucide-react";
import { faculties } from "../constants/systemData";

export default function MentorCard({ mentor, onClick }) {
  const name = mentor.user?.fullName || "Unknown Mentor";
  const university = mentor.user?.university || "—";
  const expertise = mentor.expertiseAreas || [];
  const availability = mentor.availability || [];
  const experience = mentor.yearsOfExperience ?? 0;
  const averageRating = mentor.averageRating ?? mentor.user?.averageRating ?? 0;
  const totalRatings = mentor.totalRatings ?? 0;
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -3 }}
      transition={{ type: "spring", stiffness: 220, damping: 18 }}
      className="relative group rounded-2xl border border-slate-800 bg-slate-950/70 backdrop-blur-md p-5 shadow-lg flex flex-col justify-between min-h-[220px]"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 text-white font-semibold text-sm shadow-md shadow-cyan-500/30">
          {initials}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white truncate max-w-[150px]">{name}</h3>
          <p className="text-xs text-slate-400 truncate">{university}</p>
          <div className="flex items-center gap-2 mt-1">
            <div className="text-sm font-semibold text-sky-400">{(averageRating || 0).toFixed(1)}★</div>
            <div className="text-xs text-slate-400">({totalRatings} ratings)</div>
          </div>
          {experience > 0 && (
            <p className="flex items-center gap-1 text-[0.7rem] text-slate-400 mt-[2px]">
              <Briefcase className="w-3 h-3 text-cyan-400" />
              {experience} {experience === 1 ? "year" : "years"} experience
            </p>
          )}
        </div>
      </div>

      {/* Expertise */}
      {expertise.length > 0 && (
        <div className="mb-3 flex flex-col gap-1">
          <p className="text-[0.7rem] text-slate-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-cyan-400" /> Expertise
          </p>
          <div className="flex flex-wrap gap-1">
            {expertise.slice(0, 2).map((tag, i) => {
              const friendly = (faculties.flatMap(f => f.subs).find(s => s.key === tag) || { name: tag }).name;
              return (
                <span
                  key={i}
                  className="px-2 py-[2px] rounded-full bg-slate-800/60 border border-cyan-600/40 text-[0.7rem] text-sky-200"
                >
                  {friendly}
                </span>
              );
            })}
            {expertise.length > 2 && (
              <span className="px-2 py-[2px] rounded-full bg-slate-800/60 text-slate-400 text-[0.7rem]">
                +{expertise.length - 2} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Availability */}
      {availability.length > 0 && (
        <div className="mb-4">
          <p className="text-[0.7rem] text-slate-400 flex items-center gap-1 mb-1">
            <Calendar className="w-3 h-3 text-violet-400" /> Availability
          </p>
          <div className="flex flex-wrap gap-1">
            {availability.slice(0, 1).map((slot, i) => (
              <span
                key={i}
                className="text-[0.7rem] px-2 py-[1px] rounded-full bg-slate-800/50 text-slate-300 border border-slate-700/50 truncate"
              >
                {slot.day}: {slot.from}–{slot.to}
              </span>
            ))}
            {availability.length > 1 && (
              <span className="text-[0.7rem] text-slate-500">+ more</span>
            )}
          </div>
        </div>
      )}

      {/* Request Button */}
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.05 }}
        className="self-end mt-auto px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-md shadow-cyan-500/30 hover:shadow-[0_0_12px_rgba(56,189,248,0.5)] transition"
      >
        Request
      </motion.button>
    </motion.div>
  );
}
