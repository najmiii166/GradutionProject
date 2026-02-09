// src/components/mentor/MentorNavbar.jsx
import { Bell } from "lucide-react";
import MentorNotifications from "./MentorNotifications";
import { getInitials } from "../../utils/mentor";
import { motion, AnimatePresence } from "framer-motion";

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
}) {
  const totalNotifs = requests.length + notifications.length;

  return (
    <nav className="ml-20 flex items-center justify-end px-8 py-4 bg-transparent sticky top-0 z-[40]">
      
      {/* Action Pill Container */}
      <div className="flex items-center gap-3 bg-card/30 backdrop-blur-xl border border-border/50 p-1.5 rounded-2xl shadow-xl">
        
        {/* Notifications Trigger */}
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
        <div className="w-[1px] h-6 bg-border/50 mx-1" />

        {/* Mentor Profile Trigger */}
        <button
          onClick={() => setMentorModalOpen(true)}
          className="flex items-center gap-3 pl-1 pr-2 py-1 rounded-xl hover:bg-foreground/5 transition-all group"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-cyan-500/10 group-hover:scale-105 transition-transform">
            {getInitials(fullName)}
          </div>
          
          <div className="hidden sm:flex flex-col items-start leading-none">
            <span className="text-xs font-bold text-foreground/80 tracking-tight">
              {fullName}
            </span>
            <span className="text-[9px] font-semibold text-cyan-500/70 uppercase tracking-wider mt-0.5">
              Mentor
            </span>
          </div>
        </button>
      </div>
    </nav>
  );
}