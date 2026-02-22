// src/components/mentor/MentorNavbar.jsx
import { Bell } from "lucide-react";
import ThemeToggle from "../ThemeToggle";
import MentorNotifications from "./MentorNotifications";
import { motion, AnimatePresence } from "framer-motion";
import UserAvatar from "../UserAvatar";

export default function MentorNavbar({
  requests,
  notifications,
  showNotifications,
  setShowNotifications,
  notifBtnRef,
  notifRef,
  setExternalOpenRequest,
  navigate,
  setNotifications,
  setMentorModalOpen,
  fullName,
  profileImageUrl,
  activeTab,
  status,
}) {
  const totalNotifs = requests.length + notifications.length;

  const tabLabel = (() => {
    switch (activeTab) {
      case "home": return "Dashboard";
      case "requests": return "Requests";
      case "sessions": return "Sessions";
      case "availability": return "Availability";
      default: return "Dashboard";
    }
  })();
  const nameParts = (fullName || "").trim().split(" ").filter(Boolean);
  const prefixes = ["dr", "mr", "mrs", "ms", "prof", "eng"];
  const firstToken = nameParts[0]?.toLowerCase();
  const hasPrefix = prefixes.includes(firstToken) && nameParts.length > 1;
  const displayName = hasPrefix
    ? `${nameParts[0]} ${nameParts[1]}`
    : nameParts[0] || "there";

  return (
    <nav className="ml-20 flex items-center gap-4 px-8 py-4 bg-transparent sticky top-0 z-[40]">
      {/* Single long bar with welcome + actions (match student style) */}
      <div className="flex-1 flex items-center gap-3 px-5 py-3 rounded-2xl bg-sidebar border border-border/40 shadow-md text-white">
        <div className="flex items-center gap-3 text-sm font-semibold">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-white/90">Welcome, {displayName}. You’re on {tabLabel}.</span>
        </div>

        <div className="flex-1" />

        {/* Action Pill Container */}
        <div className="flex items-center gap-3 bg-sidebar/90 border border-border/40 p-1.5 rounded-2xl shadow">
          {/* Custom Theme Toggle (Sidebar Style) */}
          <ThemeToggle
            className="p-3 rounded-2xl text-sidebar-foreground/50 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground transition-all"
            iconSize={28}
            sunClass="text-orange-400"
            moonClass="text-cyan-500"
          />
          <div className="w-[1px] h-6 bg-border/50" />
        
        {/* Notifications Trigger */}
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
            <Bell size={20} strokeWidth={showNotifications ? 2.5 : 2} />
            
            {totalNotifs > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[1rem] px-1 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center border-2 border-background">
                {totalNotifs}
              </span>
            )}
          </button>

          {/* Animated Dropdown Container */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div
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
                  overflow: "hidden" 
                }} 
                className="absolute right-0 top-full mt-4 z-[100] w-[320px]"
              >
                <div className="pt-2">
                  <MentorNotifications
                    notifications={notifications}
                    requests={requests}
                    notifRef={notifRef}
                    setShowNotifications={setShowNotifications}
                    setExternalOpenRequest={setExternalOpenRequest}
                    navigate={navigate}
                    setNotifications={setNotifications}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Vertical Divider */}
        <div className="w-[1px] h-6 bg-border/50" />

        {/* Mentor Profile Trigger - icon only */}
        <button
          onClick={() => setMentorModalOpen(true)}
          className="flex items-center gap-2 px-2 py-1 rounded-xl hover:bg-white/10 transition-all group"
          aria-label="Open profile"
        >
          <UserAvatar
            name={fullName}
            src={profileImageUrl}
            size={36}
            className="group-hover:scale-105 transition-transform"
          />
        </button>
        </div>
      </div>
    </nav>
  );
}