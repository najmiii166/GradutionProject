// src/components/student/StudentProfileModal.jsx
import { motion, AnimatePresence } from "framer-motion";
import { University, BookOpen, GraduationCap, X, Mail } from "lucide-react";
import Spinner from "../../components/Spinner";
import { faculties } from "../../constants/systemData"; // Import your constant
import UserAvatar from "../UserAvatar";

// Helper to match the MentorRequests logic
const getFacultyName = (key) => {
  if (!key) return "—";
  const faculty = faculties.find((f) => f.key === key);
  return faculty ? faculty.name : key.replace(/_/g, " ");
};

export default function StudentProfileModal({ open, loading, profile, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-md rounded-[2.5rem] bg-card border border-border/50 shadow-2xl p-8 relative overflow-hidden"
          >
            {/* Header: Name Only */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <UserAvatar name={profile?.user?.fullName || profile?.fullName} src={profile?.profileImageUrl || profile?.user?.profileImageUrl} size={48} />
                <h2 className="text-xl font-bold text-foreground/90 tracking-tight">
                  {profile?.user?.fullName || profile?.fullName || "Student Identity"}
                </h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-foreground/5 rounded-xl text-foreground/30 transition-colors">
                <X size={20} />
              </button>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center gap-3">
                <Spinner className="border-cyan-500" />
                <p className="text-[10px] uppercase tracking-widest text-foreground/40 font-black">Syncing Dossier...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Unified Data Section */}
                <div className="p-5 rounded-[2rem] bg-foreground/[0.02] border border-border/40 space-y-4">
                  {/* Email */}
                  <div className="flex items-center gap-3">
                    <Mail size={14} className="text-cyan-500/50" />
                    <p className="text-sm font-medium text-foreground/70 italic">
                        {profile?.user?.email || profile?.email || "No Email Provided"}
                    </p>
                  </div>
                  
                  <div className="h-px bg-border/40 w-full" />

                  {/* University, Faculty, Semester Grouped */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="flex items-center gap-3">
                      <University size={14} className="text-cyan-500/50" />
                      <span className="text-xs font-bold uppercase tracking-wider text-foreground/60">
                        {profile?.university || profile?.user?.university || "No University"}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <BookOpen size={14} className="text-cyan-500/50" />
                      <span className="text-xs font-bold uppercase tracking-wider text-foreground/60">
                        {/* Uses the same helper as MentorRequests */}
                        {getFacultyName(profile?.faculty)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <GraduationCap size={14} className="text-cyan-500/50" />
                      <span className="text-xs font-bold uppercase tracking-wider text-foreground/60">
                        Semester {profile?.semester || "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* About Section */}
                {profile?.about && (
                  <div className="px-1">
                    <p className="text-[10px] uppercase tracking-widest font-black text-foreground/30 mb-2 text-center">Summary</p>
                    <p className="text-[13px] leading-relaxed text-foreground/60 italic font-serif text-center">
                        "{profile.about}"
                    </p>
                  </div>
                )}

                {/* Mentorship Areas */}
                {profile?.mentorshipAreas && profile.mentorshipAreas.length > 0 && (
                  <div className="px-1 mt-4">
                    <p className="text-[10px] uppercase tracking-widest font-black text-foreground/30 mb-3 text-center">Interests</p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      {profile.mentorshipAreas.map((area, idx) => (
                        <span key={idx} className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 shadow-sm">
                          {area}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}