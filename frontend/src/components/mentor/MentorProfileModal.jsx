// src/components/mentor/MentorProfileModal.jsx
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, BookOpen, University, Star, X } from "lucide-react";
import Spinner from "../../components/Spinner";
import { api } from "../../api/axios";
import UserAvatar from "../UserAvatar";
import UserAvatarPicker from "../UserAvatarPicker";

// Helper to fix "computer_science_technology" -> "Computer Science Technology"
const formatSlug = (str) => {
  if (!str) return "—";
  return str
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

function Info({ label, value, icon: Icon }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-2xl bg-foreground/[0.03] border border-border/50 h-full">
      <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500 shrink-0">
        <Icon size={14} strokeWidth={2.5} />
      </div>
      <div className="min-w-0">
        <p className="text-[9px] uppercase tracking-widest font-black text-foreground/30">{label}</p>
        <p className="text-[11px] font-bold text-foreground/80 leading-tight break-words">
          {value || "—"}
        </p>
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
  const [localProfile, setLocalProfile] = useState(profile || {});
  const [submitting, setSubmitting] = useState(false);
  const [selectedScore, setSelectedScore] = useState(null);
  const [editName, setEditName] = useState("");
  const [identityImageFile, setIdentityImageFile] = useState(null);
  const [identityImageChanged, setIdentityImageChanged] = useState(false); // tracks any user action (upload/remove)
  const [identityPreview, setIdentityPreview] = useState("");
  const [savingIdentity, setSavingIdentity] = useState(false);

  React.useEffect(() => {
    setLocalProfile(profile || {});
    const resolvedName = profile?.user?.fullName || profile?.fullName || fullName || "";
    setEditName(resolvedName);
    // Always prefer user.profileImageUrl if present, else fallback
    setIdentityPreview(profile?.user?.profileImageUrl || profile?.profileImageUrl || "");
    setIdentityImageFile(null);
    setIdentityImageChanged(false); // reset change flag when modal opens or profile updates
  }, [profile, fullName]);

  const role = localStorage.getItem("role");
  const mentorId = localProfile.user?._id || localProfile.userId || null;

  const saveIdentity = async () => {
    setSavingIdentity(true);
    try {
      let updatedUser = null;
      if (editName.trim()) {
        const { data } = await api.put("/users/profile", { fullName: editName.trim() });
        updatedUser = data?.user || null;
      }

      if (identityImageChanged) {
        // only process changes when user interacted
        if (identityImageFile) {
          const payload = new FormData();
          payload.append("profileImage", identityImageFile);
          const avatarResp = await api.put("/users/profile-image", payload);
          updatedUser = avatarResp.data?.user || updatedUser;
        } else {
          // Remove image
          await api.delete("/users/profile-image");
          // make sure we propagate the removal even if name didn't change
          updatedUser = updatedUser || {};
          updatedUser.profileImageUrl = "";
        }
      }

      if (updatedUser) {
        const existing = JSON.parse(localStorage.getItem("user") || "{}");
        const merged = { ...existing, ...updatedUser };
        localStorage.setItem("user", JSON.stringify(merged));
        sessionStorage.setItem("user", JSON.stringify(merged));
        if (merged.fullName) {
          localStorage.setItem("fullName", merged.fullName);
          sessionStorage.setItem("fullName", merged.fullName);
        }

        setLocalProfile((prev) => ({
          ...prev,
          fullName: merged.fullName,
          profileImageUrl: merged.profileImageUrl,
          user: {
            ...(prev?.user || {}),
            fullName: merged.fullName,
            profileImageUrl: merged.profileImageUrl,
          },
        }));
        setIdentityPreview(merged.profileImageUrl || "");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingIdentity(false);
    }
  };

  const submitRating = async (score) => {
    if (!mentorId) return;
    setSubmitting(true);
    try {
      const { data } = await api.post(`/mentor/mentors/${mentorId}/rate`, { score });
      setLocalProfile((p) => ({ ...p, averageRating: data.averageRating, totalRatings: data.totalRatings }));
      setSelectedScore(score);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-md p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-lg rounded-[2.5rem] bg-card/40 border border-border/50 shadow-2xl p-8 text-foreground relative overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 h-48 w-48 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />

        {/* HEADER */}
        <div className="flex items-start justify-between mb-8 relative z-10">
          <div className="flex items-center gap-4">
            <UserAvatar
              name={localProfile?.user?.fullName || localProfile?.fullName || fullName || "Mentor"}
              src={localProfile?.profileImageUrl || localProfile?.user?.profileImageUrl || ""}
              size={64}
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold tracking-tight">
                  {localProfile?.user?.fullName || localProfile?.fullName || fullName || "Mentor"}
                </h2>
                {localProfile?.badge && localProfile.badge !== '—' && (
                  <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-black uppercase tracking-wider">
                    {localProfile.badge}
                  </span>
                )}
              </div>
              <p className="text-xs text-foreground/40 font-medium">
                {localProfile?.user?.university || localProfile?.university || "Verified Mentor"}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-foreground/40 hover:text-foreground transition-all">
            <X size={20} />
          </button>
        </div>

        {/* BODY */}
        <div className="max-h-[55vh] overflow-y-auto pr-2 space-y-6 custom-scrollbar relative z-10">
          {loading ? (
            <div className="py-12 flex flex-col items-center gap-4 opacity-40">
              <Spinner className="w-8 h-8 border-cyan-500" />
              <span className="text-xs font-bold uppercase tracking-widest">Fetching Profile</span>
            </div>
          ) : (
            <>
              {/* GRID INFO */}
              <div className="grid grid-cols-2 gap-3 items-stretch">
                <Info label="Institution" value={profile.institution} icon={University} />
                <Info label="Faculty" value={formatSlug(profile.faculty)} icon={BookOpen} />
                <Info label="Experience" value={profile.yearsOfExperience ? `${profile.yearsOfExperience}y` : "—"} icon={Briefcase} />
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-cyan-500/5 border border-cyan-500/20">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500">
                    <Star size={14} fill="currentColor" />
                  </div>
                  <div>
                    <p className="text-[9px] uppercase tracking-widest font-black text-cyan-500/50">Rating</p>
                    <p className="text-xs font-black text-cyan-600">
                      {localProfile.averageRating ?? 0} <span className="text-[10px] opacity-60">({localProfile.totalRatings ?? 0})</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* BIO */}
              {profile.bio && (
                <div className="space-y-2">
                  <span className="text-[9px] uppercase tracking-[0.2em] font-black text-foreground/30 px-1">Biography</span>
                  <p className="text-xs leading-relaxed text-foreground/70 bg-foreground/[0.02] p-4 rounded-[1.5rem] border border-border/50">
                    {profile.bio}
                  </p>
                </div>
              )}

              {/* EXPERTISE */}
              {profile.expertiseAreas?.length > 0 && (
                <div className="space-y-3">
                  <span className="text-[9px] uppercase tracking-[0.2em] font-black text-foreground/30 px-1">Expertise</span>
                  <div className="flex flex-wrap gap-2">
                    {profile.expertiseAreas.map((tag, idx) => (
                      <span key={idx} className="px-3 py-1.5 text-[10px] font-bold rounded-xl bg-cyan-500/5 border border-cyan-500/20 text-cyan-600 tracking-tight">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* STUDENT RATING ACTION */}
              {role === "student" && (
                <div className="p-5 rounded-[2rem] bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-xl shadow-cyan-500/20">
                  <p className="text-[10px] font-black uppercase tracking-widest mb-3 opacity-80">Rate your experience</p>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        disabled={submitting}
                        onClick={() => submitRating(s)}
                        className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                          selectedScore === s ? "bg-white text-cyan-600 scale-105" : "bg-white/10 hover:bg-white/20 text-white"
                        }`}
                      >
                        {s} ★
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {role === "mentor" && (
                <div className="space-y-3 p-4 rounded-2xl bg-foreground/[0.02] border border-border/40">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-foreground/40">Profile Settings</p>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full rounded-xl border border-border bg-background/60 px-3 py-2 text-sm outline-none focus:border-cyan-500/50"
                    placeholder="Full Name"
                  />
                  <UserAvatarPicker
                    label="Profile Image"
                    name={editName}
                    initialSrc={identityPreview}
                    onChange={(file, preview) => {
                      setIdentityImageFile(file || null);
                      setIdentityPreview(preview || "");
                      setIdentityImageChanged(true);
                    }}
                  />
                  <button
                    type="button"
                    disabled={savingIdentity}
                    onClick={saveIdentity}
                    className="w-full px-4 py-2 rounded-xl bg-cyan-500 text-white text-xs font-bold uppercase tracking-widest hover:bg-cyan-400 disabled:opacity-60"
                  >
                    {savingIdentity ? "Saving..." : "Save Profile"}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}