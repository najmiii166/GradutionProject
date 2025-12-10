import { useState, useEffect } from "react";
import { api } from "../api/axios";
import Spinner from "./Spinner";
import { LogOut } from "lucide-react";

export default function EditProfileModal({ user, onClose, onUpdated, onLogout }) {
  const [form, setForm] = useState({
    fullName: user.fullName || "",
    university: user.university || "",
    email: user.email || "",
    mentorshipAreas: [],
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
      onUpdated(data.user);
      onClose();
    } catch (err) {
      console.error("Profile update error:", err);
      setError(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
      <div className="bg-slate-900/70 border border-sky-500/30 rounded-2xl p-6 w-full max-w-lg shadow-[0_0_20px_rgba(56,189,248,0.3)]">
        
        {/* Header */}
        <h2 className="text-xl font-bold bg-gradient-to-r from-sky-400 to-blue-500 bg-clip-text text-transparent mb-4">
           Profile
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-sm mb-1 text-slate-400">Email</label>
            <input
              type="email"
              value={form.email}
              disabled
              className="w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed"
            />
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-sm mb-1 text-slate-200">Full Name</label>
            <input
              type="text"
              name="fullName"
              value={form.fullName}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-white focus:border-sky-500 transition"
            />
          </div>

          {/* University */}
          <div>
            <label className="block text-sm mb-1 text-slate-400">University</label>
            <input
              type="text"
              value={form.university}
              disabled
              className="w-full px-3 py-2 rounded-md bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed"
            />
          </div>

          {/* Mentorship Areas */}
          <div>
            <label className="block text-sm mb-1 text-slate-400">Mentorship Areas</label>
            {form.mentorshipAreas.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {form.mentorshipAreas.map((area, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 rounded-full bg-sky-500/10 border border-sky-600 text-sky-300 text-xs"
                  >
                    {area}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500">No mentorship areas set.</p>
            )}
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-3">

            {/* Logout Icon with Tooltip */}
            <div className="relative group">
              <button
                type="button"
                onClick={onLogout}
                className="p-2 rounded-md border border-rose-500/30 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 transition flex items-center justify-center"
              >
                <LogOut className="w-5 h-5" />
              </button>

              {/* Tooltip */}
              <span className="absolute left-1/2 -translate-x-1/2 mt-2 pointer-events-none opacity-0 group-hover:opacity-100 transition bg-slate-800 text-xs text-slate-100 px-2 py-1 rounded-md border border-slate-700 whitespace-nowrap">
                Logout
              </span>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm rounded-md border border-slate-700 hover:bg-slate-800"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 text-sm rounded-md bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 disabled:opacity-50"
              >
                {saving ? <Spinner /> : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
