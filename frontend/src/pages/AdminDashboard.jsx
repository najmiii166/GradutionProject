// // frontend/src/pages/AdminDashboard.jsx
// import { useEffect, useState } from "react";
// import { api } from "../api/axios";
// import Toast from "../components/Toast";
// import { useNavigate } from "react-router-dom";

// import Sidebar from "../components/admin/Sidebar";
// import AdminHeader from "../components/admin/AdminHeader";
// import OverviewPage from "./admin/OverviewPage";
// import PendingPage from "./admin/PendingPage";
// import UsersManagementPage from "./admin/UsersManagementPage";
// import ReportsAdminPage from "./admin/ReportsAdminPage";
// import DetailsModal from "../components/admin/DetailsModal";

// export default function AdminDashboard() {
//   const navigate = useNavigate();
//   const [activePage, setActivePage] = useState("overview");
//   const [activeRole, setActiveRole] = useState("student");
//   const [pending, setPending] = useState([]);
//   const [pendingCounts, setPendingCounts] = useState({ students: 0, mentors: 0 });
//   const [loading, setLoading] = useState(false);
//   const [toast, setToast] = useState(null);

//   const [selectedUser, setSelectedUser] = useState(null);
//   const [detail, setDetail] = useState(null);
//   const [detailLoading, setDetailLoading] = useState(false);
//   const [usersList, setUsersList] = useState([]);
//   const [usersView, setUsersView] = useState("verified");

//   const fetchUsersByStatus = async (status) => {
//     setLoading(true);
//     try {
//       const { data } = await api.get(`/admin/users`, { params: { status } });
//       setUsersList(data.users);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (activePage === "users") fetchUsersByStatus(usersView);
//   }, [activePage, usersView]);

//   const [stats, setStats] = useState({
//     totalStudents: 0,
//     totalMentors: 0,
//     totalPending: 0,
//   });

//   const [analytics, setAnalytics] = useState({
//     mentorDepartments: [],
//     mentorUniversities: [],
//     studentMajors: [],
//     studentUniversities: [],
//     interestAreas: [],
//   });

//   useEffect(() => {
//     const role = localStorage.getItem("role");
//     if (role !== "admin") window.location.href = "/login";
//     fetchStats();
//     fetchAnalytics();
//   }, []);

//   const fetchStats = async () => {
//     try {
//       const { data } = await api.get("/admin/stats");
//       setStats(data);
//       setPendingCounts({
//         students: data.pendingStudents || 0,
//         mentors: data.pendingMentors || 0,
//       });
//     } catch (err) {
//       console.error("Failed to fetch stats:", err);
//     }
//   };

//   const fetchAnalytics = async () => {
//     try {
//       const { data } = await api.get("/admin/analytics");
//       setAnalytics(data);
//     } catch (err) {
//       console.error("Analytics fetch error:", err);
//     }
//   };

//   const fetchPending = async (role) => {
//     setLoading(true);
//     try {
//       const { data } = await api.get(`/admin/pending`, { params: { role } });
//       setPending(data.users || data);
//       if (role === "student")
//         setPendingCounts((prev) => ({ ...prev, students: data.users.length }));
//       else
//         setPendingCounts((prev) => ({ ...prev, mentors: data.users.length }));
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (activePage === "pending") fetchPending(activeRole);
//   }, [activePage, activeRole]);

//   const openDetails = async (user) => {
//     setSelectedUser(user);
//     setDetail(null);
//     setDetailLoading(true);
//     try {
//       const { data } = await api.get(`/admin/users/${user._id}`);
//       setDetail(data);
//     } finally {
//       setDetailLoading(false);
//     }
//   };

//   const closeDetails = () => {
//     setSelectedUser(null);
//     setDetail(null);
//   };

//   const handleApprove = async (userId) => {
//     try {
//       await api.post(`/admin/users/${userId}/approve`);
//       setToast("User approved ✅");
//       setPending((prev) => prev.filter((u) => u._id !== userId));
//       closeDetails();
//       fetchStats();
//       fetchAnalytics();
//     } catch {
//       setToast("Failed to approve user.");
//     }
//   };

//   const handleReject = async (userId) => {
//     try {
//       await api.post(`/admin/users/${userId}/reject`);
//       setToast("User rejected ❌");
//       setPending((prev) => prev.filter((u) => u._id !== userId));
//       closeDetails();
//       fetchStats();
//       fetchAnalytics();
//     } catch {
//       setToast("Failed to reject user.");
//     }
//   };

//   const modalUser = detail?.user || selectedUser;
//   const modalProfile = detail?.profile || null;

//   return (
//     <div className="h-screen bg-slate-950 text-white flex overflow-hidden">

//       <Sidebar
//         activePage={activePage}
//         setActivePage={setActivePage}
//         navigate={navigate}
//         pendingCounts={pendingCounts}
//       />

//       <main className="flex-1 flex flex-col">
//         <AdminHeader activePage={activePage} />

//         {activePage === "overview" ? (
//           <OverviewPage stats={stats} analytics={analytics} />
//         ) : activePage === "pending" ? (
//           <PendingPage {...{
//             pending,
//             loading,
//             activeRole,
//             setActiveRole,
//             openDetails,
//             selectedUser,
//             detailLoading,
//             modalUser,
//             modalProfile,
//             handleApprove,
//             handleReject,
//             closeDetails,
//             toast,
//             setToast,
//             pendingCounts,
//           }} />
//         ) : activePage === 'reports' ? (
//           <ReportsAdminPage api={api} />
//         ) : (
//           <UsersManagementPage
//             users={usersList}
//             loading={loading}
//             view={usersView}
//             setView={setUsersView}
//           />
//         )}
//       </main>

//       {selectedUser && (
//         <DetailsModal
//           {...{
//             modalUser,
//             modalProfile,
//             detailLoading,
//             closeDetails,
//             handleApprove,
//             handleReject,
//           }}
//         />
//       )}

//       <Toast
//         message={toast}
//         onClose={() => setToast(null)}
//         type={
//           toast && (toast.includes("approved") || toast.includes("rejected"))
//             ? "success"
//             : "error"
//         }
//       />
//     </div>
//   );
// }


