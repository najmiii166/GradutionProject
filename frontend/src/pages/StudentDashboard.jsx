// src/pages/StudentDashboard.jsx
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { api, setAuthToken } from "../api/axios";
import Toast from "../components/Toast";

import MentorModal from "../components/MentorModal";
import MentorCard from "../components/MentorCard";
import EditProfileModal from "../components/EditProfileModal";

import { motion } from "framer-motion";

// Icons
import {
  Users,
  Clock,
  Mail,
  XCircle,
  LayoutGrid,
  MessageCircle,
  Settings,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";

import Brand from "../components/Brand";

function getInitials(name = "") {
  const parts = name.trim().split(" ");
  return (parts[0]?.[0] || "") + (parts[1]?.[0] || "");
}

export default function StudentDashboard() {
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const status = localStorage.getItem("status");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!token) return <Navigate to="/login" />;
  if (role !== "student") return <Navigate to="/" />;

  if (status !== "verified") {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-950 text-white">
        <div className="max-w-lg rounded-2xl bg-slate-900/70 p-6 shadow-xl ring-1 ring-sky-500/40 backdrop-blur">
          <h2 className="text-lg font-semibold mb-2">Account Pending</h2>
          <p className="text-sm text-slate-300">
            Your student account is still waiting for admin approval.
          </p>
        </div>
      </div>
    );
  }

  setAuthToken(token);

  // ---------------- STATE ---------------- //
  const [mentors, setMentors] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const [toast, setToast] = useState(null);

  const [selectedMentor, setSelectedMentor] = useState(null);
  const [showProfile, setShowProfile] = useState(false);

  const [activeFilter, setActiveFilter] = useState("pending");

  // Sidebar active tab
  const [activeTab, setActiveTab] = useState("home");

  // Settings modal
  const [settingsOpen, setSettingsOpen] = useState(false);

  const activeCount = requests.filter((r) =>
    ["pending", "upcoming"].includes(r.status)
  ).length;

  // ---------------- LOAD DATA ---------------- //
  useEffect(() => {
    (async () => {
      try {
        const [matches, reqs] = await Promise.all([
          api.get("/student/matches"),
          api.get("/requests/student"),
        ]);

        setMentors(matches.data.mentors || []);
        setRequests(reqs.data || []);
      } catch (err) {
        console.error("Dashboard load error:", err);
        setToast("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleRequestSent = async () => {
    setToast("✅ Request sent successfully!");
    const { data } = await api.get("/requests/student");
    setRequests(data || []);
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

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const upcomingRequests = requests.filter((r) => r.status === "upcoming");
  const rejectedRequests = requests.filter((r) => r.status === "rejected");

  const filteredList =
    activeFilter === "pending"
      ? pendingRequests
      : activeFilter === "upcoming"
      ? upcomingRequests
      : rejectedRequests;

  // ---------------- LOGOUT ---------------- //
  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  return (
    <div className="relative min-h-screen bg-slate-950 text-white overflow-hidden">

      {/* Background Effects */}
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

          {/* CHAT */}
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

        {/* SETTINGS */}
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
      <motion.nav
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="ml-16 flex items-center justify-between px-6 py-4 border-b border-slate-800/70 bg-slate-900/40 backdrop-blur-lg shadow-lg"
      >
        <Brand className="text-white" />
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-sm text-slate-200 font-medium">
            {user.fullName}
          </span>
          <button
            onClick={() => setShowProfile(true)}
            className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center font-semibold text-white shadow-md hover:shadow-sky-400/20 transition"
          >
            {getInitials(user.fullName)}
          </button>
        </div>
      </motion.nav>

      {/* ----------------- MAIN CONTENT ----------------- */}
      <div className="ml-16 mx-auto max-w-7xl px-6 py-8 space-y-8">

        {/* KPI Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          {[ 
            {
              icon: Users,
              label: "Connected Mentors",
              value: mentors.length,
              color: "from-sky-400 to-blue-400",
            },
            {
              icon: Clock,
              label: "Upcoming Sessions",
              value: upcomingRequests.length,
              color: "from-violet-400 to-sky-400",
            },
            {
              icon: Mail,
              label: "Pending Requests",
              value: pendingRequests.length,
              color: "from-amber-400 to-yellow-500",
            },
            {
              icon: XCircle,
              label: "Rejected Requests",
              value: rejectedRequests.length,
              color: "from-rose-400 to-pink-500",
            },
          ].map((c, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.04 }}
              className="rounded-xl p-5 bg-slate-900/60 border border-slate-800 shadow-lg flex justify-between items-center"
            >
              <div>
                <p className="text-xs text-slate-400">{c.label}</p>
                <p
                  className={`text-2xl font-bold bg-gradient-to-r ${c.color} bg-clip-text text-transparent`}
                >
                  {c.value}
                </p>
              </div>
              <c.icon className="w-6 h-6 text-slate-300" />
            </motion.div>
          ))}
        </motion.div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left - Mentors */}
          <section className="col-span-2 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-200">
                Matching Mentors
              </h2>

              <button
                onClick={() => navigate("/mentors")}
                className="text-xs text-sky-400 hover:text-sky-300"
              >
                See more →
              </button>
            </div>

            {!loading && mentors.length === 0 ? (
              <p className="text-sm text-slate-400 flex-1 flex items-center justify-center">
                No mentors found matching your interests.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {mentors.slice(0, 3).map((m) => (
                  <MentorCard
                    key={m._id}
                    mentor={m}
                    onClick={() => setSelectedMentor(m)}
                  />
                ))}
              </div>
            )}
          </section>

          {/* Right - Requests */}
          <section className="col-span-1 rounded-2xl border border-slate-800 bg-slate-900/50 p-5 shadow-lg flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-slate-200">
                Your Requests
              </h2>
              <p className="text-xs text-slate-400">Active: {activeCount}/2</p>
            </div>

            <div className="flex gap-2 mb-3">
              {["pending", "upcoming", "rejected"].map((tab) => (
                <button
                  key={tab}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    activeFilter === tab
                      ? "bg-gradient-to-r from-sky-500 to-blue-500 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                  onClick={() => setActiveFilter(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {filteredList.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No {activeFilter} requests.
                </p>
              ) : (
                filteredList.map((r) => (
                  
                  <div
                    key={r._id}
                    className="rounded-lg bg-slate-950/50 border border-slate-800 p-3 shadow-sm hover:shadow-[0_0_10px_rgba(56,189,248,0.2)] transition"
                  >
                    <p className="text-sm font-medium text-slate-100">
                      {r.mentorId?.user?.fullName || "Mentor"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {r.slot?.day} • {r.slot?.from}–{r.slot?.to}
                    </p>

                    <p
                      className={`text-xs mt-1 ${
                        r.status === "rejected"
                          ? "text-rose-400"
                          : r.status === "upcoming"
                          ? "text-emerald-400"
                          : "text-sky-400"
                      }`}
                    >
                      {r.status}
                    </p>
                   {r.status === "upcoming" && (
  <button
    onClick={async () => {
      const studentId = user._id || user.id;
      const mentorId = r.mentorId?._id;

      const { data } = await api.post("/chat/open", {
        mentorId,
        studentId
      });

      navigate(`/chat/${data._id}`);
    }}
    className="mt-2 flex items-center gap-1 text-[12px] text-emerald-400 hover:text-emerald-200 transition"
  >
    <MessageCircle className="w-4 h-4" /> Chat
  </button>
)}



                    <div className="mt-2 flex gap-2">
                      {r.status === "pending" && (
                        <button
                          onClick={() => cancelRequest(r._id)}
                          className="text-[11px] text-rose-400 hover:text-rose-300 transition"
                        >
                          Cancel
                        </button>
                      )}
                      {r.status === "rejected" && (
                        <button
                          onClick={() => deleteRejected(r._id)}
                          className="text-[11px] text-slate-400 hover:text-slate-300 transition"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

        </div>
      </div>

      {/* ----------------- MODALS ----------------- */}
      {selectedMentor && (
        <MentorModal
          mentor={selectedMentor}
          onClose={() => setSelectedMentor(null)}
          onRequestSent={handleRequestSent}
          disabled={activeCount >= 2}
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

      {/* ---------------- SETTINGS MODAL ---------------- */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 w-full max-w-xs shadow-xl">

            <h2 className="text-lg font-semibold mb-4">Settings</h2>

            {/* Theme toggle */}
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
