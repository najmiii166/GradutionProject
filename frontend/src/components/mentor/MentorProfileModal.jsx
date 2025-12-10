// src/components/mentor/MentorProfileModal.jsx
import { motion } from "framer-motion";
import { User, Briefcase, BookOpen, University } from "lucide-react";
import Spinner from "../../components/Spinner";

function Info({ label, value, icon: Icon }) {
  return (
    <div className="mb-2 flex items-start gap-2">
      {Icon && <Icon className="w-4 h-4 text-sky-400 mt-[2px]" />}
      <div>
        <p className="text-[11px] text-slate-400">{label}</p>
        <p className="text-sm text-slate-200 font-medium">{value || "—"}</p>
      </div>
    </div>
  );
}

export default function MentorProfileModal({
  open,
  loading,
  profile,
  fullName,
  onClose,
}) {
  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="
          w-full max-w-md rounded-2xl bg-slate-950
          border border-slate-800 shadow-2xl p-6 text-slate-50
        "
      >
        {/* HEADER */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
              Mentor Profile
            </p>

            <h2 className="text-xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent flex items-center gap-2">
              <User className="w-5 h-5 text-sky-400" />
              {fullName || "Mentor"}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-lg"
          >
            ✕
          </button>
        </div>

        {/* BODY */}
        {loading ? (
          <div className="py-6 flex items-center gap-2 text-xs text-slate-400">
            <Spinner className="border-white/60" />
            <span>Loading profile…</span>
          </div>
        ) : profile ? (
          <div className="space-y-4 text-xs">
            {/* INFO GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Info
                label="Institution"
                value={profile.institution}
                icon={University}
              />
              <Info
                label="Faculty"
                value={profile.faculty}
                icon={BookOpen}
              />
              <Info
                label="Department"
                value={profile.department}
                icon={BookOpen}
              />
              <Info
                label="Years of Experience"
                value={
                  profile.yearsOfExperience
                    ? `${profile.yearsOfExperience} years`
                    : "—"
                }
                icon={Briefcase}
              />
            </div>

            {/* BIO */}
            {profile.bio && (
              <div>
                <p className="text-slate-400 text-[11px] mb-1">Bio</p>
                <p className="leading-relaxed text-slate-100 bg-slate-900/40 p-3 rounded-xl border border-slate-800">
                  {profile.bio}
                </p>
              </div>
            )}

            {/* EXPERTISE */}
            {profile.expertiseAreas?.length > 0 && (
              <div>
                <p className="text-slate-400 text-[11px] mb-1">Expertise</p>
                <div className="flex flex-wrap gap-2">
                  {profile.expertiseAreas.map((tag, idx) => (
                    <span
                      key={idx}
                      className="
                        px-3 py-1 text-[11px] rounded-full 
                        bg-gradient-to-r from-sky-500/10 to-blue-600/10 
                        border border-sky-600/40 text-sky-200 
                        shadow-sm
                      "
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="py-4 text-xs text-slate-400">Could not load mentor profile.</p>
        )}
      </motion.div>
    </motion.div>
  );
}
