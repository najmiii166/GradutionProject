// frontend/src/components/MentorModal.jsx
import { useState } from "react";
import { api } from "../api/axios";
import Spinner from "./Spinner";
import { Briefcase, Sparkles, Calendar, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MentorModal({ mentor, onClose, onRequestSent, disabled }) {
  const name = mentor.user?.fullName || "Mentor";
  const university = mentor.user?.university || "—";
  const bio = mentor.bio || "No bio provided.";
  const experience = mentor.yearsOfExperience ?? 0;
  const areas = mentor.expertiseAreas || [];
  const availability = mentor.availability || [];

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const handleSendRequest = async () => {
    if (disabled) return;

    if (!selectedSlot) {
      setError("Please select an availability slot.");
      return;
    }

    setSending(true);
    try {
      await api.post("/requests", {
        mentorId: mentor._id,
        slot: selectedSlot,
      });

      if (onRequestSent) onRequestSent();
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || "Failed to send request.");
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-xl p-6 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-violet-500/10 to-blue-500/10 blur-3xl" />

          {/* Header */}
          <div className="relative z-10 flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold bg-gradient-to-r from-cyan-400 via-violet-400 to-blue-400 bg-clip-text text-transparent">
                {name}
              </h2>
              <p className="text-xs text-slate-400">{university}</p>

              {experience > 0 && (
                <p className="flex items-center gap-1 text-[0.7rem] text-slate-400 mt-1">
                  <Briefcase className="w-3 h-3 text-cyan-400" />
                  {experience} {experience === 1 ? "year" : "years"} experience
                </p>
              )}
            </div>

            <button
              onClick={onClose}
              className="rounded-full w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
            >
              ✕
            </button>
          </div>

          {/* Bio */}
          <div className="relative z-10 mb-4">
            <p className="text-xs text-slate-400 mb-1">About</p>
            <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/40 border border-slate-800 rounded-lg p-3">
              {bio}
            </p>
          </div>

          {/* Expertise */}
          {areas.length > 0 && (
            <div className="relative z-10 mb-4">
              <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" /> Expertise
              </p>
              <div className="flex flex-wrap gap-2">
                {areas.map((tag, i) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border border-cyan-600/40 text-[0.7rem] text-sky-200"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Availability */}
          <div className="relative z-10 mb-4">
            <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-violet-400" /> Available time slots
            </p>

            {availability.length === 0 ? (
              <p className="text-xs text-slate-500">No availability listed.</p>
            ) : (
              <select
                className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 mt-1 focus:ring-1 focus:ring-cyan-500"
                onChange={(e) => setSelectedSlot(JSON.parse(e.target.value))}
              >
                <option value="">Select a time slot</option>
                {availability.map((slot, i) => (
                  <option key={i} value={JSON.stringify(slot)}>
                    {slot.day} — {slot.from} to {slot.to}
                  </option>
                ))}
              </select>
            )}
          </div>

          {error && <p className="text-xs text-rose-400 mt-1">{error}</p>}

          {/* Actions Row */}
          <div className="relative z-10 mt-6 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-slate-600 text-xs text-slate-300 hover:bg-slate-800/60 transition"
            >
              Cancel
            </button>

            <button
              onClick={handleSendRequest}
              disabled={sending || disabled}
              className={`px-4 py-2 rounded-full text-xs font-medium text-white bg-gradient-to-r from-cyan-500 to-violet-600 shadow-md disabled:opacity-40 disabled:cursor-not-allowed transition ${
                sending || disabled ? "" : "hover:from-cyan-400 hover:to-violet-500"
              }`}
            >
              {sending ? <Spinner /> : "Send Request"}
            </button>
          </div>

          {/* Helper text when disabled */}
          {disabled && (
            <p className="flex items-center gap-1 text-[11px] text-rose-400 mt-2">
              <Info className="w-3 h-3" />
              You reached the limit of 2 active mentor requests.
            </p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
