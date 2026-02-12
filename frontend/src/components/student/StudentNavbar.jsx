// src/components/student/StudentNavbar.jsx
import { useEffect, useRef, useState } from "react";
import { Mail } from "lucide-react";
import ThemeToggle from "../ThemeToggle";
import NotificationsDropdown from "./NotificationsDropdown";
import { getInitials } from "../../utils/student";
import { motion, AnimatePresence } from "framer-motion";

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

  return (
    <nav className="ml-20 flex items-center justify-end px-8 py-4 bg-transparent sticky top-0 z-[40]">
      
      {/* Right side: Floating Actions Pill */}
      <div className="flex items-center gap-3 bg-card/30 backdrop-blur-xl border border-border/50 p-1.5 rounded-2xl shadow-xl">
        <ThemeToggle className="hidden sm:inline-flex" />
        <div className="w-[1px] h-6 bg-border/50" />
        
        <div className="relative flex items-center justify-center">
          <button
            ref={notifBtnRef}
            onClick={() => setShowNotifications((v) => !v)}
            className={`relative p-2 rounded-xl transition-all duration-300 ${
              showNotifications 
                ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20" 
                : "text-foreground/60 hover:bg-foreground/5 hover:text-foreground"
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

        <div className="w-[1px] h-6 bg-border/50 mx-1" />

        <button
          onClick={() => setShowProfile(true)}
          className="flex items-center gap-3 pl-1 pr-2 py-1 rounded-xl hover:bg-foreground/5 transition-all group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/10 group-hover:scale-105 transition-transform">
            {getInitials(user.fullName)}
          </div>
          <span className="hidden sm:block text-xs font-bold text-foreground/80 tracking-tight">
            {user.fullName}
          </span>
        </button>
      </div>
    </nav>
  );
}