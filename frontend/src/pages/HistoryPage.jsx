// frontend/src/pages/HistoryPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../api/axios";
import { motion } from "framer-motion";
import FeedbackModal from "../components/FeedbackModal";
import FeedbackListModal from "../components/FeedbackListModal";
import {
  History,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  User,
} from "lucide-react";

function formatDuration(start, end) {
  if (!start || !end) return "—";
  const diff = Math.max(0, new Date(end) - new Date(start));
  const mins = Math.round(diff / 60000);
  return `${mins} min`;
}

export default function HistoryPage() {
  const role = localStorage.getItem("role");
  const token = localStorage.getItem("token");

  if (!token) return <Navigate to="/login" />;

  const [data, setData] = useState({});
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [openFeedbackSession, setOpenFeedbackSession] = useState(null);
  const [openFeedbackListSession, setOpenFeedbackListSession] = useState(null);

  /* ---------------- LOAD HISTORY ---------------- */
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const url =
          role === "mentor"
            ? "/sessions/history/mentor"
            : "/sessions/history/student";

        const res = await api.get(url);
        if (mounted) setData(res.data || {});
      } catch (err) {
        console.error("Failed to load history", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => (mounted = false);
  }, [role]);

  const hasAnySessions = useMemo(
    () =>
      Object.values(data).some(
        (arr) => Array.isArray(arr) && arr.length > 0
      ),
    [data]
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Loading history…
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-40 h-[450px] w-[450px] bg-sky-500/20 blur-[180px] rounded-full" />
        <div className="absolute top-60 right-0 h-[350px] w-[350px] bg-blue-500/20 blur-[160px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* HEADER */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-8"
        >
          <History className="w-6 h-6 text-sky-400" />
          <h1 className="text-2xl font-semibold">Session History</h1>
        </motion.div>

        {/* FILTERS */}
        <div className="flex gap-2 mb-10">
          {["all", "completed", "expired"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                filter === f
                  ? "bg-gradient-to-r from-sky-500 to-blue-500 text-white shadow"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* EMPTY STATE */}
        {!hasAnySessions && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-10 text-center text-slate-400">
            No past sessions yet.
          </div>
        )}

        {/* GROUPED BY MONTH */}
        {Object.entries(data).map(([month, sessions]) => {
          const visible =
            filter === "all"
              ? sessions
              : sessions.filter((s) => s.status === filter);

          if (!visible || visible.length === 0) return null;

          return (
            <div key={month} className="mb-12">
              <h2 className="text-sm text-slate-400 mb-4">{month}</h2>

              <div className="space-y-4">
                {visible.map((s) => {
                  const completed = s.status === "completed";
                  const otherParty =
                    role === "mentor"
                      ? s.studentId?.fullName
                      : s.mentorId?.user?.fullName;

                  return (
                    <motion.div
                      key={s._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg"
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        {/* LEFT */}
                        <div className="space-y-1">
                          <p className="flex items-center gap-2 text-sm font-medium">
                            <User className="w-4 h-4 text-sky-400" />
                            {otherParty || "—"}
                          </p>

                          <p className="flex items-center gap-2 text-xs text-slate-400">
                            <Calendar className="w-4 h-4" />
                            {s.startTime
                              ? new Date(s.startTime).toLocaleString()
                              : "—"}
                          </p>

                          <p className="flex items-center gap-2 text-xs text-slate-400">
                            <Clock className="w-4 h-4" />
                            Duration: {formatDuration(s.startTime, s.endTime)}
                          </p>

                          <p className="text-xs text-slate-500">
                            Slot: {s.slot?.day} • {s.slot?.from} → {s.slot?.to}
                          </p>
                        </div>

                        {/* STATUS */}
                        <div className="flex items-center gap-2">
                          <div
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold ${
                              completed
                                ? "bg-emerald-500/15 text-emerald-400"
                                : "bg-rose-500/15 text-rose-400"
                            }`}
                          >
                            {completed ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                            {completed ? "Completed" : "Expired"}
                          </div>

                          {s.noShowStatus && s.noShowStatus !== "none" && (
                            <span className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/20">
                              {s.noShowStatus.replaceAll("_", " ")}
                            </span>
                          )}
                          {completed && (
                            <button
                              onClick={() => setOpenFeedbackSession(s)}
                              className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-300 border border-sky-500/20 hover:bg-sky-500/25 transition"
                            >
                              Leave Feedback
                            </button>
                          )}
                          {completed && (
                            <button
                              onClick={() => setOpenFeedbackListSession(s)}
                              className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-foreground/10 text-foreground/70 border border-foreground/20 hover:bg-foreground/15 transition"
                            >
                              View Feedback
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      {openFeedbackSession && (
        <FeedbackModal
          session={openFeedbackSession}
          onClose={() => setOpenFeedbackSession(null)}
          onSubmitted={() => {
            // Optional: could refetch history to reflect any ratings summary elsewhere
          }}
        />
      )}
      {openFeedbackListSession && (
        <FeedbackListModal
          session={openFeedbackListSession}
          onClose={() => setOpenFeedbackListSession(null)}
        />
      )}
    </div>
  );
}
