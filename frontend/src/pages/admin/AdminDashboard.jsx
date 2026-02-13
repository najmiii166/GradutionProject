// frontend/src/pages/admin/AdminDashboard.jsx
import { useEffect, useState } from "react";
import { api } from "../../api/axios";
import Toast from "../../components/Toast";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

import Sidebar from "../../components/admin/Sidebar";
import AdminHeader from "../../components/admin/AdminHeader";
import OverviewPage from "./OverviewPage";
import PendingPage from "./PendingPage";
import UsersManagementPage from "./UsersManagementPage";
import ReportsAdminPage from "./ReportsAdminPage";
import DetailsModal from "../../components/admin/DetailsModal";
import AdminTickets from "./AdminTickets";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState("overview");
  const [activeRole, setActiveRole] = useState("student");
  const [pending, setPending] = useState([]);
  const [pendingCounts, setPendingCounts] = useState({ students: 0, mentors: 0 });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const [selectedUser, setSelectedUser] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [usersView, setUsersView] = useState("verified");
  const [reasonModalUser, setReasonModalUser] = useState(null);
  const [reasonText, setReasonText] = useState("");

  const [stats, setStats] = useState({
    totalStudents: 0,
    totalMentors: 0,
    totalPending: 0,
  });

  const [analytics, setAnalytics] = useState({
    mentorDepartments: [],
    mentorUniversities: [],
    studentMajors: [],
    studentUniversities: [],
    interestAreas: [],
  });

  // --- Logic & Fetching ---

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "admin") navigate("/login");
    fetchStats();
    fetchAnalytics();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await api.get("/admin/stats");
      setStats(data);
      setPendingCounts({
        students: data.pendingStudents || 0,
        mentors: data.pendingMentors || 0,
      });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const { data } = await api.get("/admin/analytics");
      setAnalytics(data);
    } catch (err) {
      console.error("Analytics fetch error:", err);
    }
  };

  const fetchUsersByStatus = async (status) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/users`, { params: { status } });
      setUsersList(data.users);
    } finally {
      setLoading(false);
    }
  };

  const fetchPending = async (role) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/pending`, { params: { role } });
      setPending(data.users || data);
      if (role === "student")
        setPendingCounts((prev) => ({ ...prev, students: data.users.length }));
      else
        setPendingCounts((prev) => ({ ...prev, mentors: data.users.length }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activePage === "users") fetchUsersByStatus(usersView);
  }, [activePage, usersView]);

  useEffect(() => {
    if (activePage === "pending") fetchPending(activeRole);
  }, [activePage, activeRole]);

  const openDetails = async (user) => {
    setSelectedUser(user);
    setDetail(null);
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/admin/users/${user._id}`);
      setDetail(data);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetails = () => {
    setSelectedUser(null);
    setDetail(null);
  };

  const handleApprove = async (userId) => {
    try {
      await api.post(`/admin/users/${userId}/approve`);
      setToast("User approved ✅");
      setPending((prev) => prev.filter((u) => u._id !== userId));
      closeDetails();
      fetchStats();
    } catch {
      setToast("Failed to approve user.");
    }
  };

  const handleReject = async (userId) => {
    try {
      await api.post(`/admin/users/${userId}/reject`);
      setToast("User rejected ❌");
      setPending((prev) => prev.filter((u) => u._id !== userId));
      closeDetails();
      fetchStats();
    } catch {
      setToast("Failed to reject user.");
    }
  };

  const handleUnverify = async (userId, reason) => {
    try {
      await api.post(`/admin/users/${userId}/unverify`, { reason });
      setToast("User moved to unverified");
      setUsersList((prev) => prev.filter((u) => u._id !== userId));
      closeDetails();
      setReasonModalUser(null);
      setReasonText("");
      fetchStats();
    } catch {
      setToast("Failed to unverify user.");
    }
  };

  const handleVerify = async (userId) => {
    try {
      await api.post(`/admin/users/${userId}/approve`);
      setToast("User verified ✅");
      setUsersList((prev) => prev.filter((u) => u._id !== userId));
      fetchStats();
    } catch {
      setToast("Failed to verify user.");
    }
  };

  const modalUser = detail?.user || selectedUser;
  const modalProfile = detail?.profile || null;

  return (
    <div className="h-screen bg-background text-foreground flex overflow-hidden">
      
      {/* 1. NAVIGATION SIDEBAR */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        navigate={navigate}
        pendingCounts={pendingCounts}
      />

      {/* 2. MAIN VIEW AREA */}
      <main className="flex-1 flex flex-col min-w-0 bg-background relative overflow-hidden">
        <AdminHeader activePage={activePage} />

        {/* PAGE CONTENT WITH ANIMATION */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activePage}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              {activePage === "overview" && (
                <OverviewPage stats={stats} analytics={analytics} />
              )}
              {activePage === "pending" && (
                <PendingPage {...{
                  pending, loading, activeRole, setActiveRole, openDetails,
                  selectedUser, detailLoading, modalUser, modalProfile,
                  handleApprove, handleReject, closeDetails, toast, setToast, pendingCounts,
                }} />
              )}
              {activePage === 'reports' && (
                <ReportsAdminPage api={api} />
              )}
              {activePage === 'users' && (
                <UsersManagementPage
                  users={usersList}
                  loading={loading}
                  view={usersView}
                  setView={setUsersView}
                  handleUnverify={(user) => {
                    setReasonModalUser(user);
                    setReasonText("");
                  }}
                  handleVerify={handleVerify}
                />

                
              )}

              {/* 2. ADD THIS SECTION FOR TICKETS */}
              {activePage === 'tickets' && (
                <AdminTickets /> )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* 3. GLOBAL MODALS & OVERLAYS */}
      <AnimatePresence>
        {selectedUser && (
          <DetailsModal
            {...{
              modalUser, modalProfile, detailLoading,
                closeDetails, handleApprove, handleReject,
            }}
          />
        )}
      </AnimatePresence>

      <Toast
        message={toast}
        onClose={() => setToast(null)}
        type={toast?.toLowerCase().includes("approved") || toast?.toLowerCase().includes("verified") ? "success" : "error"}
      />

      {/* Reason Modal for Unverify */}
      {reasonModalUser && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => { setReasonModalUser(null); setReasonText(""); }} />
          <div className="relative w-full max-w-lg bg-background border border-border/70 rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-semibold">Add a reason to unverify</h3>
            <p className="text-sm text-foreground/60">This reason will be included in the email to the user.</p>
            {reasonModalUser?.email && (
              <p className="text-xs font-mono text-foreground/50">{reasonModalUser.email}</p>
            )}
            <textarea
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              className="w-full h-28 rounded-xl border border-border/80 bg-background px-3 py-2 text-sm focus:outline-none focus:border-cyan-500/60 focus:ring-2 focus:ring-cyan-500/10"
              placeholder="Provide a clear, concise reason..."
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setReasonModalUser(null); setReasonText(""); }}
                className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-foreground/5"
              >
                Cancel
              </button>
              <button
                disabled={!reasonText.trim()}
                onClick={() => handleUnverify(reasonModalUser._id, reasonText.trim())}
                className="px-4 py-2 rounded-lg text-sm text-white bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm & Notify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}