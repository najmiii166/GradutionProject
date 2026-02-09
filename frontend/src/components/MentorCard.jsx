// src/components/student/MentorCard.jsx
import { motion } from "framer-motion";
import { Calendar, Sparkles, Briefcase, Star } from "lucide-react";
import { faculties, universities } from "../constants/systemData";

export default function MentorCard({ mentor, onClick, disabled = false }) {
  const name = mentor.user?.fullName || "Unknown Mentor";
  const universityKey = mentor.user?.university || mentor.institution || "";
  const university = universities.find((u) => String(u.key) === String(universityKey))?.name || "Independent";
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
      whileHover={{ y: -5 }}
      className="relative group flex flex-col justify-between min-h-[260px] p-5 rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-xl transition-all duration-300"
    >
      {/* Background Glow Effect */}
      <div className="absolute -inset-px bg-gradient-to-br from-cyan-500/10 to-violet-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        {/* 1. Header with Squircle Avatar */}
        <div className="flex items-start gap-3 mb-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform">
            {initials}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-foreground tracking-tight truncate">
              {name}
            </h3>
            <p className="text-[10px] text-foreground/40 font-medium truncate uppercase tracking-wider">
              {university}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex items-center gap-1 text-[10px] font-bold text-cyan-500 bg-cyan-500/10 px-1.5 py-0.5 rounded-md border border-cyan-500/20">
                <Star size={10} fill="currentColor" />
                {(averageRating || 0).toFixed(1)}
              </div>
              <span className="text-[10px] text-foreground/30 font-medium">({totalRatings} reviews)</span>
            </div>
          </div>
        </div>

        {/* 2. Stats & Expertise */}
        <div className="space-y-3">
          {experience > 0 && (
            <div className="flex items-center gap-2 text-[10px] font-bold text-foreground/60 uppercase tracking-widest">
              <Briefcase size={12} className="text-cyan-500" />
              {experience} {experience === 1 ? "Year" : "Years"} XP
            </div>
          )}

          <div className="flex flex-wrap gap-1.5">
            {expertise.slice(0, 2).map((tag, i) => {
              const friendly = (faculties.flatMap(f => f.subs).find(s => s.key === tag) || { name: tag }).name;
              return (
                <span key={i} className="px-2 py-1 rounded-lg bg-foreground/[0.03] border border-border/50 text-[10px] font-bold text-foreground/60">
                  {friendly}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* 3. Availability & CTA */}
      <div className="relative z-10 mt-6 pt-4 border-t border-border/30 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-foreground/30">Next Slot</p>
          {availability.length > 0 ? (
            <span className="text-[10px] font-bold text-foreground/70">
              {availability[0].day}: {availability[0].from}
            </span>
          ) : (
            <span className="text-[10px] font-bold text-foreground/20 italic">No Slots</span>
          )}
        </div>

        <button
          onClick={disabled ? undefined : onClick}
          disabled={disabled}
          className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all duration-300 shadow-lg shadow-black/10 ${disabled ? 'bg-foreground/10 text-foreground/40 cursor-not-allowed border border-border/30' : 'bg-foreground text-background hover:bg-cyan-500 hover:text-white'}`}
        >
          Request
        </button>
      </div>
    </motion.div>
  );
}

export function MentorCardSkeleton() {
  return (
    <div className="relative flex flex-col justify-between min-h-[260px] p-5 rounded-2xl border border-border/30 bg-card/40 backdrop-blur-xl shadow-xl animate-pulse">
      <div>
        <div className="flex items-start gap-3 mb-4">
          <div className="h-12 w-12 rounded-xl bg-foreground/10" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-foreground/10 rounded-full w-32" />
            <div className="h-3 bg-foreground/8 rounded-full w-24" />
            <div className="h-3 bg-foreground/6 rounded-full w-20" />
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-3 bg-foreground/10 rounded-full w-28" />
          <div className="flex gap-2">
            <div className="h-5 bg-foreground/10 rounded-lg w-20" />
            <div className="h-5 bg-foreground/8 rounded-lg w-16" />
          </div>
        </div>
      </div>
      <div className="mt-6 pt-4 border-t border-border/20 flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-2 bg-foreground/8 rounded-full w-16" />
          <div className="h-3 bg-foreground/6 rounded-full w-24" />
        </div>
        <div className="h-8 w-20 bg-foreground/10 rounded-xl" />
      </div>
    </div>
  );
}