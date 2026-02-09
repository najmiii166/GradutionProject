import { useEffect, useState } from "react";
import { api } from "../api/axios";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Info } from "lucide-react";

export default function FeedbackModal({ session, onClose, onSubmitted }) {
  const role = localStorage.getItem("role");
  const [loading, setLoading] = useState(true);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [sending, setSending] = useState(false);

  // Student required: rating 1..5; optional comment
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setErrorMsg("");
      try {
        const res = await api.get(`/feedback/session/${session._id}`);
        const items = res?.data?.data || [];
        const mine = items.find((it) => it.raterRole === role);
        if (mounted) setAlreadySubmitted(!!mine);
      } catch (err) {
        console.error("Failed to load feedback for session", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [session._id, role]);

  const canSubmit = () => {
    if (role === "student") return rating >= 1 && rating <= 5 && comment.length <= 500;
    // mentor: comment optional, rating optional, but respect max length
    return comment.length <= 500;
  };

  const handleSubmit = async () => {
    if (alreadySubmitted || sending || !canSubmit()) return;
    setSending(true);
    setErrorMsg("");
    try {
      const payload = { sessionId: session._id, comment: comment.trim() };
      if (role === "student") payload.rating = rating;
      await api.post("/feedback", payload);
      setAlreadySubmitted(true);
      if (onSubmitted) onSubmitted();
      onClose();
    } catch (err) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || "Failed to submit feedback.";
      if (status === 409) {
        setAlreadySubmitted(true);
        if (onSubmitted) onSubmitted();
        onClose();
        return;
      }
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
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="w-full max-w-md rounded-3xl border border-border/50 bg-card/90 backdrop-blur-2xl p-6 shadow-2xl relative overflow-hidden"
        >
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-sky-500/10 blur-[100px] rounded-full" />

          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl hover:bg-foreground/5 text-foreground/40 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <h3 className="text-lg font-semibold text-foreground mb-3">Post-Session Feedback</h3>
          <p className="text-xs text-foreground/50 mb-5">
            {role === "student"
              ? "Rate your mentor and leave an optional comment."
              : "Share a brief note about the student's preparedness (optional)."}
          </p>

          {alreadySubmitted && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] font-semibold">
              Feedback already submitted for this session.
            </div>
          )}

          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[11px] font-semibold">
              {errorMsg}
            </div>
          )}

          {loading ? (
            <div className="text-slate-400 text-sm">Loading…</div>
          ) : (
            <div className="space-y-5">
              {role === "student" && (
                <div>
                  <label className="text-[10px] uppercase tracking-widest font-bold text-foreground/40 mb-2 block">
                    Mentor Rating
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setRating(n)}
                        className={`p-2 rounded-xl border transition ${
                          rating >= n ? "bg-yellow-500/20 border-yellow-500/40" : "bg-foreground/[0.03] border-border/50"
                        }`}
                        aria-label={`Rate ${n}`}
                      >
                        <Star size={16} className={rating >= n ? "text-yellow-400" : "text-foreground/30"} />
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-foreground/40 mt-1">Select 1–5 stars.</p>
                </div>
              )}

              <div>
                <label className="text-[10px] uppercase tracking-widest font-bold text-foreground/40 mb-2 block">
                  Comment {role === "student" ? "(optional)" : "(optional)"}
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="w-full rounded-xl bg-foreground/[0.03] border border-border/50 p-3 text-sm text-foreground focus:outline-none focus:border-foreground/30"
                  placeholder={role === "student" ? "What went well? Any suggestions?" : "Preparedness, focus, or any notes…"}
                />
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-foreground/40">{500 - comment.length} chars left</span>
                  {comment.length > 500 && (
                    <span className="text-[10px] text-rose-400 flex items-center gap-1"><Info size={12}/> Max 500</span>
                  )}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSubmit}
                  disabled={alreadySubmitted || sending || !canSubmit()}
                  className="px-5 py-2.5 rounded-xl bg-foreground text-background text-xs font-bold uppercase tracking-widest hover:bg-sky-500 hover:text-white disabled:opacity-30 transition"
                >
                  {sending ? "Submitting…" : "Submit Feedback"}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
