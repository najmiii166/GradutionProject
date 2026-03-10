// src/pages/MentorDashboard.jsx
import { useState, useContext, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { setAuthToken } from "../api/axios";
import { SocketContext } from "../Contexts/SocketContext";

// Components
import Toast from "../components/Toast";
import MentorKPICard from "../components/mentor/MentorKPICard";
import MentorUpcoming from "../components/mentor/MentorUpcoming";
import MentorRequests from "../components/mentor/MentorRequests";
import MentorAvailability from "../components/mentor/MentorAvailability";
import MentorSidebar from "../components/mentor/MentorSidebar";
import MentorNavbar from "../components/mentor/MentorNavbar";

// Modals
import MentorProfileModal from "../components/mentor/MentorProfileModal";
import StudentProfileModal from "../components/mentor/StudentProfileModal";
import AvailabilityModal from "../components/mentor/AvailabilityModal";
import MentorSettingsModal from "../components/mentor/MentorSettingsModal";

// Hooks
import useMentorProfile from "../hooks/useMentorProfile";
import useMentorStats from "../hooks/useMentorStats";
import useMentorRequests from "../hooks/useMentorRequests";
import useMentorSessions from "../hooks/useMentorSessions";
import useMentorNotifications from "../hooks/useMentorNotifications";
import useStudentProfile from "../hooks/useStudentProfile";

import { Users, Calendar, Clock, Star } from "lucide-react";

export default function MentorDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const status = localStorage.getItem("status");
  const fullName = localStorage.getItem("fullName") || "Mentor";
  // we'll compute profileImageUrl after hooks where `profile` is available

  if (!token) return <Navigate to="/login" />;
  if (role !== "mentor") return <Navigate to="/" />;

  // PENDING VERIFICATION UI - Styled to match component theme
  if (status !== "verified") {
    return (
      <div className="h-screen flex items-center justify-center bg-background text-foreground p-6">
        <div className="max-w-md w-full rounded-[2.5rem] bg-card border border-border/50 p-10 text-center shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-6 border border-primary/20">
            <Clock size={32} className="animate-pulse" />
          </div>
          <h2 className="text-xl font-bold tracking-tight mb-2 uppercase">Account Pending</h2>
          <p className="text-sm text-foreground/50 font-serif italic leading-relaxed">
            "Your mentor credentials are currently awaiting administrative clearance."
          </p>
        </div>
      </div>
    );
  }

  setAuthToken(token);

  // Trigger socket connection implicitly by accessing context
  // This ensures "Online" status is emitted even on Dashboard
  useContext(SocketContext);

  // --- STATE ---
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("home");
  const [mentorModalOpen, setMentorModalOpen] = useState(false);
  const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // --- HOOKS ---
  const { studentModalOpen, openStudentProfile, closeStudentProfile, studentProfile, loadingStudentProfile } = useStudentProfile(setToast);
  const { profile, loadingProfile, editingAvailability, setEditingAvailability, saveAvailability, savingAvailability } = useMentorProfile(setToast);
  // now that we have profile state, derive the navbar image (fallback to stored user)
  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");
  const profileImageUrl =
    (profile && profile.profileImageUrl) ||
    storedUser.profileImageUrl ||
    "";
  const { stats } = useMentorStats(setToast);
  const { requests, loadingRequests, syncingRequests, fetchRequests, handleRequestAction } = useMentorRequests(setToast);
  const { upcomingSessions, loadingSessions, syncingSessions, fetchUpcomingSessions } = useMentorSessions(setToast);
  const {
    showNotifications,
    setShowNotifications,
    notifications,
    setNotifications,
    notifBtnRef,
    notifRef,
    externalOpenRequest,
    setExternalOpenRequest,
  } = useMentorNotifications();

  // --- HANDLERS ---
  const onRequestAction = (reqId, action) =>
    handleRequestAction(reqId, action, { setNotifications, fetchUpcomingSessions });

  const handleSaveAvailability = async () => {
    const res = await saveAvailability();
    if (res && res.success) {
      setAvailabilityModalOpen(false);
      setToast("Availability updated successfully.");
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const availabilityCount = profile?.availability?.length || 0;
  const expertiseCount = profile?.expertiseAreas?.length || 0;

  useEffect(() => {
    const id = setInterval(() => {
      fetchRequests(true);
      fetchUpcomingSessions(true);
    }, 30000);
    return () => clearInterval(id);
  }, [fetchRequests, fetchUpcomingSessions]);

  return (
    <div className="relative min-h-screen bg-background text-foreground transition-colors duration-300">
      
      {/* Dynamic Themed Background Accents (Subtle Glows) */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] h-[40%] w-[40%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] bg-primary/5 blur-[120px] rounded-full" />
      </div>

      <MentorSidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        navigate={navigate} 
        setSettingsOpen={setSettingsOpen} 
        requestsCount={requests.length}
        upcomingCount={upcomingSessions.length}
        onGoRequests={() => navigate("/mentor/requests")}
        onGoUpcoming={() => navigate("/mentor/upcoming")}
      />

      <MentorNavbar
        requests={requests}
        notifications={notifications}
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
        notifBtnRef={notifBtnRef}
        notifRef={notifRef}
        setExternalOpenRequest={setExternalOpenRequest}
        navigate={navigate}
        setNotifications={setNotifications}
        setMentorModalOpen={setMentorModalOpen}
        fullName={fullName}
        profileImageUrl={profileImageUrl}
        activeTab={activeTab}
        status={status}
      />

      {/* --- MAIN DASHBOARD SURFACE --- */}
      <main className="pl-24 pr-10 py-10 max-w-[1640px] mx-auto space-y-10">
        
        {/* TOP LEVEL METRICS (KPIs) */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MentorKPICard
            icon={Users}
            label="Pending Requests"
            value={requests.length}
            hint="Students currently waiting for a response"
            bg="bg-kpi-1"
            textColor="text-cyan-800 dark:text-cyan-400"
            glow="bg-cyan-500/20"
          />
          <MentorKPICard
            icon={Calendar}
            label="Upcoming Sessions"
            value={upcomingSessions.length}
            hint="Scheduled sessions on your queue"
            bg="bg-kpi-2"
            textColor="text-violet-800 dark:text-violet-400"
            glow="bg-violet-500/20"
          />
          <MentorKPICard
            icon={Star}
            label="Avg Rating"
            value={stats?.averageRating ? Number(stats.averageRating).toFixed(1) : "0.0"}
            hint={`${stats?.totalRatings || 0} student reviews received`}
            bg="bg-kpi-3"
            textColor="text-amber-800 dark:text-amber-400"
            glow="bg-amber-500/20"
          />
          <MentorKPICard
            icon={Clock}
            label="Completed Sessions"
            value={stats?.credits || 0}
            hint="Mentorship sessions successfully finished"
            bg="bg-kpi-4"
            textColor="text-rose-800 dark:text-rose-400"
            glow="bg-rose-500/20"
          />
        </div>

        {/* STRATEGIC DATA GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Requests Segment */}
          <div className="lg:col-span-4">
            <MentorRequests
              loading={loadingRequests}
              requests={requests}
              onAction={onRequestAction}
              onViewStudent={openStudentProfile}
              externalOpenRequest={externalOpenRequest}
              maxVisible={1}
              onSeeMore={() => navigate("/mentor/requests")}
              isSyncing={syncingRequests}
            />
          </div>

          {/* Upcoming Sessions Segment */}
          <div className="lg:col-span-5">
            <MentorUpcoming
              loading={loadingSessions}
              sessions={upcomingSessions}
              onRefresh={fetchUpcomingSessions}
              onViewStudent={openStudentProfile}
              maxVisible={1}
              onSeeMore={() => navigate("/mentor/upcoming")}
              isSyncing={syncingSessions}
              showBadge
            />
          </div>

          {/* Availability Segment */}
          <div className="lg:col-span-3">
            <MentorAvailability
              profile={profile}
              loading={loadingProfile}
              onOpen={() => setAvailabilityModalOpen(true)}
            />
          </div>
        </div>
      </main>

      {/* --- MODALS & OVERLAYS --- */}
      <MentorProfileModal
        open={mentorModalOpen}
        profile={profile}
        loading={loadingProfile}
        fullName={fullName}
        onClose={() => setMentorModalOpen(false)}
      />

      <StudentProfileModal
        open={studentModalOpen}
        profile={studentProfile}
        loading={loadingStudentProfile}
        onClose={closeStudentProfile}
      />

      <AvailabilityModal
        open={availabilityModalOpen}
        availability={editingAvailability}
        onAddSlot={(slot) =>
          setEditingAvailability((prev) => [
            ...prev,
            slot,
          ])
        }
        onRemoveSlot={(idx) =>
          setEditingAvailability((prev) => prev.filter((_, i) => i !== idx))
        }
        onClose={() => setAvailabilityModalOpen(false)}
        onSave={handleSaveAvailability}
        saving={savingAvailability}
      />

      <MentorSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} onLogout={handleLogout} />

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}