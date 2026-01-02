// src/pages/MentorDashboard.jsx
import { useEffect, useState } from "react";
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
        <Brand className="text-white" />

        {/* Avatar */}
        <button
          onClick={() => setMentorModalOpen(true)}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center font-semibold text-white shadow-md">
            {getInitials(fullName)}
          </div>
        </button>
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
