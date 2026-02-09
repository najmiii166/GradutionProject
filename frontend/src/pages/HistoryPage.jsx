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
  Activity
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground/40 gap-4">
        <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em]">Loading history...</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-primary/30">
      {/* Strategic Background Accents */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] bg-primary/5 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto px-8 py-16">
        {/* HEADER SECTION */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-border/40 pb-10"
        >
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-semibold ">Session <span className="text-primary font-medium">History</span></h1>
          </div>
          
          {/* FILTER TABS */}
          <div className="flex bg-card border border-border/50 p-1 rounded-2xl backdrop-blur-md">
            {["all", "completed", "expired"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                  filter === f
                    ? "bg-primary text-white shadow-lg shadow-primary/20"
                    : "text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </motion.div>

        {/* EMPTY STATE */}
        {!hasAnySessions && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-[2.5rem] border border-border/30 bg-card/30 p-20 text-center backdrop-blur-sm"
          >
            <Activity className="w-12 h-12 text-foreground/10 mx-auto mb-4" />
            <p className="text-sm font-medium text-foreground/40 italic font-serif">
              "No historical data detected in current node parameters."
            </p>
          </motion.div>
        )}

        {/* GROUPED LOGS */}
        {Object.entries(data).map(([month, sessions]) => {
          const visible =
            filter === "all"
              ? sessions
              : sessions.filter((s) => s.status === filter);

          if (!visible || visible.length === 0) return null;

          return (
            <div key={month} className="mb-16">
              <div className="flex items-center gap-4 mb-6">
                <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-primary/50 whitespace-nowrap">{month}</h2>
                <div className="h-[1px] w-full bg-gradient-to-r from-primary/20 to-transparent" />
              </div>

              <div className="grid grid-cols-1 gap-4">
                {visible.map((s, idx) => {
                  const completed = s.status === "completed";
                  const otherParty =
                    role === "mentor"
                      ? s.studentId?.fullName
                      : s.mentorId?.user?.fullName;

                  return (
                    <motion.div
                      key={s._id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group relative rounded-[2rem] border border-border/40 bg-card/40 p-6 backdrop-blur-sm hover:border-primary/30 transition-all duration-500"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        
                        {/* IDENTITY & TIME */}
                        <div className="flex items-center gap-5">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border transition-colors duration-500 ${
                            completed ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500" : "bg-rose-500/5 border-rose-500/20 text-rose-500"
                          }`}>
                            <User size={24} />
                          </div>
                          <div>
                            <h3 className="text-lg font-bold tracking-tight text-foreground/90 group-hover:text-primary transition-colors">
                              {otherParty || "Unknown Identity"}
                            </h3>
                            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-1">
                              <span className="flex items-center gap-1.5 text-[11px] font-bold text-foreground/40 uppercase tracking-wider">
                                <Calendar size={12} className="text-primary/50" />
                                {s.startTime ? new Date(s.startTime).toLocaleDateString() : "—"}
                              </span>
                              <span className="flex items-center gap-1.5 text-[11px] font-bold text-foreground/40 uppercase tracking-wider">
                                <Clock size={12} className="text-primary/50" />
                                {formatDuration(s.startTime, s.endTime)}
                              </span>
                            </div>
                          </div>
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