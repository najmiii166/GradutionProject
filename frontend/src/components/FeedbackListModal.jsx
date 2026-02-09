import { useEffect, useState } from "react";
import { api } from "../api/axios";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, User } from "lucide-react";

export default function FeedbackListModal({ session, onClose }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await api.get(`/feedback/session/${session._id}`);
        if (mounted) setItems(res?.data?.data || []);
      } catch (err) {
        console.error("Failed to fetch session feedback", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => (mounted = false);
  }, [session._id]);

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
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/10 blur-[100px] rounded-full" />

          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl hover:bg-foreground/5 text-foreground/40 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <h3 className="text-lg font-semibold text-foreground mb-3">Session Feedback</h3>
          <p className="text-xs text-foreground/50 mb-5">Comments and ratings for this session.</p>

          {loading ? (
            <div className="text-slate-400 text-sm">Loading…</div>
          ) : items.length === 0 ? (
            <div className="text-slate-400 text-sm">No feedback yet.</div>
          ) : (
            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-2 custom-scrollbar">
              {items.map((it) => (
                <div key={it._id} className="p-3 rounded-xl bg-foreground/[0.03] border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-2 text-[11px] font-semibold px-2 py-1 rounded-full border border-foreground/20 text-foreground/60">
                      <User size={12} /> {it.raterRole}
                    </span>
                    {typeof it.rating === "number" && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-yellow-400">
                        <Star size={12} /> {it.rating}
                      </span>
                    )}
                  </div>
                  {it.comment && (
                    <p className="text-sm text-foreground/80">{it.comment}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
