// src/pages/StudentDashboard.jsx 
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api, setAuthToken } from "../api/axios";
import Toast from "../components/Toast";
import MentorModal from "../components/MentorModal";
import EditProfileModal from "../components/EditProfileModal";
import TimeRemaining from "../components/TimeRemaining";

import StudentNavbar from "../components/student/StudentNavbar";
import StudentSidebar from "../components/student/StudentSidebar";
import MentorsPanel from "../components/student/MentorsPanel";
import RequestsPanel from "../components/student/RequestsPanel";
import KpiCards from "../components/student/KpiCards";
import SettingsModal from "../components/student/SettingsModal";

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
  const rejectedRequests = requests.filter((r) => r.status === "rejected");

  const activeCount = upcomingRequests.length;

  const onGetRecommendations = async () => {
    setRecError("");
    setRecLoading(true);
    try {
      const data = await getMentorRecommendations({});
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
          upcomingCount={upcomingRequests.length} 
          pendingCount={pendingRequests.length} 
          rejectedCount={rejectedRequests.length} 
        />

        {/* Recommended Mentors Section */}
        <section className="rounded-2xl border border-border/50 bg-card/40 backdrop-blur-xl p-6 shadow-xl transition-colors duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500">
                <ListChecks size={16} />
              </div>
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-foreground/80">
                Recommended <span className="text-cyan-500 italic font-serif lowercase tracking-normal text-base font-medium">Mentors.</span>
              </h2>
            </div>
            <Button variant="outline" onClick={onGetRecommendations} loading={recLoading}>
              Get Recommendations
            </Button>
          </div>

          {/* States */}
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
            <ul className="space-y-3">
              {recommendations.slice(0, 10).map((r, idx) => {
                const mentorId = String(r.mentorId || "");
                // Try to resolve mentor name from existing mentors list (when available)
                const found = mentors.find((m) => String(m?.user?._id) === mentorId || String(m?._id) === mentorId);
                const name = found?.user?.fullName || found?.fullName || mentorId;
                const percent = Math.round((Number(r.score) || 0) * 100);
                const reasons = Array.isArray(r.reasons) ? r.reasons.slice(0, 3) : [];
                return (
                  <li key={mentorId + idx} className="rounded-xl border border-border/40 bg-background/40 p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold truncate">{name}</div>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-500">
                        {percent}% match
                      </div>
                    </div>
                    <ul className="mt-2 text-xs text-foreground/60 list-disc list-inside space-y-1">
                      {reasons.map((reason, i) => (
                        <li key={i}>{reason}</li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

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

      {selectedMentor && (
        <MentorModal 
          mentor={selectedMentor} 
          onClose={() => setSelectedMentor(null)} 
          onRequestSent={handleRequestSent} 
          disabled={
            activeCount >= 2 ||
            upcomingRequests.some(
              (r) => String(r.mentorId?._id || r.mentorId) === String(selectedMentor._id)
            )
          } 
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

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}