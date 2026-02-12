import { useState, useContext, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { setAuthToken } from "../api/axios";
import { SocketContext } from "../Contexts/SocketContext";

import MentorSidebar from "../components/mentor/MentorSidebar";
import MentorUpcoming from "../components/mentor/MentorUpcoming";
import MentorProfileModal from "../components/mentor/MentorProfileModal";
import MentorSettingsModal from "../components/mentor/MentorSettingsModal";
import Toast from "../components/Toast";
import StudentProfileModal from "../components/mentor/StudentProfileModal";

import useMentorProfile from "../hooks/useMentorProfile";
import useMentorRequests from "../hooks/useMentorRequests";
import useMentorSessions from "../hooks/useMentorSessions";
import useMentorNotifications from "../hooks/useMentorNotifications";
import useStudentProfile from "../hooks/useStudentProfile";

export default function MentorUpcomingPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const status = localStorage.getItem("status");
  const fullName = localStorage.getItem("fullName") || "Mentor";

  if (!token) return <Navigate to="/login" />;
  if (role !== "mentor") return <Navigate to="/" />;

  setAuthToken(token);
  useContext(SocketContext);

  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [mentorModalOpen, setMentorModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { profile, loadingProfile } = useMentorProfile(setToast);
  const { requests, fetchRequests } = useMentorRequests(setToast);
  const { upcomingSessions, loadingSessions, syncingSessions, fetchUpcomingSessions } = useMentorSessions(setToast);
  const { studentModalOpen, openStudentProfile, closeStudentProfile, studentProfile, loadingStudentProfile } = useStudentProfile(setToast);
  const {
    setNotifications,
  } = useMentorNotifications();

  useEffect(() => {
    const id = setInterval(() => {
      fetchRequests(true);
      fetchUpcomingSessions(true);
    }, 30000);
    return () => clearInterval(id);
  }, [fetchRequests, fetchUpcomingSessions]);

  return (
    <div className="relative min-h-screen bg-background text-foreground transition-colors duration-300">
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
      />

      <main className="pl-24 pr-10 py-12 max-w-[1400px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
           
            <h1 className="text-2xl font-semibold text-foreground/90">All Upcoming Sessions</h1>
           
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-12">
            <MentorUpcoming
              loading={loadingSessions}
              sessions={upcomingSessions}
              onRefresh={fetchUpcomingSessions}
              onViewStudent={openStudentProfile}
              gridVariant="multi"
              showBadge
              isSyncing={syncingSessions}
            />
          </div>
        </div>
      </main>

      <StudentProfileModal
        open={studentModalOpen}
        profile={studentProfile}
        loading={loadingStudentProfile}
        onClose={closeStudentProfile}
      />

      <MentorProfileModal
        open={mentorModalOpen}
        profile={profile}
        loading={loadingProfile}
        fullName={fullName}
        onClose={() => setMentorModalOpen(false)}
      />

      <MentorSettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} onLogout={() => {
        localStorage.clear();
        window.location.href = "/login";
      }} />

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}
