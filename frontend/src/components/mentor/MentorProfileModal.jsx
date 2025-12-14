// src/components/mentor/MentorProfileModal.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { User, Briefcase, BookOpen, University } from "lucide-react";
import Spinner from "../../components/Spinner";
import { api } from "../../api/axios";

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

  const [localProfile, setLocalProfile] = useState(profile || {});
  const [submitting, setSubmitting] = useState(false);
  const [selectedScore, setSelectedScore] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [filterMentorsOnly, setFilterMentorsOnly] = useState(false);

  // keep localProfile in sync when prop changes
  React.useEffect(() => {
    setLocalProfile(profile || {});
  }, [profile]);

  const role = localStorage.getItem("role");

  const mentorId = localProfile.user?._id || localProfile.userId || localProfile.userId || null;

  const submitRating = async (score) => {
    if (!mentorId) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/mentor/mentors/${mentorId}/rate`, { score });
      // update local stats
      setLocalProfile((p) => ({ ...p, averageRating: data.averageRating, totalRatings: data.totalRatings }));
      setSelectedScore(score);
    } catch (err) {
      console.error(err);
      alert("Failed to submit rating. Make sure you are logged in as a student.");
    } finally {
      setSubmitting(false);
    }
  };

  // fetch ratings when modal opens or mentorId changes
  React.useEffect(() => {
    if (!open) return;
    const load = async () => {
      if (!mentorId) return;
      setRatingsLoading(true);
      try {
        const { data } = await api.get(`/mentor/mentors/${mentorId}/ratings`);
        setRatings(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to load ratings", err);
      } finally {
        setRatingsLoading(false);
      }
    };
    load();
  }, [open, mentorId]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl p-6 text-slate-50"
      >
        {/* HEADER */}
        <div className="flex items-start justify-between mb-5">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Mentor Profile</p>

            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent flex items-center gap-2">
                <User className="w-5 h-5 text-sky-400" />
                {localProfile?.user?.fullName || localProfile?.fullName || fullName || "Mentor"}
              </h2>
              { (localProfile?.badge || profile?.badge) && (localProfile?.badge || profile?.badge) !== '—' && (
                <span className="text-xs px-2 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-600/20">{localProfile?.badge || profile?.badge}</span>
              )}
            </div>

            <p className="text-xs text-slate-400 mt-1">
              {(localProfile?.user?.university || localProfile?.university) && (
                <span className="mr-2">{localProfile?.user?.university || localProfile?.university}</span>
              )}
              {localProfile?.user?.email || localProfile?.email ? (
                <span className="opacity-80">{localProfile?.user?.email || localProfile?.email}</span>
              ) : null}
              { (localProfile?.percentPositive ?? profile?.percentPositive) !== undefined && (
                <span className="ml-3 text-xs text-slate-400">{localProfile.percentPositive ?? profile.percentPositive}% positive</span>
              )}
            </p>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 text-lg">✕</button>
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
              <Info label="Institution" value={profile.institution} icon={University} />
              <Info label="Faculty" value={profile.faculty} icon={BookOpen} />
              <Info label="Department" value={profile.department} icon={BookOpen} />
              <Info
                label="Years of Experience"
                value={profile.yearsOfExperience ? `${profile.yearsOfExperience} years` : "—"}
                icon={Briefcase}
              />
            </div>

            {/* BIO */}
            {profile.bio && (
              <div>
                <p className="text-slate-400 text-[11px] mb-1">Bio</p>
                <p className="leading-relaxed text-slate-100 bg-slate-900/40 p-3 rounded-xl border border-slate-800">{profile.bio}</p>
              </div>
            )}

            {/* EXPERTISE */}
            {profile.expertiseAreas?.length > 0 && (
              <div>
                <p className="text-slate-400 text-[11px] mb-1">Expertise</p>
                <div className="flex flex-wrap gap-2">
                  {profile.expertiseAreas.map((tag, idx) => (
                    <span key={idx} className="px-3 py-1 text-[11px] rounded-full bg-gradient-to-r from-sky-500/10 to-blue-600/10 border border-sky-600/40 text-sky-200 shadow-sm">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Ratings */}
            <div>
              <p className="text-slate-400 text-[11px] mb-1">Rating</p>
              <div className="flex items-center gap-3">
                <div className="text-xl font-semibold text-sky-400">{localProfile.averageRating ?? profile.averageRating ?? 0}</div>
                <div className="text-xs text-slate-400">({localProfile.totalRatings ?? profile.totalRatings ?? 0} ratings)</div>
              </div>

              {role === "student" && (
                <div className="mt-3 flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button key={s} disabled={submitting} onClick={() => submitRating(s)} className={`px-3 py-1 rounded ${selectedScore === s ? "bg-sky-600" : "bg-slate-800"} text-sm`}>
                      {s}⭐
                    </button>
                  ))}
                  {submitting && <Spinner className="ml-2" />}
                </div>
              )}
              {/* Ratings list */}
              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <p className="text-slate-400 text-[11px] mb-2">Previous ratings</p>
                  <div className="text-xs">
                    <label className="flex items-center gap-2 text-slate-400">
                      <input type="checkbox" checked={filterMentorsOnly} onChange={(e) => setFilterMentorsOnly(e.target.checked)} />
                      <span className="text-xs">Only from users now mentors</span>
                    </label>
                  </div>
                </div>
                {ratingsLoading ? (
                  <div className="text-slate-400 text-sm">Loading ratings…</div>
                ) : ratings.length === 0 ? (
                  <div className="text-slate-400 text-sm">No ratings yet.</div>
                ) : (
                  <div className="space-y-3 max-h-44 overflow-y-auto">
                    {(filterMentorsOnly ? ratings.filter(r=>r.isNowMentor) : ratings).map((r, i) => (
                      <div key={i} className="p-3 bg-[#0F1720] border border-[#1f2937] rounded-md">
                        <div className="flex items-center justify-between">
                          <div className="text-sm font-medium">{r.userName || 'Anonymous'}</div>
                          <div className="text-xs text-slate-400">{r.score}⭐</div>
                        </div>
                        <div className="text-xs text-slate-400 mt-1">{r.comment || ''}</div>
                        <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                          <span>{r.createdAt ? new Date(r.createdAt).toLocaleString() : ''}</span>
                          {r.isNowMentor && <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-sky-300">Now Mentor</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="py-4 text-xs text-slate-400">Could not load mentor profile.</p>
        )}
      </motion.div>
    </motion.div>
  );
}
