import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../../api/axios";
import { Calendar, X, CheckCircle2 } from "lucide-react";
import Spinner from "../Spinner";

export default function FollowUpRequestModal({ session, onClose, onSubmitted }) {
  const mentor = session?.mentorId;
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [sessionGoal, setSessionGoal] = useState(session?.questionnaire?.sessionGoal || "");
  const [sending, setSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!mentor) return null;

  const handleSubmit = async () => {
    setErrorMsg("");
    if (!selectedSlot) {
      setErrorMsg("Please choose a new time slot.");
      return;
    }
    if (!sessionGoal || sessionGoal.trim().length < 20) {
      setErrorMsg("Session focus needs at least 20 characters.");
      return;
    }

    setSending(true);
    try {
      await api.post("/requests", {
        mentorId: mentor._id,
        slot: selectedSlot,
        questionnaire: {
          reason: session?.questionnaire?.reason || "",
          goals: session?.questionnaire?.goals || [],
          experienceLevel: session?.questionnaire?.experienceLevel || "",
          sessionGoal,
        },
        parentSessionId: session._id,
        isFollowUp: true,
      });
      if (onSubmitted) onSubmitted();
      onClose();
    } catch (err) {
      console.error("Follow-up request error", err);
      const msg = err?.response?.data?.message || "Failed to send follow-up request.";
      setErrorMsg(msg);
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
        className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="w-full max-w-xl rounded-3xl border border-border/50 bg-card/90 backdrop-blur-2xl p-8 shadow-2xl relative overflow-hidden"
        >
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-xl hover:bg-foreground/5 text-foreground/40 transition-colors"
          >
            <X size={20} />
          </button>

          <h2 className="text-xl font-light tracking-tight mb-6">
            Request <span className="text-cyan-500 italic font-serif">Follow-up Session</span>
          </h2>

          <div className="space-y-5 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
            <div className="p-4 rounded-2xl bg-foreground/[0.03] border border-border/50">
              <p className="text-[10px] uppercase tracking-[0.25em] font-black text-foreground/40 mb-1">
                Mentor
              </p>
              <p className="text-sm font-semibold text-foreground/90">
                {mentor.user?.fullName || "Mentor"}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.25em] font-black text-foreground/40">Your motivation</p>
              <p className="text-xs text-foreground/70 bg-foreground/[0.03] border border-border/40 rounded-2xl p-3 leading-relaxed">
                {session?.questionnaire?.reason || "No motivation recorded."}
              </p>
            </div>

            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.25em] font-black text-foreground/40">Primary goals</p>
              {Array.isArray(session?.questionnaire?.goals) && session.questionnaire.goals.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {session.questionnaire.goals.map((g) => (
                    <span
                      key={g}
                      className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-500"
                    >
                      {String(g).replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-foreground/50">No goals recorded.</p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.25em] font-black text-foreground/40">Experience level</p>
              <p className="inline-flex items-center px-3 py-1 rounded-full bg-foreground/[0.03] border border-border/40 text-[10px] font-bold uppercase tracking-[0.18em] text-foreground/70">
                {session?.questionnaire?.experienceLevel || "Not set"}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.25em] font-black text-foreground/40">
                Session focus (editable)
              </label>
              <textarea
                className="w-full p-4 rounded-xl bg-foreground/[0.03] border border-border/50 text-sm focus:outline-none focus:border-cyan-500/50 min-h-[80px] resize-none"
                value={sessionGoal}
                onChange={(e) => setSessionGoal(e.target.value)}
                placeholder="What do you want to focus on in this follow-up session?"
              />
              <p className="text-[10px] text-foreground/30 uppercase tracking-tight">
                {sessionGoal.length} / 20 chars
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.25em] font-black text-foreground/40 flex items-center gap-2">
                <Calendar size={14} className="text-cyan-500" />
                Choose new time
              </label>
              <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                {Array.isArray(mentor.availability) && mentor.availability.length > 0 ? (
                  mentor.availability.map((slot, i) => {
                    const isSelected = JSON.stringify(selectedSlot) === JSON.stringify(slot);
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                          isSelected
                            ? "bg-cyan-500/10 border-cyan-500 text-cyan-500"
                            : "bg-foreground/[0.03] border-border/50 text-foreground/70 hover:border-foreground/30"
                        }`}
                      >
                        <span className="text-xs font-semibold uppercase tracking-wider">{slot.day}</span>
                        <span className="text-[11px] text-foreground/50">
                          {slot.from} – {slot.to}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <p className="text-xs text-foreground/50">This mentor has no published availability.</p>
                )}
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-[11px] text-rose-400 font-semibold">
                {errorMsg}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/40 hover:text-foreground bg-foreground/[0.02] hover:bg-foreground/[0.05] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={sending}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 text-white text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-cyan-400 disabled:opacity-50 transition-all shadow-lg shadow-cyan-500/20"
            >
              {sending ? <Spinner /> : <><CheckCircle2 size={14} /> Send Follow-up</>}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
