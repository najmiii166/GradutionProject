// frontend/src/components/student/EditProfileModal.jsx
import { useState, useEffect } from "react";
import { api } from "../api/axios";
import Spinner from "./Spinner"
import { X, User, School, Mail, Target } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import UserAvatarPicker from "./UserAvatarPicker";

export default function EditProfileModal({ user, onClose, onUpdated }) {
  const [form, setForm] = useState({
    fullName: user.fullName || "",
    university: user.university || "",
    email: user.email || "",
    mentorshipAreas: [],
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [profileImageChanged, setProfileImageChanged] = useState(false);
  const [profilePreview, setProfilePreview] = useState(user.profileImageUrl || "");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get("/student/matches");
        setForm((prev) => ({
          ...prev,
          mentorshipAreas: data.mentorshipAreas || [],
        }));
      } catch (err) {
        console.error("Failed to load mentorship areas:", err);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.put("/users/profile", {
        fullName: form.fullName,
      });

      let updatedUser = data.user;

      if (profileImageChanged) {
        if (profileImageFile) {
          const payload = new FormData();
          payload.append("profileImage", profileImageFile);
          const avatarResp = await api.put("/users/profile-image", payload);
          updatedUser = avatarResp.data?.user || { ...updatedUser, profileImageUrl: avatarResp.data?.profileImageUrl || "" };
        } else {
          // user removed the image
          const resp = await api.delete("/users/profile-image");
          updatedUser = resp.data?.user || { ...updatedUser, profileImageUrl: "" };
        }
      }

      onUpdated(updatedUser);
      onClose();
    } catch (err) {
      console.error("Profile update error:", err);
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-background/90 border border-border/50 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl shadow-cyan-500/10 backdrop-blur-2xl"
      >
        {/* Header Decor */}
        <div className="h-2 w-full bg-gradient-to-r from-cyan-500 to-blue-600" />
        
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">
                Account <span className="text-cyan-500">Settings</span>
              </h2>
              <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/40 font-bold">Manage your identity</p>
            </div>
            <button 
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-foreground/5 text-foreground/40 hover:text-foreground transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <UserAvatarPicker
              label="Profile Image"
              name={form.fullName}
              initialSrc={profilePreview}
              onChange={(file, preview) => {
                setProfileImageFile(file || null);
                setProfilePreview(preview || "");
                setProfileImageChanged(true);
              }}
            />

            {/* Email (Read Only) */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-foreground/40 px-1">
                <Mail size={12} /> Email Address
              </label>
              <input
                type="email"
                value={form.email}
                disabled
                className="w-full px-4 py-3 rounded-2xl bg-foreground/[0.02] border border-border/50 text-foreground/30 cursor-not-allowed text-sm font-medium"
              />
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-foreground/40 px-1">
                <User size={12} /> Full Name
              </label>
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full px-4 py-3 rounded-2xl bg-foreground/[0.03] border border-border/50 text-foreground focus:border-cyan-500/50 focus:bg-foreground/[0.05] outline-none transition-all text-sm font-medium"
              />
            </div>

            {/* University (Read Only) */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-foreground/40 px-1">
                <School size={12} /> University
              </label>
              <input
                type="text"
                value={form.university}
                disabled
                className="w-full px-4 py-3 rounded-2xl bg-foreground/[0.02] border border-border/50 text-foreground/30 cursor-not-allowed text-sm font-medium"
              />
            </div>

            {/* Mentorship Areas */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-foreground/40 px-1">
                <Target size={12} /> Your Focus Areas
              </label>
              {form.mentorshipAreas.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {form.mentorshipAreas.map((area, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-500 text-[10px] font-bold uppercase tracking-wider"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-2xl border border-dashed border-border/50 text-center">
                   <p className="text-[10px] text-foreground/30 uppercase font-bold">No areas assigned yet</p>
                </div>
              )}
            </div>

            {error && (
              <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest text-center">{error}</p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/40 hover:text-foreground hover:bg-foreground/5 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-[2] flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-cyan-500 text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-cyan-400 disabled:opacity-20 transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.98]"
              >
                {saving ? <Spinner /> : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}