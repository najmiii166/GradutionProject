// src/components/student/StudentSidebar.jsx
import { useState, useEffect } from "react";
import { 
  LayoutGrid, MessageCircle, LifeBuoy, Clock, Users,
  LogOut, Sun, Moon 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Brand from "../Brand";
import ChatNotificationBadge from "../ChatNotificationBadge";
import UserAvatar from "../UserAvatar";

export default function StudentSidebar({ activeTab, setActiveTab, navigate }) {
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  // 1. Initialize from localStorage so it doesn't "reset" to true on reload
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  
  const [hoveredTab, setHoveredTab] = useState(null);

  // 2. Sync Theme with Root AND LocalStorage
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const navItems = [
    { id: "home", label: "Dashboard", icon: LayoutGrid, path: "/student/dashboard" },
    { id: "mentors", label: "All Mentors", icon: Users, path: "/mentors" },
    { id: "chat", label: "Messages", icon: MessageCircle, path: "/chat" },
    { id: "support", label: "Support", icon: LifeBuoy, path: "/support" },
    { id: "history", label: "History", icon: Clock, path: "/history" },
  ];

  const handleLogout = () => {
    // Note: If you use localStorage.clear(), you delete the theme too!
    // Better to remove specific auth keys:
    localStorage.removeItem('token'); 
    localStorage.removeItem('user');
    window.location.href = "/login";
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-20 bg-sidebar backdrop-blur-xl border-r border-border/50 flex flex-col items-center py-8 z-50 transition-colors duration-300">
      
      {/* 1. BRAND (Icon Only) */}
      <div className="mb-12">
        <Brand hideText={true} className="scale-90" />
      </div>

      {/* 2. NAVIGATION LINKS */}
      <nav className="flex-1 flex flex-col gap-4">
        {navItems.map((item) => (
          <div key={item.id} className="relative flex items-center group">
            <button
              onMouseEnter={() => setHoveredTab(item.id)}
              onMouseLeave={() => setHoveredTab(null)}
              onClick={() => {
                setActiveTab(item.id);
                if (item.path) navigate(item.path);
              }}
              className={`p-3 rounded-2xl transition-all duration-300 relative ${
                activeTab === item.id 
                  ? "bg-cyan-500 text-white shadow-lg shadow-cyan-500/20" 
                  : "text-sidebar-foreground/70 hover:bg-sidebar-foreground/10 hover:text-sidebar-foreground"
              }`}
            >
              <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} />
              
              {/* Active Indicator Dot */}
              {activeTab === item.id && (
                <motion.div 
                  layoutId="sidebar-active"
                  className="absolute -left-10 w-1.5 h-6 bg-cyan-500 rounded-r-full"
                />
              )}
              
             {item.id === "chat" && <ChatNotificationBadge />}
            </button>

            {/* Tooltip */}
            <AnimatePresence>
              {hoveredTab === item.id && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="absolute left-16 px-3 py-1.5 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest rounded-lg pointer-events-none whitespace-nowrap shadow-xl"
                >
                  {item.label}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>

      {/* 3. BOTTOM ACTIONS */}
      <div className="flex flex-col items-center gap-6 pb-2">
        {/* Logout */}
        <button
          onClick={handleLogout}
          className="p-3 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-lg shadow-red-500/5"
          title="Logout Session"
        >
          <LogOut size={20} />
        </button>
      </div>
    </aside>
  );
}