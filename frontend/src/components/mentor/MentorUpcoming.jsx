import { motion } from "framer-motion";
import {
  CalendarDays,
  User,
  MessageCircle,
  ExternalLink,
  Pencil,
  Clock,
} from "lucide-react";
import Spinner from "../Spinner";
import { api } from "../../api/axios";
import { useNavigate } from "react-router-dom";
import { useState, useMemo, useEffect } from "react";

const isValidMeetLink = (link) =>
  /^https:\/\/meet\.google\.com\/[a-z-]+$/i.test(link);

/* =========================
   COUNTDOWN HOOK (SAFE)
========================= */
function useSessionCountdown(startTime, endTime) {
  const [state, setState] = useState({
    label: "",
    isOngoing: false,
  });

  useEffect(() => {
    if (!startTime || !endTime) return;

    const tick = () => {
      const now = new Date();
      const start = new Date(startTime);
      const end = new Date(endTime);

      if (now < start) {
        const diff = start - now;
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setState({
          label: `Starts in ${mins}m ${secs}s`,
          isOngoing: false,
        });
      } else if (now >= start && now <= end) {
        setState({
          label: "Ongoing now",
          isOngoing: true,
        });
      } else {
        setState({
          label: "Session ended",
          isOngoing: false,
        });
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime, endTime]);

  return state;
}

/* =========================
   SESSION ITEM (SAFE)
========================= */
function SessionItem({
  s,
  onOpenMeet,
  onChat,
  onViewStudent,
}) {
  const { label, isOngoing } = useSessionCountdown(
    s.startTime,
    s.endTime
  );

  const showJoin =
    isOngoing &&
    s.meetingLink &&
    ["upcoming", "ongoing"].includes(s.status);

  return (
    <motion.li
      whileHover={{ scale: 1.02 }}
      className="relative rounded-xl bg-gradient-to-br from-slate-800/70 to-slate-900 border border-slate-700 p-5 shadow-md"
    >
      {/* ===== TOP ===== */}
      <div className="flex justify-between items-start">
        <div>
          <p className="flex items-center gap-2 text-white font-semibold">
            <User className="w-4 h-4 text-sky-400" />
            {s.studentName}
          </p>
          <p className="text-xs text-slate-400">
            {s.studentUniversity || "—"}
          </p>
        </div>

        {showJoin && (
         <button
    onClick={async () => {
      try {
        // 1️⃣ Notify backend mentor joined
        await api.post(`/requests/${s._id}/join`);

        // 2️⃣ Open Google Meet
        window.open(s.meetingLink, "_blank", "noopener,noreferrer");
      } catch (err) {
        console.error("Failed to join session", err);
      }
    }}
    className="flex items-center gap-1 text-xs text-emerald-400 hover:underline"
  >
    Join Session
    <ExternalLink className="w-3 h-3" />
  </button>
        )}
      </div>

      {/* ===== TIME ===== */}
      <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
        <CalendarDays className="w-3 h-3" />
        {s.dayOfWeek} {s.from} – {s.to}
      </div>

      {/* ===== COUNTDOWN / STATUS ===== */}
      <div className="mt-2 flex items-center gap-2 text-xs">
        <Clock className="w-3 h-3 text-sky-400" />
        <span className="text-slate-300">{label}</span>
        <span
          className={`ml-auto text-[11px] font-semibold ${
            s.status === "completed"
              ? "text-emerald-400"
              : s.status === "expired"
              ? "text-rose-400"
              : "text-sky-400"
          }`}
        >
          {s.status}
        </span>
      </div>

      {/* ===== ACTIONS ===== */}
      <div className="flex flex-wrap items-center gap-3 mt-4">
        <button
          onClick={() => onOpenMeet(s)}
          className="flex items-center gap-1 text-xs px-3 py-1 rounded-md bg-sky-600 text-white hover:bg-sky-500"
        >
          <Pencil className="w-3 h-3" />
          {s.meetingLink ? "Edit link" : "Add link"}
        </button>

        <button
          onClick={() => onChat(s.studentId)}
          className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
        >
          <MessageCircle className="w-4 h-4" />
          Chat
        </button>
      </div>

      <button
        onClick={() => onViewStudent(s.studentId)}
        className="absolute bottom-3 right-4 text-[11px] text-sky-300 hover:underline"
      >
        View profile →
      </button>
    </motion.li>
  );
}

/* =========================
   MAIN COMPONENT
========================= */
export default function MentorUpcoming({
  loading,
  sessions,
  onRefresh,
  onViewStudent,
}) {
  const navigate = useNavigate();

  const [showMeetModal, setShowMeetModal] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [meetingLink, setMeetingLink] = useState("");
  const [saving, setSaving] = useState(false);

  const isValid = useMemo(
    () => isValidMeetLink(meetingLink),
    [meetingLink]
  );

  const openChat = async (studentId) => {
    const mentorId = JSON.parse(localStorage.getItem("user"))?._id;
    const { data } = await api.post("/chat/open", {
      mentorId,
      studentId,
    });
    navigate(`/chat/${data._id}`);
  };

  const openMeetModal = (s) => {
    setActiveSessionId(s._id);
    setMeetingLink(s.meetingLink || "");
    setShowMeetModal(true);
  };

  return (
    <>
      <div className="rounded-2xl bg-slate-900/70 border border-slate-800 p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">
            Upcoming Sessions ({sessions.length})
          </h2>
          <button
            onClick={onRefresh}
            className="text-xs text-sky-400 hover:underline"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Spinner />
            Loading…
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-slate-400">
            No upcoming sessions.
          </p>
        ) : (
          <ul className="space-y-4">
            {sessions.map((s) => (
              <SessionItem
                key={s._id}
                s={s}
                onOpenMeet={openMeetModal}
                onChat={openChat}
                onViewStudent={onViewStudent}
              />
            ))}
          </ul>
        )}
      </div>

      {/* ===== MODAL ===== */}
      {showMeetModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center">
          <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-sm shadow-xl">
            <h3 className="text-sm font-semibold text-white mb-3">
              {meetingLink ? "Edit Google Meet Link" : "Add Google Meet Link"}
            </h3>

            <input
              type="url"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-md bg-slate-800 border border-slate-700 text-white"
            />

            {!isValid && meetingLink && (
              <p className="text-xs text-rose-400 mt-1">
                Invalid Google Meet link
              </p>
            )}

            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setShowMeetModal(false)}
                className="text-xs text-slate-400 hover:text-white"
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
                className={`text-xs px-4 py-1 rounded-md text-white ${
                  isValid
                    ? "bg-sky-600 hover:bg-sky-500"
                    : "bg-slate-700 cursor-not-allowed"
                }`}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
