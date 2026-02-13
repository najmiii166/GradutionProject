// frontend/src/components/admin/Sidebar.jsx
import { useState, useEffect } from "react";
import Brand from "../Brand";
import SidebarButton from "./SidebarButton";
import { 
  Home, Users, Clock, LogOut, FileText, 
  Menu, X, ShieldCheck, Sun, Moon, 
  PanelLeftOpen, PanelLeftClose
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Sidebar({ activePage, setActivePage, navigate }) {
  const [isOpen, setIsOpen] = useState(false); // Mobile Drawer
  const [isCollapsed, setIsCollapsed] = useState(false); // Desktop Mini-sidebar
  
  // 1. FIXED: Initialize from localStorage to prevent "reload to dark"
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // 2. FIXED: Toggle Theme and Sync with Storage
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
    { id: "overview", label: "Overview", icon: Home },
    { id: "pending", label: "Pending Users", icon: Clock },
    { id: "users", label: "Users Management", icon: Users },
    { id: "reports", label: "Reports", icon: FileText },
  ];

  // 3. FIXED: Changed localStorage.clear() to specific item removal
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // We keep the 'theme' key so the user's preference stays
    window.location.href = "/login";
  };

  const SidebarContent = ({ mobile = false }) => {
    const showLabel = mobile || !isCollapsed;

    return (
      <div className="flex flex-col h-full bg-sidebar backdrop-blur-xl border-r border-border/50 transition-all duration-300">
        
        {/* 1. BRAND HEADER */}
        <div className={`px-6 py-8 border-b border-border/50 flex flex-col ${!showLabel ? 'items-center' : ''}`}>
          <div className="flex items-center">
             <Brand className={`${showLabel ? 'scale-110 origin-left' : 'scale-100'} transition-transform`} hideText={!showLabel} />
          </div>
       
           
        </div>
        

        {/* 2. NAVIGATION */}
        <nav className={`flex-1 ${!showLabel ? 'px-2' : 'px-4'} py-8 space-y-2`}>
          {navItems.map((item) => (
            <SidebarButton
              key={item.id}
              active={activePage === item.id}
              icon={<item.icon size={18} />}
              label={showLabel ? item.label : ""}
              onClick={() => {
                setActivePage(item.id);
                setIsOpen(false);
              }}
              collapsed={!showLabel}
            />
          ))}
          
          <div className={`pt-4 mt-4 border-t border-border/50 ${!showLabel ? 'flex justify-center' : ''}`}>
              <SidebarButton 
                icon={<ShieldCheck size={18} />} 
                label={showLabel ? "Tickets" : ""} 
                active={activePage === 'tickets'}
                onClick={() => {
                  setActivePage('tickets');
                  setIsOpen(false);
                }} 
                collapsed={!showLabel}
              />
          </div>
        </nav>

        {/* 3. BOTTOM SECTION: THEME & LOGOUT */}
        <div className={`p-4 border-t border-border/50 bg-sidebar-foreground/[0.02] space-y-2`}>
          {/* Theme Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className={`w-full flex items-center gap-4 p-3 rounded-xl hover:bg-sidebar-foreground/5 transition-colors ${!showLabel ? 'justify-center' : ''}`}
          >
            {isDark ? <Sun size={18} className="text-orange-400" /> : <Moon size={18} className="text-cyan-500" />}
            {showLabel && (
              <span className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60 font-bold">
                {isDark ? "Light Mode" : "Dark Mode"}
              </span>
            )}
          </button>

          {/* Logout */}
          <div className={`flex items-center ${!showLabel ? 'justify-center' : 'justify-between px-2'}`}>
            {showLabel && (
              <div className="flex flex-col">
                <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/30 font-bold">Session</p>
                <p className="text-sm font-medium text-sidebar-foreground/80 italic font-serif">Admin</p>
              </div>
            )}
            <button 
              onClick={handleLogout}
              className={`rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300 ${!showLabel ? 'p-3' : 'p-2.5'}`}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* MOBILE HEADER */}
      <div className="lg:hidden fixed top-0 left-0 w-full z-[60] bg-background/80 backdrop-blur-md border-b border-border p-4 flex justify-between items-center">
        <Brand />
        <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-lg bg-foreground/5 text-foreground">
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* DESKTOP SIDEBAR */}
      <aside 
        className={`hidden lg:flex fixed left-0 top-0 h-screen z-50 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`}
      >
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-3 w-7 h-7 rounded-lg bg-sidebar-foreground/10 border border-border text-sidebar-foreground flex items-center justify-center z-[60] shadow-md hover:bg-sidebar-foreground/15 transition-all"
        >
          {isCollapsed ? (
            <PanelLeftOpen size={16} />
          ) : (
            <PanelLeftClose size={16} />
          )}
        </button>
        
        <SidebarContent />
      </aside>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOpen(false)} className="fixed inset-0 z-[60] bg-background/60 backdrop-blur-sm lg:hidden" />
            <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed left-0 top-0 h-screen w-80 z-[70] lg:hidden">
              <SidebarContent mobile />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div className={`hidden lg:block shrink-0 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-64'}`} />
    </>
  );
}