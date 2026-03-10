import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CalendarDays,
  User,
  MessageCircle,
  ExternalLink,
  Clock,
  Video,
  ChevronRight,
  X,
  History,
} from "lucide-react";
import Spinner from "../Spinner";
import { api } from "../../api/axios";
import { useNavigate } from "react-router-dom";
import useCountdown from "../../hooks/useCountdown";
import { isJoinWindowOpen, getJoinWindowState } from "../../utils/joinWindow";
import UserAvatar from "../UserAvatar";

const isValidMeetLink = (link) =>
  /^https:\/\/meet\.google\.com\/[a-z-]+$/i.test(link);

/* =========================
   SESSION ITEM
========================= */
function SessionItem({ s, onOpenMeet, onChat, onViewStudent, onRefresh, showBadge }) {
  // Use global countdown hook for the session start time
  const countdown = useCountdown(s.startTime);

  const now = new Date();
  const startTime = new Date(s.startTime);
  const endTime = new Date(s.endTime);

  const isOngoing = now >= startTime && now <= endTime;
  const isPast = now > endTime;
  // Strict join window: visible from 5 minutes before start until end
  const windowOpen =
    typeof s.canJoin === "boolean"
      ? s.canJoin
      : isJoinWindowOpen(s.startTime, s.endTime, 5);
  const joinState = getJoinWindowState(s.startTime, s.endTime, 5);
  const showJoin =
    windowOpen &&
    s.meetingLink &&
    ["upcoming", "ongoing"].includes(s.status);

  const isCritical =
    !isOngoing &&
    !isPast &&
    countdown.days === 0 &&
    countdown.hours === 0 &&
    countdown.minutes <= 5;

  const getTimerLabel = () => {
    if (isOngoing) return "Ongoing now";
    if (isPast) return "Completed";
    return countdown.text || "Starting soon";
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ scale: 1.01 }}
      className="group relative overflow-hidden rounded-xl border border-border/40 bg-foreground/2 p-5 pt-7 hover:border-cyan-500/40 hover:bg-foreground/4 transition-all duration-300"
    >
      {showBadge && (
        <div className="absolute top-0 right-0 z-10">
          {s.isFollowUp ? (
            <div className="px-3 py-1 bg-cyan-500/10 border-b border-l border-cyan-500/30 text-[9px] font-black uppercase tracking-widest text-cyan-500 rounded-bl-xl shadow-sm backdrop-blur-md">
              Follow-up
            </div>
          ) : (
            <div className="px-3 py-1 bg-foreground/5 border-b border-l border-border/40 text-[9px] font-black uppercase tracking-widest text-foreground/50 rounded-bl-xl shadow-sm backdrop-blur-md">
              New Session
            </div>
          )}
        </div>
      )}

      <div className="flex justify-between items-start mb-3">
        <div className="flex gap-3 relative z-10">
          <UserAvatar
            src={s.studentProfileImage || ""}
            name={s.studentName || "Student"}
            size={40}
          />
          <div>
            <h4 className="text-sm font-bold text-foreground/90 leading-tight">
              {s.studentName}
            </h4>
            <p className="text-[10px] uppercase tracking-wider text-foreground/40 font-medium">
              {s.studentUniversity || "Unknown Institute"}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 relative z-10 mt-6 md:mt-5 mr-1">
          {showJoin ? (
            <button
              onClick={() => {
                try {
                  const win = window.open(
                    s.meetingLink,
                    "_blank",
                    "noopener,noreferrer"
                  );
                  if (win && typeof win.focus === "function") win.focus();
                } catch {}
                try {
                  api.post(`/requests/${s._id}/join`).catch(() => {});
                } catch {}
              }}
              className="group/join flex items-center gap-1.5 text-[11px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-400 transition-colors duration-300"
            >
              <span className="group-hover/join:underline underline-offset-4">Join Session</span>
              <ExternalLink className="w-3.5 h-3.5 group-hover/join:-translate-y-0.5 group-hover/join:translate-x-0.5 transition-transform" />
            </button>
          ) : (
            // Before window: show disabled join hint; After end: hide join
            s.meetingLink && joinState === "before" && ["upcoming", "ongoing"].includes(s.status) ? (
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 bg-slate-500/10 px-3 py-1.5 rounded-full border border-slate-500/20 text-center shadow-sm">
                Available 5 min before
              </span>
            ) : null
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4 relative z-10">
        {/* UPDATED: Shows From -> To */}
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-foreground/3 border border-border/20">
          <CalendarDays size={12} className="text-cyan-500/60 shrink-0" />
          <span className="text-[10px] font-bold text-foreground/70 uppercase">
            {s.dayOfWeek}{" "}
            <span className="text-cyan-500/80">
              {s.from} - {s.to}
            </span>
          </span>
        </div>

        {/* Countdown to session start */}
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
            isOngoing
              ? "bg-emerald-500/5 border-emerald-500/20 shadow-inner"
              : "bg-foreground/3 border-border/20"
          }`}
        >
          <Clock
            size={12}
            className={isOngoing ? "text-emerald-500" : "text-cyan-500/60"}
          />
          <span
            className={`text-[10px] font-bold uppercase truncate tabular-nums ${
              isOngoing ? "text-emerald-500" : "text-foreground/70"
            }`}
          >
            {isOngoing ? "Live Now" : isPast ? "Completed" : countdown.text}
          </span>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border/30 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onChat(s.studentId)}
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-500 hover:text-emerald-400 transition-colors"
          >
            <MessageCircle size={14} /> Chat
          </button>
          <button
            onClick={() => onOpenMeet(s)}
            className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-cyan-500 hover:text-cyan-400 transition-colors"
          >
            <Video size={14} /> {s.meetingLink ? "Edit Link" : "Add Link"}
          </button>
        </div>

        <button
          onClick={() => onViewStudent(s.studentId)}
          className="group/btn flex items-center gap-1 text-[10px] uppercase tracking-widest font-bold text-foreground/30 hover:text-cyan-500 transition-all"
        >
          Profile{" "}
          <ChevronRight
            size={12}
            className="group-hover/btn:translate-x-0.5 transition-transform"
          />
        </button>
      </div>
    </motion.div>
  );
}

/* =========================
   MAIN COMPONENT
========================= */
export default function MentorUpcoming({ loading, sessions, onRefresh, onViewStudent, onSeeMore, maxVisible, gridVariant = "single", showBadge = false, isSyncing = false }) {
  const navigate = useNavigate();
  const [showMeetModal, setShowMeetModal] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [meetingLink, setMeetingLink] = useState("");
  const [saving, setSaving] = useState(false);

  const isValid = useMemo(() => isValidMeetLink(meetingLink), [meetingLink]);

  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const activeSessions = useMemo(() => {
    return sessions.filter(s => new Date(s.endTime) >= now);
  }, [sessions, now]);

  const visibleSessions = maxVisible ? activeSessions.slice(0, maxVisible) : activeSessions;
  const hasOverflow = maxVisible && activeSessions.length > maxVisible;
  const gridClass = gridVariant === "multi"
    ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4"
    : "space-y-4";

  const openChat = async (studentId) => {
    const mentorId = JSON.parse(localStorage.getItem("user"))?._id;
    const { data } = await api.post("/chat/open", { mentorId, studentId });
    navigate(`/chat/${data._id}`);
  };

  const openMeetModal = (s) => {
    setActiveSessionId(s._id);
    setMeetingLink(s.meetingLink || "");
    setShowMeetModal(true);
  };

  return (
    <>
      <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-6 shadow-xl transition-all duration-300">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500">
              <History size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-foreground/80">
                Upcoming <span className="text-cyan-500 italic font-serif lowercase tracking-normal text-base font-medium">Sessions.</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isSyncing && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">Syncing…</span>
            )}
            <button
              onClick={onRefresh}
              className="px-3 py-1 rounded-full bg-foreground/[0.03] border border-border/50 text-[10px] font-black uppercase tracking-widest text-foreground/40 hover:text-cyan-500 hover:border-cyan-500/30 transition-all"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0">
          {loading ? (
            <div className="h-40 flex flex-col items-center justify-center gap-3">
              <Spinner className="border-cyan-500" />
              <p className="text-[10px] uppercase tracking-widest text-foreground/40 font-bold">Retrieving Schedule...</p>
            </div>
          ) : activeSessions.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-40 flex items-center justify-center border border-dashed border-border/50 rounded-xl"
            >
              <p className="text-[11px] uppercase tracking-widest text-foreground/40 font-bold italic">
                No upcoming sessions
              </p>
            </motion.div>
          ) : (
            <div className={gridClass}>
              {visibleSessions.map((s) => (
                <SessionItem
                  key={s._id}
                  s={s}
                  onOpenMeet={openMeetModal}
                  onChat={openChat}
                  onViewStudent={onViewStudent}
                  onRefresh={onRefresh}
                  showBadge={showBadge}
                />
              ))}
            </div>
          )}
        </div>

        {hasOverflow && onSeeMore && !loading && (
          <div className="pt-3 mt-4 border-t border-border/20 flex justify-end">
            <button
              onClick={onSeeMore}
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-cyan-600 hover:text-cyan-500"
            >
              See more
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* GOOGLE MEET MODAL REMAINS THE SAME */}
      <AnimatePresence>
        {showMeetModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-60 bg-background/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md bg-card border border-border/50 rounded-4xl p-8 shadow-2xl relative"
            >
              <button
                onClick={() => setShowMeetModal(false)}
                className="absolute top-6 right-6 p-2 rounded-xl hover:bg-foreground/5 text-foreground/30 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-foreground/90">
                  {meetingLink ? "Update Google Meet" : "Add Session Link"}
                </h3>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-foreground/30 px-1">
                    Google Meet URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://meet.google.com/xxx-xxxx-xxx"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    className="w-full px-5 py-4 rounded-2xl bg-foreground/3 border border-border/50 text-sm text-foreground focus:outline-none focus:border-cyan-500/50 transition-all"
                  />
                  {!isValid && meetingLink && (
                    <p className="text-[10px] font-bold text-rose-500 uppercase tracking-tight px-1 flex items-center gap-1">
                      <X size={10} /> format: https://meet.google.com/xxx-xxxx-xxx
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowMeetModal(false)}
                    className="flex-1 py-3 rounded-xl bg-foreground/3 text-foreground/40 text-[10px] font-black uppercase tracking-widest hover:bg-foreground/10 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={!isValid || saving}
                    onClick={async () => {
                      try {
                        setSaving(true);
                        await api.patch(
                          `/requests/mentor/${activeSessionId}/meeting-link`,
                          { meetingLink }
                        );
                        setShowMeetModal(false);
                        onRefresh();
                      } finally {
                        setSaving(false);
                      }
                    }}
                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg transition-all ${
                      isValid && !saving
                        ? "bg-cyan-500 text-white shadow-cyan-500/20 hover:bg-cyan-600"
                        : "bg-border text-foreground/20 cursor-not-allowed"
                    }`}
                  >
                    {saving ? "Deploying..." : "Save Link"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
