// src/pages/MentorDashboard.jsx
import { useEffect, useState, useRef } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { api, setAuthToken } from "../api/axios";
import Toast from "../components/Toast";

// Mentor Components
import MentorKPICard from "../components/mentor/MentorKPICard";
import MentorUpcoming from "../components/mentor/MentorUpcoming";
import MentorRequests from "../components/mentor/MentorRequests";
import MentorAvailability from "../components/mentor/MentorAvailability";

import MentorProfileModal from "../components/mentor/MentorProfileModal";
import StudentProfileModal from "../components/mentor/StudentProfileModal";
import AvailabilityModal from "../components/mentor/AvailabilityModal";

import Brand from "../components/Brand";

// Icons
import {
  Users,
  Calendar,
  Clock,
  Star,
  Settings,
  LogOut,
  Sun,
  Moon,
  LayoutGrid,
  MessageCircle,
  Bell,
  LifeBuoy,
} from "lucide-react";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function getInitials(name = "") {
  const p = name.trim().split(" ");
  return (p[0]?.[0] || "") + (p[1]?.[0] || "");
}

export default function MentorDashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const status = localStorage.getItem("status");
  const fullName = localStorage.getItem("fullName") || "Mentor";

  if (!token) return <Navigate to="/login" />;
  if (role !== "mentor") return <Navigate to="/" />;

  if (status !== "verified") {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="max-w-lg rounded-2xl bg-slate-900/70 p-6 shadow-xl ring-1 ring-sky-500/40 backdrop-blur">
          <h2 className="text-lg font-semibold mb-2">Account Pending</h2>
          <p className="text-sm text-slate-300">
            Your mentor account is still waiting for admin approval.
          </p>
        </div>
      </div>
    );
  }

  setAuthToken(token);

  // STATE
  const [toast, setToast] = useState(null);

  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [studentProfile, setStudentProfile] = useState(null);
  const [loadingStudentProfile, setLoadingStudentProfile] = useState(false);

  const [mentorModalOpen, setMentorModalOpen] = useState(false);

  const [availabilityModalOpen, setAvailabilityModalOpen] = useState(false);
  const [editingAvailability, setEditingAvailability] = useState([]);
  const [savingAvailability, setSavingAvailability] = useState(false);

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const notifBtnRef = useRef(null);
  const notifRef = useRef(null);

  // close notifications on outside click or Escape
  useEffect(() => {
    if (!showNotifications) return;

    const handleClickOutside = (e) => {
      if (
        notifRef.current &&
        !notifRef.current.contains(e.target) &&
        notifBtnRef.current &&
        !notifBtnRef.current.contains(e.target)
      ) {
        setShowNotifications(false);
      }
    };

    const handleKey = (e) => {
      if (e.key === "Escape") setShowNotifications(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [showNotifications]);

  // Listen for socket notifications forwarded via DOM event
  useEffect(() => {
    const handler = (e) => {
      try {
        const payload = e.detail;
        setNotifications((prev) => [payload, ...prev]);
      } catch (err) {
        console.error("socket notification handler error:", err);
      }
    };
    window.addEventListener("socket:notification", handler);
    return () => window.removeEventListener("socket:notification", handler);
  }, []);

  const [activeTab, setActiveTab] = useState("home");

  // Theme + Settings
  const [settingsOpen, setSettingsOpen] = useState(false);

  // ---------------- LOAD PROFILE ---------------- //
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data } = await api.get("/auth/me");
        if (!mounted) return;

        setProfile(data.profile || null);
        if (data.fullName) localStorage.setItem("fullName", data.fullName);

        if (data.profile?.availability) {
          setEditingAvailability(data.profile.availability);
        }
      } catch {
        setToast("Failed to load profile.");
      } finally {
        if (mounted) setLoadingProfile(false);
      }
    })();

    return () => (mounted = false);
  }, []);

  // ---------------- STATS ---------------- //
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data } = await api.get("/mentor/stats");
        if (mounted) setStats(data || null);
      } catch {
        setToast("Failed to load stats.");
      } finally {
        if (mounted) setLoadingStats(false);
      }
    })();

    return () => (mounted = false);
  }, []);

  // ---------------- UPCOMING SESSIONS ---------------- //
  const fetchUpcomingSessions = async () => {
    setLoadingSessions(true);
    try {
      const { data } = await api.get("/requests/mentor/upcoming");
      setUpcomingSessions(data || []);
    } catch {
      setToast("Failed to load sessions.");
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchUpcomingSessions();
  }, []);

  // ---------------- REQUESTS ---------------- //
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get("/requests/mentor");
        if (mounted) setRequests(data || []);
      } catch {
        setToast("Failed to load mentorship requests.");
      } finally {
        setLoadingRequests(false);
      }
    })();
    return () => (mounted = false);
  }, []);

  // ---------------- OPEN STUDENT PROFILE ---------------- //
  const openStudentProfile = async (studentId) => {
    setStudentModalOpen(true);
    setStudentProfile(null);
    setLoadingStudentProfile(true);

    try {
      const { data } = await api.get(`/mentor/students/${studentId}`);
      setStudentProfile(data || null);
    } catch {
      setToast("Failed to load student profile.");
    } finally {
      setLoadingStudentProfile(false);
    }
  };

  // ---------------- ACCEPT/REJECT REQUEST ---------------- //
  const handleRequestAction = async (reqId, action) => {
    try {
      await api.patch(`/requests/mentor/${reqId}`, { action });

      setRequests((prev) => prev.filter((r) => r._id !== reqId));
      // remove any matching notification for this request
      setNotifications((prev) => prev.filter((n) => !(n.request && String(n.request._id) === String(reqId))));

      if (action === "accept") {
        setToast("Request accepted ✓");
        fetchUpcomingSessions();
      } else setToast("Request rejected ✕");
    } catch {
      setToast("Action failed.");
    }
  };

  // ---------------- SAVE AVAILABILITY ---------------- //
  const saveAvailability = async () => {
    setSavingAvailability(true);
    try {
      const sorted = [...editingAvailability].sort(
        (a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day)
      );

      const { data } = await api.put("/mentor/availability", {
        availability: sorted,
      });

      setProfile((prev) => ({
        ...(prev || {}),
        availability: data?.availability || sorted,
      }));

      setAvailabilityModalOpen(false);
      setToast("Availability updated ✓");
    } catch {
      setToast("Failed to update availability.");
    } finally {
      setSavingAvailability(false);
    }
  };

  // ---------------- LOGOUT ---------------- //
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  // ---------------- COUNTS ---------------- //
  const availabilityCount = profile?.availability?.length || 0;
  const expertiseCount = profile?.expertiseAreas?.length || 0;

  return (
    <div className="relative min-h-screen bg-slate-950 text-white overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] bg-sky-500/20 blur-[180px] rounded-full animate-pulse" />
        <div className="absolute top-60 right-0 h-[400px] w-[400px] bg-blue-500/20 blur-[160px] rounded-full animate-pulse-slow" />
      </div>

      {/* ----------------- LEFT SIDEBAR ----------------- */}
      <aside className="fixed left-0 top-0 h-full w-16 bg-slate-900/60 border-r border-slate-800 backdrop-blur-lg flex flex-col justify-between py-4">
        <div className="mt-20 flex flex-col items-center gap-6">
          {/* HOME */}
          <button
            onClick={() => setActiveTab("home")}
            className="transition"
          >
            <LayoutGrid
              className={`w-6 h-6 ${
                activeTab === "home"
                  ? "text-sky-400"
                  : "text-slate-300 hover:text-sky-400"
              }`}
            />
          </button>

          {/* CHAT → navigate to /chat */}
          <button
            onClick={() => {
              setActiveTab("chat");
              navigate("/chat");
            }}
            className="transition"
          >
            <MessageCircle
              className={`w-6 h-6 ${
                activeTab === "chat"
                  ? "text-sky-400"
                  : "text-slate-300 hover:text-sky-400"
              }`}
            />
          </button>

          {/* SUPPORT */}
          <button
            onClick={() => {
              setActiveTab('support');
              navigate('/support');
            }}
            className="transition"
          >
            <LifeBuoy
              className={`w-6 h-6 ${
                activeTab === 'support' ? 'text-sky-400' : 'text-slate-300 hover:text-sky-400'
              }`}
            />
          </button>
        </div>

        {/* SETTINGS BOTTOM */}
        <div className="flex flex-col items-center pb-6">
          <button
            onClick={() => {
              setActiveTab("settings");
              setSettingsOpen(true);
            }}
            className="transition"
          >
            <Settings
              className={`w-6 h-6 ${
                activeTab === "settings"
                  ? "text-sky-400"
                  : "text-slate-300 hover:text-sky-400"
              }`}
            />
          </button>
        </div>
      </aside>

      {/* ----------------- NAVBAR ----------------- */}
      <nav className="ml-16 flex items-center justify-between px-6 py-4 border-b border-slate-800/70 bg-slate-900/40 backdrop-blur-lg shadow-lg">
        <div className="flex items-center gap-4">
          <Brand className="text-white" />
          {/* Reports button removed for mentors */}
        </div>

        <div className="flex items-center gap-4 relative">
          {/* Notifications */}
          <button
            ref={notifBtnRef}
            onClick={() => setShowNotifications((v) => !v)}
            aria-expanded={showNotifications}
            aria-controls="mentor-notifications"
            className="relative rounded-full bg-slate-800/70 p-2 border border-slate-700 hover:border-sky-500 transition"
          >
            <Bell className="w-5 h-5 text-slate-200" />
            {requests.length + notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-[1rem] px-1 rounded-full bg-rose-500 text-[10px] font-semibold text-white flex items-center justify-center">
                {requests.length + notifications.length}
              </span>
            )}
          </button>

          {/* Avatar */}
          <button
            onClick={() => setMentorModalOpen(true)}
            className="flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center font-semibold text-white shadow-md">
              {getInitials(fullName)}
            </div>
          </button>

          {showNotifications && (
            <div
              ref={notifRef}
              id="mentor-notifications"
              role="dialog"
              aria-label="Notifications"
              className="fixed right-6 top-20 w-96 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-3 space-y-3 z-50 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Notifications</h3>
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Close
                </button>
              </div>

              {notifications.length === 0 && requests.length === 0 && (
                <p className="text-sm text-slate-400">No notifications.</p>
              )}

              {notifications.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {notifications.map((n, idx) => (
                    <div key={`n-${idx}-${n.type}`} className="rounded-lg border border-slate-800 bg-slate-900/70 p-2">
                      <div className="flex items-center justify-between text-sm text-slate-200">
                        <span className="font-semibold">{n.type}</span>
                        <span className="text-xs text-slate-400">{new Date().toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">{n.request?.note || n.message?.text || JSON.stringify(n.request?.slot || n.message?.type || '')}</p>
                      <div className="mt-2 flex items-center justify-end gap-2">
                        {n.request && (
                          <>
                            <button
                              onClick={() => openStudentProfile(n.request.studentId)}
                              className="text-xs px-2 py-1 rounded-md border border-slate-700 hover:border-sky-500 text-slate-200"
                            >
                              View
                            </button>
                            <button
                              onClick={() => { handleRequestAction(n.request._id, 'accept'); setNotifications((prev) => prev.filter((x) => x !== n)); }}
                              className="text-xs px-2 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-500"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => { handleRequestAction(n.request._id, 'reject'); setNotifications((prev) => prev.filter((x) => x !== n)); }}
                              className="text-xs px-2 py-1 rounded-md bg-rose-600 text-white hover:bg-rose-500"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {n.message && (
                          <button
                            onClick={() => { navigate(`/chat/${n.conversationId}`); setNotifications((prev) => prev.filter((x) => x !== n)); }}
                            className="text-xs px-2 py-1 rounded-md border border-slate-700 hover:border-sky-500 text-slate-200"
                          >
                            Open Chat
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {requests.length > 0 && (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {requests.map((r) => (
                    <div
                      key={r._id}
                      className="rounded-lg border border-slate-800 bg-slate-900/70 p-2"
                    >
                      <div className="flex items-center justify-between text-sm text-slate-200">
                        <span className="font-semibold">{r.studentName || "Student"}</span>
                        <span className="text-xs text-slate-400">
                          {new Date(r.requestedAt || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {r.note || "New mentorship request"}
                      </p>
                      <div className="mt-2 flex items-center justify-end gap-2">
                        <button
                          onClick={() => openStudentProfile(r.studentId)}
                          className="text-xs px-2 py-1 rounded-md border border-slate-700 hover:border-sky-500 text-slate-200"
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleRequestAction(r._id, "accept")}
                          className="text-xs px-2 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-500"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleRequestAction(r._id, "reject")}
                          className="text-xs px-2 py-1 rounded-md bg-rose-600 text-white hover:bg-rose-500"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* ----------------- MAIN CONTENT ----------------- */}
      <div className="ml-16 max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* KPI CARDS */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MentorKPICard
            icon={Users}
            label="Expertise Areas"
            value={expertiseCount}
            color="from-sky-400 to-blue-500"
          />
          <MentorKPICard
            icon={Calendar}
            label="Available Days"
            value={availabilityCount}
            color="from-emerald-400 to-green-500"
          />
          <MentorKPICard
            icon={Star}
            label="Avg Rating"
            value={stats?.averageRating ? Number(stats.averageRating).toFixed(1) : "0.0"}
            color="from-amber-400 to-yellow-500"
          />
          <MentorKPICard
            icon={Clock}
            label="Total Credits"
            value={stats?.credits || 0}
            color="from-violet-400 to-indigo-500"
          />
        </div>

        {/* 3-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <MentorRequests
              loading={loadingRequests}
              requests={requests}
              onAction={handleRequestAction}
              onViewStudent={openStudentProfile}
            />
          </div>

          <div className="lg:col-span-5">
            <MentorUpcoming
              loading={loadingSessions}
              sessions={upcomingSessions}
              onRefresh={fetchUpcomingSessions}
              onViewStudent={openStudentProfile}
            />
          </div>

          <div className="lg:col-span-3">
            <MentorAvailability
              profile={profile}
              loading={loadingProfile}
              onOpen={() => setAvailabilityModalOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* ----------------- MODALS ----------------- */}
      {mentorModalOpen && (
        <MentorProfileModal
          open={mentorModalOpen}
          profile={profile}
          loading={loadingProfile}
          fullName={fullName}
          onClose={() => setMentorModalOpen(false)}
        />
      )}

      {studentModalOpen && (
        <StudentProfileModal
          open={studentModalOpen}
          profile={studentProfile}
          loading={loadingStudentProfile}
          onClose={() => setStudentModalOpen(false)}
        />
      )}

      {availabilityModalOpen && (
        <AvailabilityModal
          open={availabilityModalOpen}
          availability={editingAvailability}
          onChange={(idx, field, value) =>
            setEditingAvailability((prev) =>
              prev.map((s, i) => (i === idx ? { ...s, [field]: value } : s))
            )
          }
          onAddRow={() => {
            const used = editingAvailability.map((s) => s.day);
            const next = DAYS.find((d) => !used.includes(d));
            if (!next) return setToast("All days already added!");
            setEditingAvailability((prev) => [
              ...prev,
              { day: next, from: "09:00", to: "10:00" },
            ]);
          }}
          onRemoveRow={(idx) =>
            setEditingAvailability((prev) => prev.filter((_, i) => i !== idx))
          }
          onClose={() => setAvailabilityModalOpen(false)}
          onSave={saveAvailability}
          saving={savingAvailability}
        />
      )}

      {/* ----------------- SETTINGS MODAL ----------------- */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 w-full max-w-xs shadow-xl">
            <h2 className="text-lg font-semibold mb-4">Settings</h2>

            {/* Theme Toggle */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-300">Theme</span>
              <div className="flex items-center gap-3">
                <Sun className="w-5 h-5 text-yellow-400" />
                <Moon className="w-5 h-5 text-slate-400" />
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-500 text-sm"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>

            <button
              onClick={() => setSettingsOpen(false)}
              className="mt-3 w-full py-2 text-sm text-slate-300 hover:text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}
