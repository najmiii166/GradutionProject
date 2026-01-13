  // src/pages/StudentDashboard.jsx
  import { useEffect, useState, useRef } from "react";
  import { Navigate, useNavigate } from "react-router-dom";

  import { api, setAuthToken } from "../api/axios";
  import Toast from "../components/Toast";

  import MentorModal from "../components/MentorModal";
  import MentorCard from "../components/MentorCard";
  import EditProfileModal from "../components/EditProfileModal";

  import { motion } from "framer-motion";
  import useCountdown from "../hooks/useCountdown";
  import RequestCard from "../components/RequestCard";


  // Icons
  import {
    Users,
    Clock,
      Mail,
      LifeBuoy,
    XCircle,
    LayoutGrid,
    MessageCircle,
    Settings,
    LogOut,
    Sun,
    Moon,
  } from "lucide-react";

  import Brand from "../components/Brand";
  import TimeRemaining from "../components/TimeRemaining";

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

    const formatSessionInfo = (r) => {
  if (!r?.startTime || !r?.endTime) return "";

  const date = new Date(r.startTime).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  const from = new Date(r.startTime).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const to = new Date(r.endTime).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${date} • ${from} – ${to}`;
};


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

    const [showNotifications, setShowNotifications] = useState(false);
    const notifBtnRef = useRef(null);
    const notifRef = useRef(null);
    const prevRequestsRef = useRef([]);

    const [notifications, setNotifications] = useState([]);

    // Listen for socket notifications (normalized to same shape as polling)
    useEffect(() => {
      const handler = (e) => {
        try {
          const payload = e.detail;
          if (!payload || !payload.type) return;

          // Only handle request accept/reject
          if (
            payload.type !== "request:accepted" &&
            payload.type !== "request:rejected"
          ) {
            return;
          }

          const req = payload.request || {};
          const normalized = {
            type: payload.type,
            request: {
              _id: req._id,
              status: req.status,
              mentorName:
                req.mentorName ||
                req.mentorId?.user?.fullName ||
                "Mentor",
              startTime: req.startTime,
              endTime: req.endTime,
              requestedAt: req.requestedAt,
            },
            createdAt: Date.parse(req.updatedAt || req.requestedAt) || undefined,
          };

          setNotifications((prev) => {
            const id = normalized.request._id;
            const type = normalized.type;

            if (
              id &&
              prev.some(
                (n) =>
                  n.type === type &&
                  n.request &&
                  n.request._id &&
                  String(n.request._id) === String(id)
              )
            ) {
              return prev;
            }

            return [normalized, ...prev];
          });
        } catch (err) {
          console.error("socket notification handler error (student):", err);
        }
      };

      window.addEventListener("socket:notification", handler);
      return () => window.removeEventListener("socket:notification", handler);
    }, []);

 useEffect(() => {
  const poll = async () => {
    try {
      const { data } = await api.get("/requests/student");

      data.forEach((newReq) => {
        const oldReq = prevRequestsRef.current.find((r) => r._id === newReq._id);

        // If there's no previous snapshot for this request (e.g. after a page refresh),
        // but the request is already accepted or rejected, generate one notification.
        if (!oldReq) {
          const alreadyStatus = newReq.status;
          if (alreadyStatus === "upcoming" || alreadyStatus === "rejected") {
            const type = alreadyStatus === "upcoming" ? "request:accepted" : "request:rejected";
            setNotifications((prev) => {
              const id = newReq._id;
              if (
                id &&
                prev.some(
                  (n) =>
                    n.type === type &&
                    n.request &&
                    n.request._id &&
                    String(n.request._id) === String(id)
                )
              ) {
                return prev;
              }

              return [
                {
                  type,
                  request: {
                    _id: newReq._id,
                    status: newReq.status,
                    mentorName: newReq.mentorId?.user?.fullName || "Mentor",
                    startTime: newReq.startTime,
                    endTime: newReq.endTime,
                    requestedAt: newReq.requestedAt,
                  },
                  createdAt: Date.parse(newReq.updatedAt || newReq.requestedAt) || undefined,
                },
                ...prev,
              ];
            });
          }

          return;
        }

        const oldStatus = oldReq.status;
        const newStatus = newReq.status;

        if (oldStatus === newStatus) return;

        // ✅ ACCEPTED (pending -> upcoming)
        if (oldStatus === "pending" && newStatus === "upcoming") {
          setNotifications((prev) => {
            const id = newReq._id;
            if (
              id &&
              prev.some(
                (n) =>
                  n.type === "request:accepted" &&
                  n.request &&
                  n.request._id &&
                  String(n.request._id) === String(id)
              )
            ) {
              return prev;
            }

            return [
              {
                type: "request:accepted",
                request: {
                  _id: newReq._id,
                  status: newReq.status,
                  mentorName: newReq.mentorId?.user?.fullName || "Mentor",
                  startTime: newReq.startTime,
                  endTime: newReq.endTime,
                  requestedAt: newReq.requestedAt,
                },
                createdAt: Date.parse(newReq.updatedAt || newReq.requestedAt) || undefined,
              },
              ...prev,
            ];
          });
        }

        // ❌ REJECTED (pending -> rejected)
        if (oldStatus === "pending" && newStatus === "rejected") {
          setNotifications((prev) => {
            const id = newReq._id;
            if (
              id &&
              prev.some(
                (n) =>
                  n.type === "request:rejected" &&
                  n.request &&
                  n.request._id &&
                  String(n.request._id) === String(id)
              )
            ) {
              return prev;
            }

            return [
              {
                type: "request:rejected",
                request: {
                  _id: newReq._id,
                  status: newReq.status,
                  mentorName: newReq.mentorId?.user?.fullName || "Mentor",
                  requestedAt: newReq.requestedAt,
                },
                createdAt: Date.parse(newReq.updatedAt || newReq.requestedAt) || undefined,
              },
              ...prev,
            ];
          });
        }
      });

      // 🔥 THIS LINE IS CRITICAL
      prevRequestsRef.current = data;
      setRequests(data);
    } catch (err) {
      console.error("Polling error:", err);
    }
  };

  poll(); // initial load
  const interval = setInterval(poll, 15000);

  return () => clearInterval(interval);
}, []);



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

    // Settings modal
    const [settingsOpen, setSettingsOpen] = useState(false);

    const activeCount = requests.filter((r) =>
      ["upcoming", "ongoing"].includes(r.status)
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
          const initialReqs = reqs.data || [];
          setRequests(initialReqs);
          prevRequestsRef.current = initialReqs;
        } catch (err) {
          console.error("Dashboard load error:", err);
          setToast("Failed to load dashboard data.");
        } finally {
          setLoading(false);
        }
      })();
    }, []);

    // Load student's enrollments (for Time Remaining)
    const [enrollments, setEnrollments] = useState([]);
    const [enrollLoading, setEnrollLoading] = useState(true);
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
      const { data } = await api.get("/requests/student");
      const updated = data || [];
      setRequests(updated);
      prevRequestsRef.current = updated;
    };

    const cancelRequest = async (id) => {
      try {
        await api.delete(`/requests/${id}`);
        setRequests((prev) => {
          const next = prev.filter((r) => r._id !== id);
          prevRequestsRef.current = next;
          return next;
        });
        setToast("❌ Request cancelled");
      } catch {
        setToast("Failed to cancel request.");
      }
    };

    const deleteRejected = async (id) => {
      try {
        await api.delete(`/requests/${id}`);
        setRequests((prev) => {
          const next = prev.filter((r) => r._id !== id);
          prevRequestsRef.current = next;
          return next;
        });
        setToast("🗑️ Removed rejected request");
      } catch {
        setToast("Failed to remove request.");
      }
    };

    const pendingRequests = requests.filter((r) => r.status === "pending");
    const upcomingRequests = requests.filter((r) =>
    ["upcoming", "ongoing"].includes(r.status)
  );

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

            {/* HISTORY */}
<button
  onClick={() => {
    setActiveTab("history");
    navigate("/history");
  }}
  className="transition"
>
  <Clock
    className={`w-6 h-6 ${
      activeTab === "history"
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

            {/* Notifications bell */}
            <div className="relative">
              <button
                ref={notifBtnRef}
                onClick={() => setShowNotifications((v) => !v)}
                aria-expanded={showNotifications}
                aria-controls="student-notifications"
                className="relative rounded-full bg-slate-800/70 p-2 border border-slate-700 hover:border-sky-500 transition mr-2"
              >
                <Mail className="w-5 h-5 text-slate-200" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 min-w-[1rem] px-1 rounded-full bg-rose-500 text-[10px] font-semibold text-white flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div
                  ref={notifRef}
                  id="student-notifications"
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

                  {
                    (() => {
                      const dropdownItems = [
                        // typed notifications first
                        ...notifications.filter(
                          (n) => n.type === "request:accepted" || n.type === "request:rejected"
                        ),
                        // (no pending raw requests here — students shouldn't get 'Request Pending')
                      ]
                        .slice()
                        .sort((a, b) => {
                          const ta = (a.createdAt ?? Date.parse(a.request?.requestedAt || 0)) || 0;
                          const tb = (b.createdAt ?? Date.parse(b.request?.requestedAt || 0)) || 0;
                          return tb - ta;
                        });

                      if (dropdownItems.length === 0) {
                        return <p className="text-sm text-slate-400">No notifications.</p>;
                      }

                      return (
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {dropdownItems.map((item, idx) => {
                            const t = item.type;
                            const req = item.request || {};
                            const key = `${t}-${req._id || idx}`;
                            const colorClass =
                              t === "request:accepted"
                                ? "text-emerald-400"
                                : t === "request:rejected"
                                ? "text-rose-400"
                                : "text-amber-400";

                            return (
                              <div key={key} className="rounded-lg border border-slate-800 bg-slate-900/70 p-2">
                                <div className="flex items-center justify-between text-sm">
                                  <span className={`font-semibold ${colorClass}`}>
                                    {t === "request:accepted" && "Request Accepted"}
                                    {t === "request:rejected" && "Request Rejected"}
                                    {t === "request:pending" && "Request Pending"}
                                  </span>
                                  {(() => {
                                    const displayTs = req.requestedAt || item.createdAt;
                                    const displayDate = displayTs ? new Date(displayTs).toLocaleDateString() : "";
                                    return <span className="text-xs text-slate-400">{displayDate}</span>;
                                  })()}
                                </div>

                                <p className="text-xs text-slate-400 mt-1">
                                  {t === "request:accepted" && (
                                    <>
                                      Your request was accepted by <span className="text-slate-200 font-medium">{req.mentorName}</span>
                                      <br />
                                      <span className="text-sky-400">{formatSessionInfo(req)}</span>
                                    </>
                                  )}

                                  {t === "request:rejected" && (
                                    <>
                                      Your request was rejected by <span className="text-slate-200 font-medium">{req.mentorName}</span>
                                    </>
                                  )}

                                  {t === "request:pending" && (
                                    <>Mentorship request pending</>
                                  )}
                                </p>

                                <div className="mt-2 flex items-center justify-end gap-2">
                                  {t === "request:pending" && (
                                    <button
                                      onClick={async () => {
                                        try {
                                          let mentorUserId = req.mentorUserId || req.mentorId;

                                          // If the notification payload doesn't include mentor id,
                                          // fetch the student's requests and find the matching one.
                                          if (!mentorUserId) {
                                            const { data: allReqs } = await api.get('/requests/student');
                                            const found = (allReqs || []).find((r) => String(r._id) === String(req._id));
                                            mentorUserId = found?.mentorId?.user?._id || found?.mentorId || null;
                                          }

                                          if (!mentorUserId) {
                                            setToast('Failed to determine mentor for this request.');
                                            return;
                                          }

                                          const { data } = await api.get(`/mentor/mentors/${mentorUserId}`);
                                          setSelectedMentor(data || null);
                                          setShowProfile(true);
                                          setShowNotifications(false);
                                          setNotifications((prev) => prev.filter((x) => !(x.type === t && x.request && String(x.request._id) === String(req._id))));
                                        } catch (err) {
                                          setToast("Failed to load mentor profile.");
                                        }
                                      }}
                                      className="text-xs px-2 py-1 rounded-md border border-slate-700 hover:border-sky-500 text-slate-200"
                                    >
                                      View
                                    </button>
                                  )}

                                  {t === "request:pending" && (
                                    <button
                                      onClick={() => { cancelRequest(req._id); setShowNotifications(false); }}
                                      className="text-xs px-2 py-1 rounded-md bg-rose-600 text-white hover:bg-rose-500"
                                    >
                                      Cancel
                                    </button>
                                  )}

                                  {t === "request:rejected" && (
                                    <button
                                      onClick={() => { deleteRejected(req._id); setShowNotifications(false); setNotifications((prev) => prev.filter((x) => !(x.type === t && x.request && String(x.request._id) === String(req._id)))); }}
                                      className="text-xs px-2 py-1 rounded-md bg-slate-700 text-white hover:bg-slate-600"
                                    >
                                      Remove
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()
                  }
                </div>
              )}
            </div>

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
          {/* Enrollment Panel */}
          {!enrollLoading && enrollments.length > 0 && (
            <div className="rounded-xl p-4 bg-slate-900/60 border border-slate-800 shadow-lg mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Current Mentorship</p>
                  <p className="text-lg font-semibold">{enrollments[0].mentor?.fullName || 'Mentor'}</p>
                </div>
                <div>
                  <TimeRemaining expiryDate={enrollments[0].expiryDate} />
                </div>
              </div>
            </div>
          )}

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

  {/* Tabs */}
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

  {/* List */}
  <div className="flex-1 overflow-y-auto pr-1 space-y-3">
    {filteredList.length === 0 ? (
      <p className="text-sm text-slate-400">
        No {activeFilter} requests.
      </p>
    ) : (
      filteredList.map((r) => (
        <RequestCard
          key={r._id}
          r={r}
          user={user}
          navigate={navigate}
          api={api}
          cancelRequest={cancelRequest}
          deleteRejected={deleteRejected}
          setToast={setToast}
        />
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
