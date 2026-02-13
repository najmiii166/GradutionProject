import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Clock,
  GraduationCap,
  BookOpen,
  X,
  ChevronRight,
  Activity,
  Calendar,
  Zap,
} from "lucide-react";
import Spinner from "../Spinner";
import { faculties } from "../../constants/systemData";
import { api } from "../../api/axios";

const formatTime = (time) => {
  if (!time) return "";
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 || 12;
  return `${h12}:${minutes.toString().padStart(2, "0")} ${period}`;
};

const getFacultyName = (key) => {
  if (!key) return "—";
  const faculty = faculties.find((f) => f.key === key);
  return faculty ? faculty.name : key.replace(/_/g, " ");
};

export default function MentorRequests({
  loading,
  requests,
  onAction,
  externalOpenRequest,
  onSeeMore,
  maxVisible,
  gridVariant = "single",
  isSyncing = false,
}) {
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [summaries, setSummaries] = useState({}); // { [requestId]: { loading, error, data } }
  const [summaryLang, setSummaryLang] = useState("en");
  // AI Analyze removed: no toast needed here

  useEffect(() => {
    if (externalOpenRequest) {
      setSelectedRequest(externalOpenRequest);
    }
  }, [externalOpenRequest]);

  const displayRequests = maxVisible ? requests?.slice(0, maxVisible) : requests;
  const hasOverflow = maxVisible && (requests?.length || 0) > maxVisible;
  const gridClass = gridVariant === "multi"
    ? "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3"
    : "grid grid-cols-1 gap-3";

  return (
    <>
      <div className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-5 shadow-xl transition-colors duration-300 h-full flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500">
              <Activity size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-foreground/80">
                Incoming <span className="text-cyan-500 italic font-serif lowercase tracking-normal text-base font-medium">Requests.</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
             <div className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest">
                  {requests?.length || 0} Pending
                </p>
             </div>
             {isSyncing && (
               <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">Syncing…</span>
             )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
          {loading ? (
            <div className="h-40 flex flex-col items-center justify-center gap-3">
              <Spinner className="border-cyan-500" />
              <p className="text-[10px] uppercase tracking-widest text-foreground/40 font-bold">Loading Requests...</p>
            </div>
          ) : !requests || requests.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-40 flex items-center justify-center border border-dashed border-border/50 rounded-xl"
            >
              <p className="text-[11px] uppercase tracking-widest text-foreground/40 font-bold">
                No mentorship requests at the moment.
              </p>
            </motion.div>
          ) : (
            <div className={gridClass}>
              {displayRequests.map((r, idx) => {
                const student = r.studentId || {};
                const slot = r.slot || {};

                return (
                  <motion.div
                    key={r._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group relative rounded-2xl border border-border/40 bg-foreground/[0.02] p-4 hover:border-cyan-500/40 hover:bg-foreground/[0.04] transition-all duration-300 overflow-hidden"
                  >
                    {/* Type Badge: Follow-up vs New */}
                    <div className="absolute top-0 right-0">
                      {r.isFollowUp ? (
                        <div className="bg-cyan-500 text-white text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-lg shadow-cyan-500/20">
                          Follow-up
                        </div>
                      ) : (
                        <div className="bg-foreground/80 text-background text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl shadow-lg shadow-foreground/30">
                          New Request
                        </div>
                      )}
                    </div>

                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500 border border-cyan-500/20 shadow-inner shrink-0">
                        <User size={22} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground/90 leading-tight">
                          {student.fullName || "Student"}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-[10px] uppercase tracking-wider text-foreground/40 font-bold">
                            {student.university || "—"}
                          </p>
                          <span className="w-1 h-1 rounded-full bg-cyan-500/30" />
                          <div className="flex items-center gap-1 text-[9px] font-black text-cyan-500/60 uppercase tracking-tighter">
                            <Calendar size={10} />
                            {r.requestedAt ? new Date(r.requestedAt).toLocaleDateString() : "—"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Faculty/Semester Info */}
                    <div className="mt-4 flex flex-wrap gap-3 items-center opacity-80 text-[11px] text-foreground/60">
                      <div className="flex items-center gap-1.5 font-medium">
                        <BookOpen size={13} className="text-cyan-500/50" />
                        {getFacultyName(student.faculty)}
                      </div>
                      <div className="flex items-center gap-1.5 font-medium">
                        <GraduationCap size={13} className="text-cyan-500/50" />
                        Semester {student.semester || "—"}
                      </div>
                    </div>

                    {/* Time Slot: Full Width */}
                    {slot.day && (
                      <div className="mt-3 px-3 py-2 rounded-xl bg-cyan-500/5 border border-cyan-500/10 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[11px] font-black text-foreground/70 uppercase tracking-tight">
                          <Clock size={12} className="text-cyan-500" />
                          {slot.day}
                        </div>
                        <span className="text-[10px] text-foreground/40 font-black tracking-widest uppercase">
                          {formatTime(slot.from)} – {formatTime(slot.to)}
                        </span>
                      </div>
                    )}

                    {/* Details Button: compact link style */}
                    <div className="mt-3 pt-3 border-t border-border/20 flex justify-end">
                      <button 
                        onClick={() => setSelectedRequest(r)}
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-cyan-600 hover:text-cyan-500"
                      >
                        Details
                        <ChevronRight size={14} className="transition-transform group-hover/btn:translate-x-1" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {hasOverflow && onSeeMore && (
          <div className="pt-3 mt-3 border-t border-border/20 flex justify-end">
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

      {/* ================= MODAL ================= */}
      <AnimatePresence>
        {selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-xl bg-card border border-border/50 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden"
            >
              <button
                onClick={() => setSelectedRequest(null)}
                className="absolute top-6 right-6 p-2 rounded-xl hover:bg-foreground/5 text-foreground/30 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="mb-8">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[10px] uppercase tracking-[0.3em] font-black text-cyan-500">Mentorship Questionnaire</p>
                  {selectedRequest.isFollowUp && (
                     <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[8px] font-black uppercase text-cyan-600">Follow-up Session</span>
                  )}
                </div>
                <h3 className="text-xl font-bold text-foreground/90">Reviewing {selectedRequest.studentId?.fullName}'s Intent</h3>
              </div>

              <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                <div className="flex items-center justify-between bg-cyan-500/5 border border-cyan-500/10 rounded-2xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500 text-white shadow-lg shadow-cyan-500/20">
                      <Zap size={14} />
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-black text-foreground/30 leading-none mb-1">Experience Level</p>
                      <p className="text-sm font-bold text-foreground/80">{selectedRequest.questionnaire?.experienceLevel || "Not Disclosed"}</p>
                    </div>
                  </div>
                </div>

                <Section title="Strategic Motivation">
                  {selectedRequest.questionnaire?.reason || "No motivation provided."}
                </Section>

                <Section title="Defined Goals">
                  {selectedRequest.questionnaire?.goals?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedRequest.questionnaire.goals.map((g) => (
                        <span key={g} className="px-3 py-1 rounded-lg bg-cyan-500/5 border border-cyan-500/20 text-[10px] font-bold text-cyan-500 uppercase">
                          {g.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  ) : (
                    "No specific goals targeted."
                  )}
                </Section>

                <Section title="Session Focus">
                  {selectedRequest.questionnaire?.sessionGoal || "General Guidance."}
                </Section>

                <div className="flex items-center justify-between gap-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30 px-1">AI Summary</p>
                  <div className="flex items-center gap-2">
                    <select
                      value={summaryLang}
                      onChange={(e) => setSummaryLang(e.target.value)}
                      className="text-[10px] px-2 py-1 rounded-lg bg-foreground/3 border border-border/50 text-foreground/70"
                    >
                      <option value="en">English</option>
                      <option value="so">Somali</option>
                    </select>
                    <button
                    className="px-3 py-1.5 rounded-xl bg-foreground text-background text-[10px] font-bold uppercase tracking-widest hover:bg-cyan-500 hover:text-white transition-all"
                    onClick={async () => {
                      const id = selectedRequest._id;
                      setSummaries((prev) => ({ ...prev, [id]: { ...(prev[id]||{}), loading: true, error: "" } }));
                      try {
                        if (!summaries[id]?.data) {
                          const { data } = await api.get(`/mentor/requests/${id}/ai-summary`, { params: { lang: summaryLang } });
                          setSummaries((prev) => ({ ...prev, [id]: { loading: false, error: "", data } }));
                        } else {
                          setSummaries((prev) => ({ ...prev, [id]: { ...prev[id], loading: false } }));
                        }
                      } catch (err) {
                        const status = err?.response?.status;
                        const msg = err?.response?.data?.message || "Failed to load summary.";
                        const errorText = status === 429 ? "You're asking too fast, please wait." : msg;
                        setSummaries((prev) => ({ ...prev, [id]: { loading: false, error: errorText, data: prev[id]?.data } }));
                      }
                    }}
                  >
                    {summaries[selectedRequest._id]?.loading ? "Loading..." : (summaries[selectedRequest._id]?.data ? "Refresh" : "AI Summary")}
                  </button>
                  </div>
                </div>

                {summaries[selectedRequest._id]?.error && (
                  <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest px-1">{summaries[selectedRequest._id].error}</p>
                )}

                {summaries[selectedRequest._id]?.data && (
                  <div className="space-y-2">
                    <div className="text-[13px] text-foreground/70 bg-foreground/[0.02] border border-border/40 rounded-2xl p-4 leading-relaxed">
                      {summaries[selectedRequest._id].data.summary}
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {(summaries[selectedRequest._id].data.keyPoints || []).map((kp, i) => (
                        <div key={i} className="px-3 py-2 rounded-lg bg-cyan-500/5 border border-cyan-500/10 text-[11px] text-foreground/70">
                          • {kp}
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-foreground/40 px-1">
                      <span className="font-black">Difficulty:</span>
                      <span className="font-bold text-foreground/60">{summaries[selectedRequest._id].data.difficulty}</span>
                    </div>
                    {/* Suggested Agenda removed per request */}
                  </div>
                )}
              </div>

              {/* AI Summary */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm font-medium text-slate-300">AI Summary</p>
                <button
                  onClick={async () => {
                    const id = selectedRequest._id;
                    const state = summaries[id] || { loading: false };
                    if (state.loading || state.data) return; // cached or loading
                    setSummaries((prev) => ({ ...prev, [id]: { loading: true } }));
                    try {
                      const { data } = await api.get(`/mentor/requests/${id}/ai-summary`);
                      const payload = data?.data || null;
                      setSummaries((prev) => ({ ...prev, [id]: { loading: false, data: payload, error: null } }));
                    } catch (err) {
                      const msg = err?.response?.data?.message || "Failed to load AI summary";
                      setSummaries((prev) => ({ ...prev, [id]: { loading: false, data: null, error: msg } }));
                    }
                  }}
                  className="text-xs px-3 py-1 rounded-md border border-slate-700 hover:border-sky-500 text-slate-200"
                >
                  {(summaries[selectedRequest._id]?.loading) ? "Loading…" : (summaries[selectedRequest._id]?.data ? "Loaded" : "AI Summary")}
                </button>
              </div>

              {summaries[selectedRequest._id]?.error && (
                <div className="mt-2 text-xs text-rose-400">{summaries[selectedRequest._id].error}</div>
              )}

              {summaries[selectedRequest._id]?.data && (
                <div className="mt-2 rounded-lg bg-slate-900/60 border border-slate-800 p-3">
                  <p className="text-sm text-slate-300">{summaries[selectedRequest._id].data.summary}</p>

                  {Array.isArray(summaries[selectedRequest._id].data.keyPoints) && summaries[selectedRequest._id].data.keyPoints.length > 0 && (
                    <ul className="mt-2 list-disc list-inside text-sm text-slate-300">
                      {summaries[selectedRequest._id].data.keyPoints.map((kp, i) => (
                        <li key={i}>{kp}</li>
                      ))}
                    </ul>
                  )}

                  <div className="mt-2 text-[12px] text-slate-400">Difficulty: <span className="text-slate-200">{summaries[selectedRequest._id].data.difficulty}</span></div>

                  {Array.isArray(summaries[selectedRequest._id].data.suggestedAgenda) && summaries[selectedRequest._id].data.suggestedAgenda.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-slate-200">Suggested Agenda</p>
                      <ul className="mt-1 list-disc list-inside text-sm text-slate-300">
                        {summaries[selectedRequest._id].data.suggestedAgenda.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    onAction(selectedRequest._id, "reject");
                    setSelectedRequest(null);
                  }}
                  className="flex-1 py-4 rounded-2xl bg-foreground/[0.03] text-foreground/40 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/10 hover:text-rose-500 transition-all border border-transparent hover:border-rose-500/20"
                >
                  Decline Request
                </button>

                <button
                  onClick={() => {
                    onAction(selectedRequest._id, "accept");
                    setSelectedRequest(null);
                  }}
                  className="flex-1 py-4 rounded-2xl bg-cyan-500 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-cyan-500/20 hover:bg-cyan-600 transition-all active:scale-[0.98]"
                >
                  Accept Request
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-foreground/30 px-1">{title}</p>
      <div className="text-[13px] text-foreground/70 bg-foreground/[0.02] border border-border/40 rounded-2xl p-4 leading-relaxed">
        {children}
      </div>
    </div>
  );
}