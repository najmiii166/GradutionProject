// src/components/student/RequestCard.jsx
import useCountdown from "../hooks/useCountdown";
import { isJoinWindowOpen } from "../utils/joinWindow";
import { MessageCircle, Calendar, ExternalLink, XCircle, Trash2 } from "lucide-react";
import { motion } from "framer-motion";

export default function RequestCard({
  r,
  user,
  navigate,
  api,
  cancelRequest,
  deleteRejected,
  setToast,
}) {
  const { text } = useCountdown(r.startTime);

  const now = new Date();
  const start = r.startTime ? new Date(r.startTime) : null;
  const end = r.endTime ? new Date(r.endTime) : null;

  const isOngoing = start && end && now >= start && now <= end;
  const effectiveStatus = isOngoing ? "ongoing" : r.status;
  // Strict join window: 5 minutes before start until end (UTC epoch comparisons)
  const windowOpen = isJoinWindowOpen(r.startTime, r.endTime, 5);
  const canJoin = Boolean(r.meetingLink) && (typeof r.canJoin === "boolean" ? r.canJoin : windowOpen);

  const getStatusStyles = () => {
    switch (effectiveStatus) {
      case "ongoing": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
      case "upcoming": return "text-cyan-400 bg-cyan-500/10 border-cyan-500/20";
      case "rejected": return "text-rose-400 bg-rose-500/10 border-rose-500/20";
      case "pending": return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      default: return "text-foreground/40 bg-foreground/5 border-border/50";
    }
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="relative group p-5 rounded-3xl border border-white/5 bg-white/[0.03] backdrop-blur-md transition-all duration-300 overflow-hidden"
    >
      {/* Refined Glass Glow */}
      <div className="absolute -inset-px bg-gradient-to-br from-cyan-500/5 to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        {/* HEADER */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 shadow-lg shadow-cyan-500/5 group-hover:scale-105 transition-transform">
              <Calendar size={18} strokeWidth={1.5} />
            </div>
            <div className="min-w-0">
              <h3 className="text-[13px] font-medium text-foreground/90 tracking-tight truncate leading-none mb-1">
                {r.mentorId?.user?.fullName || "Mentor"}
              </h3>
              <p className="text-[9px] text-foreground/30 font-bold truncate uppercase tracking-widest">
                {r.slot?.day} • {r.slot?.from}
              </p>
            </div>
          </div>
          
          <div className={`px-2 py-0.5 rounded-full border text-[8px] font-bold uppercase tracking-widest ${getStatusStyles()}`}>
            {effectiveStatus}
          </div>
        </div>

        {/* COUNTDOWN (The "Intelligence" feel) */}
        {!isOngoing && r.status === "upcoming" && text && text !== "Starting now" && (
          <div className="mb-4 py-2 px-3 rounded-2xl bg-cyan-500/[0.03] border border-cyan-500/10">
            <p className="text-[9px] font-bold text-foreground/30 uppercase tracking-[0.2em]">
              Starts in <span className="text-cyan-400 animate-pulse">{text}</span>
            </p>
          </div>
        )}

        {/* ACTIONS */}
        {(effectiveStatus === "upcoming" || effectiveStatus === "ongoing") && (
          <div className="flex gap-2 pt-3 border-t border-white/5">
            {canJoin && (
              <button
                onClick={async () => {
                  try {
                    // Fire-and-forget join tracking; do not block opening link
                    await api.post(`/requests/${r._id}/join`);
                  } catch {}
                  try {
                    window.open(r.meetingLink, "_blank", "noopener,noreferrer");
                  } catch {}
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-widest py-2 rounded-xl bg-cyan-500 text-white hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20"
              >
                <ExternalLink size={12} />
                Join
              </button>
            )}

            <button
              onClick={async () => {
                try {
                  const mentorUserId = r.mentorId?.user?._id || r.mentorId?._id;
                  const { data } = await api.post("/chat/open", {
                    mentorId: mentorUserId,
                    studentId: user._id,
                  });
                  navigate(`/chat/${data._id}`);
                } catch {
                  setToast("Failed to open chat");
                }
              }}
              className={`inline-flex items-center justify-center gap-2 text-[9px] font-bold uppercase tracking-widest py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] transition-all ${canJoin ? 'px-4' : 'flex-1'}`}
            >
              <MessageCircle size={12} className="text-cyan-500" />
              Chat
            </button>
          </div>
        )}

        {/* SECONDARY ACTIONS */}
        {(r.status === "pending" || r.status === "rejected") && (
          <div className="flex justify-end pt-2">
            {r.status === "pending" ? (
              <button
                onClick={() => cancelRequest(r._id)}
                className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-widest text-rose-500/40 hover:text-rose-500 transition-colors"
              >
                <XCircle size={10} />
                Cancel
              </button>
            ) : (
              <button
                onClick={() => deleteRejected(r._id)}
                className="flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-widest text-foreground/20 hover:text-rose-500 transition-colors"
              >
                <Trash2 size={10} />
                Clear
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}