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
  Check,
  Sparkles,
  RefreshCw,
  XCircle,
  Target,
  Flag,
  Crosshair
} from "lucide-react";
import Spinner from "../Spinner";
import { faculties } from "../../constants/systemData";
import { api } from "../../api/axios";
import UserAvatar from "../UserAvatar";

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
                      <UserAvatar
                        src={student.profileImageUrl || ""}
                        name={student.fullName || "Student"}
                        size={40}
                        className="shrink-0"
                      />
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
            className="fixed inset-0 z-50 bg-background/60 backdrop-blur-sm flex items-center justify-center p-4 pointer-events-auto"
            onMouseDown={(e) => {
              // Do not close or trigger any actions when clicking outside the modal
              if (e.target === e.currentTarget) e.preventDefault();
            }}
            onClick={(e) => {
              // Explicitly ignore backdrop clicks
              if (e.target === e.currentTarget) e.stopPropagation();
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-5xl max-h-[92vh] bg-card border border-border/50 rounded-[2.5rem] p-5 sm:p-6 lg:p-8 shadow-2xl relative overflow-hidden pointer-events-auto flex flex-col"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="absolute top-6 right-6 p-2 rounded-xl hover:bg-foreground/5 text-foreground/30 transition-colors"
              >
                <X size={20} />
              </button>

              <div className="mb-6 shrink-0 pr-10">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-[10px] uppercase tracking-[0.3em] font-black text-cyan-500">Mentorship Questionnaire</p>
                  {selectedRequest.isFollowUp && (
                     <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[8px] font-black uppercase text-cyan-600">Follow-up Session</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <UserAvatar
                    src={selectedRequest.studentId?.profileImageUrl || ""}
                    name={selectedRequest.studentId?.fullName || "Student"}
                    size={36}
                  />
                  <h3 className="text-lg font-semibold text-foreground/90"> {selectedRequest.studentId?.fullName} </h3>
                </div>
              </div>

              {(() => {
                const state = summaries[selectedRequest._id] || {};
                const isLoading = Boolean(state.loading);
                const isLoaded = Boolean(state.data);

                return (
                  <>
                    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1">
                      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] gap-6 items-start">
                        <div className="space-y-6 min-w-0 pr-2 pb-4">
                          <div className="group relative flex items-center justify-between overflow-hidden bg-gradient-to-r from-cyan-500/10 to-transparent border border-cyan-500/20 rounded-2xl p-5 shadow-sm hover:shadow-cyan-500/10 hover:-translate-y-0.5 transition-all duration-300">
                            <div className="absolute inset-0 bg-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                            <div className="relative flex items-center gap-4 z-10">
                              <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 text-white shadow-lg shadow-cyan-500/30">
                                <Zap size={16} />
                              </div>
                              <div>
                                <p className="text-[11px] uppercase tracking-[0.2em] font-black text-cyan-600/70 dark:text-cyan-400/70 leading-none mb-1.5 drop-shadow-sm">Experience Level</p>
                                <p className="text-base font-bold text-foreground/90 tracking-wide">{selectedRequest.questionnaire?.experienceLevel || "Not Disclosed"}</p>
                              </div>
                            </div>
                          </div>

                          <Section title="Motivation" icon={Target}>
                            {selectedRequest.questionnaire?.reason || "No motivation provided."}
                          </Section>

                          <Section title="Defined Goals" icon={Flag}>
                            {selectedRequest.questionnaire?.goals?.length ? (
                              <div className="flex flex-wrap gap-2.5">
                                {selectedRequest.questionnaire.goals.map((g) => (
                                  <span key={g} className="px-3 py-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-[11px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wide hover:bg-cyan-500/20 hover:border-cyan-500/30 transition-colors shadow-sm cursor-default">
                                    {g.replace(/_/g, " ")}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              "No specific goals targeted."
                            )}
                          </Section>

                          <Section title="Session Focus" icon={Crosshair}>
                            {selectedRequest.questionnaire?.sessionGoal || "General Guidance."}
                          </Section>

                          <div className="hidden xl:flex justify-end gap-3 pt-6 mt-6 border-t border-border/30 relative">
                            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />
                            <button
                              type="button"
                              onClick={() => {
                                onAction(selectedRequest._id, "reject");
                                setSelectedRequest(null);
                              }}
                              className="group relative overflow-hidden inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-foreground/[0.03] text-foreground/50 text-[11px] font-black uppercase tracking-[0.15em] hover:bg-rose-500/10 hover:text-rose-500 transition-all duration-300 border border-transparent hover:border-rose-500/30 hover:shadow-[0_0_15px_rgba(244,63,94,0.1)] active:scale-95"
                            >
                              <XCircle size={15} className="transition-transform group-hover:rotate-90" />
                              <span className="relative z-10">Decline Request</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                onAction(selectedRequest._id, "accept");
                                setSelectedRequest(null);
                              }}
                              className="group relative overflow-hidden inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[11px] font-black uppercase tracking-[0.15em] shadow-[0_5px_15px_rgba(6,182,212,0.3)] hover:shadow-[0_5px_25px_rgba(6,182,212,0.5)] transition-all duration-300 active:scale-95 hover:-translate-y-0.5 border border-transparent"
                            >
                              <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-150%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(150%)] z-0">
                                <div className="relative h-full w-8 bg-white/20 blur-md pointer-events-none" />
                              </div>
                              <Check size={15} className="relative z-10 transition-transform group-hover:scale-110" />
                              <span className="relative z-10 tracking-widest">Accept Request</span>
                            </button>
                          </div>
                        </div>

                        <aside className="space-y-4 min-w-0 xl:sticky xl:top-0 h-full max-h-max pb-4">
                          <div className="relative rounded-[2rem] border border-cyan-500/20 bg-gradient-to-br from-cyan-950/20 via-card to-cyan-900/10 p-5 sm:p-6 shadow-2xl shadow-cyan-900/10 backdrop-blur-3xl overflow-hidden group">
                            <div className="absolute -inset-24 bg-gradient-to-tr from-cyan-500/10 via-transparent to-blue-500/10 blur-3xl opacity-50 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                            <div className="relative z-10">
                              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-5">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Sparkles size={16} className="text-cyan-400 drop-shadow-md" />
                                    <p className="text-[11px] font-black uppercase tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-400">AI Summary</p>
                                  </div>
                                  <p className="text-[10px] text-foreground/40 font-medium tracking-wide pl-6 mt-[-2px]">Smart overview & priorities</p>
                                </div>
                                <button
                                  type="button"
                                  disabled={isLoading}
                                  onClick={async () => {
                                    const id = selectedRequest._id;
                                    const current = summaries[id] || { loading: false };
                                    if (current.loading) return;
                                    setSummaries((prev) => ({ ...prev, [id]: { loading: true, data: null, error: null } }));
                                    try {
                                      const { data } = await api.get(`/mentor/requests/${id}/ai-summary`);
                                      const payload = data?.data || null;
                                      setSummaries((prev) => ({ ...prev, [id]: { loading: false, data: payload, error: null } }));
                                    } catch (err) {
                                      const msg = err?.response?.data?.message || "Failed to load AI summary";
                                      setSummaries((prev) => ({ ...prev, [id]: { loading: false, data: null, error: msg } }));
                                    }
                                  }}
                                  className="self-start inline-flex items-center gap-1.5 text-[10px] px-3.5 py-1.5 rounded-xl border border-cyan-500/30 bg-card/60 backdrop-blur-md text-cyan-600 dark:text-cyan-400 font-bold uppercase tracking-widest hover:border-cyan-400 hover:text-cyan-500 hover:shadow-[0_0_10px_rgba(6,182,212,0.2)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                                >
                                  {isLoading ? <RefreshCw size={12} className="animate-spin" /> : isLoaded ? <RefreshCw size={12} className="group-hover/btn:rotate-180 transition-transform duration-500" /> : <Sparkles size={12} className="group-hover/btn:scale-110 transition-transform" />}
                                  {isLoading ? "Analyzing…" : (isLoaded ? "Refresh" : "Generate")}
                                </button>
                              </div>

                              {state.error && (
                                <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[10px] text-rose-500 font-bold uppercase tracking-widest text-center">{state.error}</div>
                              )}

                              {state.data ? (
                                <div className="mt-5 space-y-4">
                                  <div className="rounded-[1.25rem] border border-cyan-500/15 bg-card/50 backdrop-blur-md p-4 shadow-inner relative overflow-hidden">
                                    <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-cyan-400 to-blue-500 block" />
                                    <p className="text-[13px] leading-relaxed text-foreground/80 pl-2">{state.data.summary}</p>
                                  </div>

                                  {Array.isArray(state.data.keyPoints) && state.data.keyPoints.length > 0 && (
                                    <div className="space-y-2.5 mt-4">
                                      {state.data.keyPoints.map((kp, i) => (
                                        <div key={i} className="flex gap-3.5 group/kp rounded-2xl border border-border/30 bg-card/40 backdrop-blur-sm px-4 py-3.5 hover:border-cyan-500/20 hover:bg-card/60 transition-colors">
                                          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-500/15 text-[11px] font-black text-cyan-500 shadow-sm group-hover/kp:scale-110 group-hover/kp:bg-cyan-500/20 transition-all">
                                            {i + 1}
                                          </span>
                                          <p className="text-[13px] leading-relaxed text-foreground/75 group-hover/kp:text-foreground/90 transition-colors">{kp}</p>
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  <div className="mt-5 rounded-xl border border-border/30 bg-card/40 backdrop-blur-sm px-4 py-3 flex items-center justify-between shadow-sm">
                                      <span className="text-[10px] uppercase tracking-[0.2em] font-black text-foreground/45">Level </span>
                                      <span className="px-2.5 py-1 rounded-lg bg-cyan-500/10 text-[10px] uppercase font-black tracking-widest text-cyan-500 border border-cyan-500/20">{state.data.difficulty}</span>
                                  </div>
                                </div>
                              ) : (
                                <div className="mt-5 rounded-2xl border border-dashed border-cyan-500/30 bg-cyan-500/5 p-6 flex flex-col items-center justify-center text-center gap-3">
                                  <div className="p-3 rounded-full bg-cyan-500/10 text-cyan-500">
                                    <Sparkles size={18} />
                                  </div>
                                  <p className="text-[11px] text-cyan-600/70 dark:text-cyan-400/70 font-bold uppercase tracking-widest max-w-[180px]">Run intelligence to extract mentor-ready insights.</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </aside>
                      </div>

                      <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3 xl:hidden pt-4 border-t border-border/20">
                        <button
                          type="button"
                          onClick={() => {
                            onAction(selectedRequest._id, "reject");
                            setSelectedRequest(null);
                          }}
                          className="flex-1 group relative overflow-hidden inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-foreground/[0.03] text-foreground/50 text-[11px] font-black uppercase tracking-[0.15em] hover:bg-rose-500/10 hover:text-rose-500 transition-all border border-transparent hover:border-rose-500/20"
                        >
                          <XCircle size={15} className="group-hover:rotate-90 transition-transform" />
                          Decline Request
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onAction(selectedRequest._id, "accept");
                            setSelectedRequest(null);
                          }}
                          className="flex-1 group relative overflow-hidden inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-[11px] font-black uppercase tracking-[0.15em] shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all active:scale-[0.98]"
                        >
                          <div className="absolute inset-0 flex h-full w-full justify-center [transform:skew(-12deg)_translateX(-150%)] group-hover:duration-1000 group-hover:[transform:skew(-12deg)_translateX(150%)] z-0">
                                <div className="relative h-full w-8 bg-white/20 blur-md pointer-events-none" />
                          </div>
                          <Check size={15} className="relative z-10 group-hover:scale-110 transition-transform" />
                          <span className="relative z-10">Accept Request</span>
                        </button>
                      </div>
                    </div>
                  </>
                );
              })()}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <div className="space-y-2.5 relative group">
      <div className="flex items-center gap-2 px-1 mb-1">
        {Icon && <Icon size={14} className="text-cyan-500/60 drop-shadow-sm group-hover:text-cyan-500 transition-colors" />}
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-600/70 dark:text-cyan-400/70 group-hover:text-cyan-500 transition-colors drop-shadow-sm">{title}</p>
      </div>
      <div className="text-[13px] text-foreground/80 bg-gradient-to-br from-card/60 to-background/40 backdrop-blur-xl border border-border/40 shadow-sm shadow-black/5 rounded-[1.25rem] p-5 leading-relaxed transition-all duration-300 group-hover:border-cyan-500/30 group-hover:shadow-cyan-500/10 group-hover:-translate-y-0.5 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <div className="relative z-10 leading-7">{children}</div>
      </div>
    </div>
  );
}