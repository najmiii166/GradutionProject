// src/components/mentor/MentorSidebar.jsx
import { useState, useEffect } from "react";
import { 
  LayoutGrid, MessageCircle, LifeBuoy, Clock, 
  LogOut, Sun, Moon 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Brand from "../Brand";
import ChatNotificationBadge from "../ChatNotificationBadge";

export default function MentorSidebar({ activeTab, setActiveTab, navigate }) {
  // 1. Theme Logic
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  
  const [hoveredTab, setHoveredTab] = useState(null);

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
    { id: "home", label: "Dashboard", icon: LayoutGrid, path: null },
    { id: "chat", label: "Messages", icon: MessageCircle, path: "/chat" },
    { id: "support", label: "Support", icon: LifeBuoy, path: "/support" },
    { id: "history", label: "History", icon: Clock, path: "/history" },
  ];

  const handleLogout = () => {
    localStorage.removeItem('token'); 
    localStorage.removeItem('role');
    localStorage.removeItem('status');
    localStorage.removeItem('fullName');
    window.location.href = "/login";
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-20 bg-background/80 backdrop-blur-xl border-r border-border/50 flex flex-col items-center py-8 z-50">
      
      {/* 1. BRAND */}
      <div className="mb-12">
        <Brand hideText={true} className="scale-90" />
      </div>

      {/* 2. NAVIGATION */}
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
                  : "text-foreground/40 hover:bg-foreground/5 hover:text-foreground"
              }`}
            >
              <item.icon size={22} strokeWidth={activeTab === item.id ? 2.5 : 2} />
              
              {/* Active Indicator Dot */}
              {activeTab === item.id && (
                <motion.div 
                  layoutId="mentor-sidebar-active"
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
                  className="absolute left-16 px-3 py-1.5 bg-foreground text-background text-[10px] font-bold uppercase tracking-widest rounded-lg pointer-events-none whitespace-nowrap shadow-xl z-[60]"
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
        
        {/* Theme Toggle */}
        <button
          onClick={() => setIsDark(!isDark)}
          className="p-3 rounded-2xl text-foreground/40 hover:bg-foreground/5 hover:text-foreground transition-all"
        >
          {isDark ? (
            <Sun size={20} className="text-orange-400" />
          ) : (
            <Moon size={20} className="text-cyan-500" />
          )}
        </button>

        {/* Logout (Red Style) */}
        <button
          onClick={handleLogout}
          className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all duration-300 shadow-lg shadow-rose-500/5"
          title="Logout Session"
        >
          <LogOut size={20} />
        </button>
      </div>
    </aside>
  );
}