// src/components/student/RequestCard.jsx
import useCountdown from "../hooks/useCountdown";
import { MessageCircle, Calendar, ExternalLink, XCircle, Trash2, User, Clock } from "lucide-react";
import { isJoinWindowOpen } from "../utils/joinWindow";
import { motion } from "framer-motion";
import UserAvatar from "./UserAvatar";

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
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.01 }}
      className="group relative p-5 rounded-xl border border-border/40 bg-foreground/[0.02] hover:border-cyan-500/40 hover:bg-foreground/[0.04] transition-all duration-300"
    >
      <div className="relative z-10">
        {/* HEADER */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <UserAvatar
              src={r.mentorId?.user?.profileImageUrl || ""}
              name={r.mentorId?.user?.fullName || "Mentor"}
              size={40}
              className="shrink-0"
            />
            <div className="min-w-0">
              <h3 className="text-[13px] font-bold text-foreground/90 truncate leading-none">
                {r.mentorId?.user?.fullName || "Mentor"}
              </h3>
              <p className="text-[9px] text-foreground/30 font-bold uppercase tracking-widest mt-1">
                {r.mentorId?.expertiseAreas?.[0] || "Authorized Mentor"}
              </p>
            </div>
          </div>
          <div className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-widest ${getStatusStyles()}`}>
            {effectiveStatus}
          </div>
        </div>

        {/* TIME & COUNTDOWN SECTION */}
        {effectiveStatus === "upcoming" || effectiveStatus === "ongoing" ? (
          <div className="grid grid-cols-2 gap-2 mb-4">
            <div className="flex flex-col justify-center px-3 py-1.5 rounded-lg bg-foreground/[0.03] border border-border/20">
              <span className="text-[7px] uppercase text-foreground/30 font-bold tracking-tighter">Schedule</span>
              <span className="text-[9px] font-bold text-foreground/70 truncate uppercase">
                {r.slot?.day.slice(0,3)} • {r.slot?.from}-{r.slot?.to}
              </span>
            </div>
            <div className="flex flex-col justify-center px-3 py-1.5 rounded-lg bg-foreground/[0.03] border border-border/20">
              <span className="text-[7px] uppercase text-foreground/30 font-bold tracking-tighter">Status</span>
              <span className={`text-[9px] font-bold uppercase truncate ${isOngoing ? "text-emerald-500" : "text-cyan-500/70"}`}>
                {isOngoing ? "LIVE NOW" : text || "WAITING"}
              </span>
            </div>
          </div>
        ) : (
          /* Single simple row for Pending/Rejected */
          <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg bg-foreground/[0.03] border border-border/20">
            <Calendar size={12} className="text-foreground/20" />
            <span className="text-[10px] font-bold text-foreground/50 uppercase">
              {r.slot?.day} {r.slot?.from} — {r.slot?.to}
            </span>
          </div>
        )}

        {/* ACTIONS */}
        <div className="flex items-center justify-between pt-4 border-t border-border/30 mt-auto">
          <div className="flex items-center gap-4">
            {(effectiveStatus === "upcoming" || effectiveStatus === "ongoing") && (
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
                className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-400 transition-colors"
              >
                <MessageCircle size={14} /> Chat
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {canJoin ? (
              <button
                onClick={async () => {
                  try {
                    await api.post(`/requests/${r._id}/join`);
                  } catch {}
                  try {
                    window.open(r.meetingLink, "_blank", "noopener,noreferrer");
                  } catch {}
                }}
                className="group/join flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-400 transition-colors duration-300"
              >
                <span className="group-hover/join:underline underline-offset-4">Join Session</span>
                <ExternalLink className="w-3.5 h-3.5 group-hover/join:-translate-y-0.5 group-hover/join:translate-x-0.5 transition-transform" />
              </button>
            ) : r.status === "pending" ? (
              <button
                onClick={() => cancelRequest(r._id)}
                className="text-[9px] font-black uppercase tracking-widest text-rose-500/40 hover:text-rose-500 transition-colors"
              >
                Cancel
              </button>
            ) : r.status === "rejected" ? (
              <button
                onClick={() => deleteRejected(r._id)}
                className="text-[9px] font-black uppercase tracking-widest text-foreground/20 hover:text-rose-500 transition-colors"
              >
                Remove
              </button>
            ) : r.meetingLink && (
              <span className="text-[9px] font-bold text-foreground/40 uppercase tracking-wider bg-foreground/5 px-2 py-1 rounded-full border border-border/20">
                Join link ready soon
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}