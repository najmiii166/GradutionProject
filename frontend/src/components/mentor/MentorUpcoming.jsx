// src/components/mentor/MentorUpcoming.jsx
import { motion } from "framer-motion";
import { CalendarDays, Clock, User, MessageCircle } from "lucide-react";
import Spinner from "../Spinner";
import { api } from "../../api/axios";
import { useNavigate } from "react-router-dom";

export default function MentorUpcoming({
  loading,
  sessions,
  onRefresh,
  onViewStudent,
}) {
  const navigate = useNavigate();

  const openChat = async (studentId) => {
  try {
    const mentorId = localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user"))._id
      : null;

    const { data } = await api.post("/chat/open", {
      mentorId,
      studentId
    });

    navigate(`/chat/${data._id}`);
  } catch (err) {
    console.error("Chat open failed", err);
  }
};

  return (
    <div
      className="
        rounded-2xl bg-slate-900/60 border border-slate-800 p-5 
        shadow-lg backdrop-blur
        hover:shadow-[0_0_20px_rgba(56,189,248,0.20)] 
        hover:border-sky-500/30 transition
      "
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-200">
          Upcoming Sessions
        </h2>

        <button
          onClick={onRefresh}
          className="
            text-[12px] font-medium 
            text-sky-400 hover:text-sky-200 
            hover:underline transition
          "
        >
          Refresh
        </button>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <Spinner className="border-white/60" />
          <span>Loading upcoming sessions…</span>
        </div>
      ) : !sessions || sessions.length === 0 ? (
        <p className="text-sm text-slate-400">No upcoming sessions scheduled.</p>
      ) : (
        <ul className="space-y-4 text-sm">
          {sessions.map((s) => (
            <motion.li
              key={s._id}
              whileHover={{ scale: 1.01 }}
              transition={{ duration: 0.2 }}
              className="
                rounded-xl bg-slate-800/60 border border-slate-700 
                p-4 shadow-md
                hover:border-sky-500/40 hover:shadow-sky-500/10
              "
            >
              {/* Top Section */}
              <div className="flex items-center justify-between gap-3">

                {/* Student Info */}
                <div className="space-y-1">
                  <p className="font-semibold text-slate-50 flex items-center gap-2">
                    <User className="w-4 h-4 text-sky-400" />
                    {s.studentName || "Student"}
                  </p>
                  <p className="text-[12px] text-slate-400">
                    {s.studentUniversity || "—"}
                  </p>
                </div>

                {/* Date & Time */}
                <div className="text-right space-y-1">
                  <p className="text-xs text-slate-200 flex justify-end gap-1">
                    <CalendarDays className="w-3 h-3" />
                    {s.date ? new Date(s.date).toLocaleDateString() : "No date"}
                  </p>

                  <p className="text-[11px] text-slate-400 flex justify-end gap-1">
                    <Clock className="w-3 h-3" />
                    {s.dayOfWeek ? `${s.dayOfWeek}, ` : ""}
                    {s.from} – {s.to}
                  </p>
                </div>
              </div>

              {/* Status */}
              {s.status && (
                <p className="mt-3 text-[12px] text-slate-400">
                  Status:{" "}
                  <span className="font-semibold text-slate-300">
                    {s.status}
                  </span>
                </p>
              )}

              {/* Buttons */}
              <div className="flex items-center gap-4 mt-3">

                {/* View Student */}
                {s.studentId && (
                  <button
                    onClick={() => onViewStudent(s.studentId)}
                    className="
                      text-[12px] text-sky-300 
                      hover:text-sky-100 hover:underline transition
                    "
                  >
                    View profile →
                  </button>
                )}

                {/* Chat Button */}
                {s.studentId && (
                  <button
                    onClick={() => openChat(s.studentId)}
                    className="
                      flex items-center gap-1 text-[12px]
                      text-emerald-400 hover:text-emerald-200 
                      transition
                    "
                  >
                    <MessageCircle className="w-4 h-4" />
                    Chat
                  </button>
                )}

              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
