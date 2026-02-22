// src/components/student/StudentNavbar.jsx
import { useEffect, useRef, useState } from "react";
import { Mail } from "lucide-react";
import ThemeToggle from "../ThemeToggle";
import NotificationsDropdown from "./NotificationsDropdown";
import { motion, AnimatePresence } from "framer-motion";
import UserAvatar from "../UserAvatar";

export default function StudentNavbar({
  user,
  notifications,
  setNotifications,
  onViewNotification,
  onCancelNotification,
  onDeleteNotification,
  setSelectedMentor,
  setShowProfile,
  setToast,
  activeTab,
  status,
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const notifBtnRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    if (!showNotifications) return;
    const handleClickOutside = (e) => {
      if (
        notifRef.current && !notifRef.current.contains(e.target) &&
        notifBtnRef.current && !notifBtnRef.current.contains(e.target)
      ) {
        setShowNotifications(false);
      }
    };
    const handleKey = (e) => { if (e.key === "Escape") setShowNotifications(false); };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [showNotifications]);

  const tabLabel = (() => {
    switch (activeTab) {
      case "home": return "Dashboard";
      case "mentors": return "All Mentors";
      case "chat": return "Messages";
      case "support": return "Support";
      case "history": return "Session History";
      default: return "Dashboard";
    }
  })();
  const firstName = (user?.fullName || "").split(" ")[0] || "there";

  return (
    <nav className="ml-20 flex items-center gap-4 px-8 py-4 bg-transparent sticky top-0 z-[40]">
      {/* Single long bar with welcome + actions */}
      <div className="flex-1 flex items-center gap-3 px-5 py-3 rounded-2xl bg-sidebar border border-border/40 shadow-md text-white">
        <div className="flex items-center gap-3 text-sm font-semibold">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white/90">Welcome, {firstName}. You’re on {tabLabel}.</span>
        </div>

        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-3 bg-sidebar/90 border border-border/40 p-1.5 rounded-2xl shadow">
          {/* Custom Theme Toggle (Sidebar Style) */}
          <ThemeToggle
            className="p-3 rounded-2xl text-foreground/40 hover:bg-foreground/5 hover:text-foreground transition-all"
            iconSize={28}
            sunClass="text-orange-400"
            moonClass="text-cyan-500"
          />
          <div className="w-[1px] h-6 bg-border/50" />
        
        <div className="relative flex items-center justify-center">
          <button
            ref={notifBtnRef}
            onClick={() => setShowNotifications((v) => !v)}
            className={`relative p-2 rounded-xl transition-all duration-300 ${
              showNotifications 
                ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20" 
                : "text-white/80 hover:bg-white/10 hover:text-white"
            }`}
          >
            <Mail size={20} strokeWidth={showNotifications ? 2.5 : 2} />
            {notifications.length > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[1rem] px-1 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center border-2 border-background">
                {notifications.length}
              </span>
            )}
          </button>

          {/* THE REFINED DROPDOWN CONTAINER */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                // 1. We start at height 0 and scale it from the top
                initial={{ opacity: 0, height: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, height: "auto", scale: 1, y: 0 }}
                exit={{ opacity: 0, height: 0, scale: 0.95, y: -10 }}
                transition={{ 
                  type: "spring", 
                  damping: 25, 
                  stiffness: 200,
                  opacity: { duration: 0.2 } 
                }}
                style={{ 
                  originX: 1, 
                  originY: 0,
                  overflow: "hidden" // Critical for the "unrolling" effect
                }} 
                className="absolute right-0 top-full mt-4 z-[100] w-[320px]"
              >
                <div className="pt-2"> {/* Space for the arrow */}
                  <NotificationsDropdown
                    refObj={{ notifRef, notifBtnRef }}
                    notifications={notifications}
                    setNotifications={setNotifications}
                    onView={onViewNotification}
                    onCancel={onCancelNotification}
                    onDelete={onDeleteNotification}
                    close={() => setShowNotifications(false)}
                    setSelectedMentor={setSelectedMentor}
                    setShowProfile={setShowProfile}
                    setToast={setToast}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-[1px] h-6 bg-border/50" />

        <button
          onClick={() => setShowProfile(true)}
          className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-foreground/5 transition-all group"
          aria-label="Open profile"
        >
          <UserAvatar
            name={user?.fullName}
            src={user?.profileImageUrl}
            size={36}
            className="group-hover:scale-105 transition-transform"
          />
        </button>
        </div>
      </div>
    </nav>
  );
}