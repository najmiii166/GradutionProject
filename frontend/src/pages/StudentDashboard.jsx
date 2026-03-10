// src/pages/StudentDashboard.jsx 
import { useEffect, useState, useContext } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api, setAuthToken } from "../api/axios";
import { SocketContext } from "../Contexts/SocketContext";
import Toast from "../components/Toast";
import MentorModal from "../components/MentorModal";
import EditProfileModal from "../components/EditProfileModal";
import TimeRemaining from "../components/TimeRemaining";

import StudentNavbar from "../components/student/StudentNavbar";
import StudentSidebar from "../components/student/StudentSidebar";
import MentorsPanel from "../components/student/MentorsPanel";
import RequestsPanel from "../components/student/RequestsPanel";
import KpiCards from "../components/student/KpiCards";


import useStudentNotifications from "../hooks/useStudentNotifications";
import { formatSessionInfo } from "../utils/student";
import { ShieldCheck, Zap, ListChecks } from "lucide-react";
import Button from "../components/Button";
import Spinner from "../components/Spinner";
import { getMentorRecommendations } from "../api/recommendationsApi";

export default function StudentDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const status = localStorage.getItem("status");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!token) return <Navigate to="/login" />;
  if (role !== "student") return <Navigate to="/" />;
  
  // Refined "Pending" UI - Theme Adaptive
  if (status !== "verified") return (
    <div className="h-screen flex items-center justify-center bg-background text-foreground selection:bg-cyan-500/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.05),transparent_70%)]" />
      <div className="max-w-md w-full mx-4 rounded-3xl border border-border bg-card/50 p-8 shadow-2xl backdrop-blur-2xl relative overflow-hidden text-center">
        <div className="h-16 w-16 bg-cyan-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-cyan-500/20">
          <ShieldCheck className="text-cyan-500 animate-pulse" size={32} />
        </div>
        <h2 className="text-2xl font-light tracking-tight mb-2">Account <span className="text-cyan-500 italic font-serif">Pending.</span></h2>
        <p className="text-[10px] text-foreground/40 uppercase tracking-[0.2em] font-bold">Mentorship Protocol v2.0</p>
        <div className="mt-8 pt-6 border-t border-border/50 text-sm text-foreground/60">
          Administrator verification in progress.
        </div>
      </div>
    </div>
  );

  setAuthToken(token);

  // Trigger socket connection implicitly by accessing context
  // This ensures "Online" status is emitted even on Dashboard
  useContext(SocketContext);

  const [mentors, setMentors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState(null);
  const [selectedMentor, setSelectedMentor] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [activeFilter, setActiveFilter] = useState("pending");
  const [activeTab, setActiveTab] = useState("home");
  const [settingsOpen, setSettingsOpen] = useState(false);

  const [enrollments, setEnrollments] = useState([]);
  const [enrollLoading, setEnrollLoading] = useState(true);

  const [notifications, setNotifications] = useStudentNotifications(setRequests);
  const [recLoading, setRecLoading] = useState(false);
  const [recError, setRecError] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [preferredDays, setPreferredDays] = useState([]);
  const [showDaysModal, setShowDaysModal] = useState(false);
  const [showRecPanel, setShowRecPanel] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/student/matches");
        setMentors(data.data?.mentors || data.mentors || []);
      } catch (err) {
        console.error("Dashboard load error:", err);
        setToast("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/enrollments/student/${user._id}`);
        setEnrollments(data.enrollments || []);
      } catch (err) {
        console.error('Failed to load enrollments', err);
      } finally {
        setEnrollLoading(false);
      }
    })();
  }, []);

  const handleRequestSent = async () => {
    setToast("✅ Request sent successfully!");
    try {
      const { data } = await api.get("/requests/student");
      setRequests(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const cancelRequest = async (id) => {
    try {
      await api.delete(`/requests/${id}`);
      setRequests((prev) => prev.filter((r) => r._id !== id));
      setToast("❌ Request cancelled");
    } catch {
      setToast("Failed to cancel request.");
    }
  };

  const deleteRejected = async (id) => {
    try {
      await api.delete(`/requests/${id}`);
      setRequests((prev) => prev.filter((r) => r._id !== id));
      setToast("🗑️ Removed rejected request");
    } catch {
      setToast("Failed to remove request.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const upcomingRequests = requests.filter((r) => ["upcoming", "ongoing"].includes(r.status));
  const completedRequests = requests.filter((r) => r.status === "completed");

  // Active requests include pending, upcoming and ongoing
  const activeCount = requests.filter((r) => ["pending", "upcoming", "ongoing"].includes(r.status)).length;

  const onGetRecommendations = async (days) => {
    setRecError("");
    setRecLoading(true);
    try {
      const data = await getMentorRecommendations({
        preferredDays: Array.isArray(days) && days.length ? days : undefined,
      });
      // data: { studentId, recommended }
      setRecommendations(Array.isArray(data?.recommended) ? data.recommended : []);
      if ((data?.recommended || []).length === 0) {
        setToast("No recommendations found right now.");
      }
    } catch (err) {
      const msg = err?.message || "Failed to get recommendations";
      setRecError(msg);
      setToast(msg);
    } finally {
      setRecLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground transition-colors duration-300 overflow-x-hidden">
      {/* Dynamic Background Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] h-[600px] w-[600px] bg-cyan-500/10 blur-[150px] rounded-full animate-pulse opacity-50 dark:opacity-100" />
        <div className="absolute top-[20%] right-[-5%] h-[500px] w-[500px] bg-violet-600/5 blur-[120px] rounded-full animate-pulse-slow opacity-50 dark:opacity-100" />
      </div>

      <StudentSidebar activeTab={activeTab} setActiveTab={setActiveTab} navigate={navigate} />

      <StudentNavbar
        user={user}
        notifications={notifications}
        setNotifications={setNotifications}
        onCancelNotification={cancelRequest}
        onDeleteNotification={deleteRejected}
        setSelectedMentor={setSelectedMentor}
        setShowProfile={setShowProfile}
        setToast={setToast}
        activeTab={activeTab}
        status={status}
      />

      <div className="ml-16 mx-auto max-w-7xl px-6 py-10 space-y-10 relative z-10">

        {/* Adaptive Current Mentorship Card */}
        {!enrollLoading && enrollments.length > 0 && (
          <div className="rounded-3xl p-6 bg-card/40 border border-border shadow-2xl backdrop-blur-md relative overflow-hidden group hover:border-cyan-500/20 transition-all duration-500">
            <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity">
              <Zap size={80} className="text-cyan-500" />
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-cyan-500/70">Intelligence Link</p>
                <p className="text-2xl font-light tracking-tight">{enrollments[0].mentor?.fullName || 'Mentor'}</p>
                <div className="flex items-center gap-2 text-xs text-foreground/50">
                   <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-ping" />
                   Active Session
                </div>
              </div>
              <div className="bg-background/50 px-6 py-4 rounded-2xl border border-border/50 flex items-center shadow-inner">
                <TimeRemaining expiryDate={enrollments[0].expiryDate} />
              </div>
            </div>
          </div>
        )}

        <KpiCards 
          mentorsCount={mentors.length} 
          activeCount={activeCount}
          upcomingCount={upcomingRequests.length} 
          completedCount={completedRequests.length} 
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
              <MentorsPanel mentors={mentors} loading={loading} onSelect={(m) => setSelectedMentor(m)} />
          </div>
          <div className="lg:col-span-1">
              <RequestsPanel
                requests={requests}
                user={user}
                api={api}
                cancelRequest={cancelRequest}
                deleteRejected={deleteRejected}
                setToast={setToast}
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
                navigate={navigate}
              />
          </div>
        </div>
      </div>

      {/* Floating Recommendations Trigger */}
      <button
        type="button"
        onClick={() => setShowRecPanel(true)}
        className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-cyan-500 text-white flex items-center justify-center shadow-xl shadow-cyan-500/30 hover:bg-cyan-400 transition-colors group"
      >
        <ListChecks size={20} />
        <span className="pointer-events-none absolute -top-9 right-0 px-3 py-1 rounded-full bg-card border border-border text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/80 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Get recommendations
        </span>
      </button>

      {selectedMentor && (
        <MentorModal
          mentor={selectedMentor}
          onClose={() => setSelectedMentor(null)}
          onRequestSent={handleRequestSent}
          disabledGlobal={activeCount >= 2}
          disabledMentor={requests.some((r) => {
            const mid = r.mentorId?._id || r.mentorId;
            return String(mid) === String(selectedMentor._id) && ["pending", "upcoming", "ongoing"].includes(r.status);
          })}
        />
      )}

      {showProfile && (
        <EditProfileModal 
          user={user} 
          onClose={() => setShowProfile(false)} 
          onLogout={handleLogout} 
          onUpdated={(updated) => { 
            localStorage.setItem("user", JSON.stringify(updated)); 
            window.location.reload(); 
          }} 
        />
      )}

      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} onLogout={handleLogout} />}

      {/* Recommendations Bottom Panel */}
      {showRecPanel && (
        <div className="fixed inset-0 z-30 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowRecPanel(false)}
          />
          <div className="relative w-full max-w-5xl mx-auto px-4 pb-6">
            <div className="rounded-3xl border border-border/60 bg-card/95 backdrop-blur-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500">
                    <ListChecks size={16} />
                  </div>
                  <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-foreground/80">
                    Recommended <span className="text-cyan-500 italic font-serif lowercase tracking-normal text-base font-medium">Mentors.</span>
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowDaysModal(true)}
                    loading={recLoading}
                  >
                    Get Recommendations
                  </Button>
                  <button
                    type="button"
                    onClick={() => setShowRecPanel(false)}
                    className="ml-1 text-xs uppercase tracking-[0.2em] text-foreground/40 hover:text-foreground/80"
                  >
                    Close
                  </button>
                </div>
              </div>

              {recLoading && (
                <div className="flex items-center gap-2 text-sm text-foreground/60">
                  <Spinner />
                  <span>Fetching recommendations…</span>
                </div>
              )}
              {!recLoading && recError && (
                <div className="text-sm text-red-500">{recError}</div>
              )}
              {!recLoading && !recError && recommendations.length === 0 && (
                <div className="text-xs text-foreground/40 uppercase tracking-widest font-bold border border-dashed border-border/50 rounded-xl p-4 text-center">
                  No recommendations yet
                </div>
              )}

              {!recLoading && !recError && recommendations.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mt-2 max-h-[360px] overflow-y-auto pr-1 custom-scrollbar">
                  {recommendations.slice(0, 6).map((r, idx) => {
                    const mentorId = String(r.mentorId || "");
                    const found = mentors.find(
                      (m) => String(m?.user?._id) === mentorId || String(m?._id) === mentorId
                    );
                    const name =
                      found?.user?.fullName ||
                      found?.fullName ||
                      r?.fullName ||
                      "Mentor";
                    const universityKey =
                      found?.user?.university ||
                      found?.institution ||
                      r?.university ||
                      r?.institution ||
                      "";
                    const percent = Math.round((Number(r.score) || 0) * 100);
                    const reasons = Array.isArray(r.reasons) ? r.reasons.slice(0, 3) : [];

                    return (
                      <div
                        key={mentorId + idx}
                        className="relative flex flex-col justify-between min-h-[220px] p-4 rounded-2xl border border-border/40 bg-background/60 backdrop-blur-xl shadow-lg overflow-hidden"
                      >
                        <div className="absolute -inset-px bg-gradient-to-br from-cyan-500/5 to-violet-500/5 opacity-0 hover:opacity-100 transition-opacity duration-500" />

                        <div className="relative z-10 space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.25em] font-black text-foreground/30 mb-1">
                                Suggested Mentor
                              </p>
                              <h3 className="text-sm font-semibold text-foreground/90 truncate">{name}</h3>
                              <p className="text-[10px] text-foreground/40 uppercase tracking-wider truncate">
                                {universityKey || "University not set"}
                              </p>
                            </div>
                            <div className="px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-[10px] font-bold uppercase tracking-widest text-cyan-500">
                              {percent}% match
                            </div>
                          </div>

                          {reasons.length > 0 && (
                            <ul className="space-y-1 text-[10px] text-foreground/60">
                              {reasons.map((reason, i) => (
                                <li key={i} className="flex gap-1">
                                  <span className="mt-[3px] h-1 w-1 rounded-full bg-cyan-500/70 flex-shrink-0" />
                                  <span className="leading-snug">{reason}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        <div className="relative z-10 mt-4 pt-3 border-t border-border/40 flex items-center justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (found) {
                                setSelectedMentor(found);
                                setShowRecPanel(false);
                              }
                            }}
                          >
                            Request
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showDaysModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-2xl bg-card border border-border p-6 space-y-4">
            <h3 className="text-sm font-semibold text-foreground/90">
              Choose your preferred days
            </h3>
            <div className="flex flex-wrap gap-2">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => {
                const selected = preferredDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() =>
                      setPreferredDays((prev) =>
                        prev.includes(day)
                          ? prev.filter((d) => d !== day)
                          : [...prev, day]
                      )
                    }
                    className={`px-3 py-1 rounded-full text-xs border ${
                      selected
                        ? "bg-cyan-500 text-white border-cyan-500"
                        : "bg-background text-foreground/70 border-border"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setShowDaysModal(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  setShowDaysModal(false);
                  await onGetRecommendations(preferredDays);
                }}
                loading={recLoading}
              >
                Continue
              </Button>
            </div>
          </div>
        </div>
      )}

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}