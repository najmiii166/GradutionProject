// frontend/src/components/admin/Sidebar.jsx
import { useState, useEffect } from "react";
import Brand from "../Brand";
import SidebarButton from "./SidebarButton";
import { 
  Home, Users, Clock, LogOut, FileText, 
  Menu, X, ShieldCheck, ChevronLeft, Sun, Moon 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Sidebar({ activePage, setActivePage, navigate }) {
  const [isOpen, setIsOpen] = useState(false); // Mobile Drawer
  const [isCollapsed, setIsCollapsed] = useState(false); // Desktop Mini-sidebar
  const [isDark, setIsDark] = useState(true);

  // Initialize/Toggle Theme
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark]);

  const navItems = [
    { id: "overview", label: "Overview", icon: Home },
    { id: "pending", label: "Pending Users", icon: Clock },
    { id: "users", label: "Users Management", icon: Users },
    { id: "reports", label: "Reports", icon: FileText },
  ];

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
  };

  const SidebarContent = ({ mobile = false }) => {
    const showLabel = mobile || !isCollapsed;

    return (
      <div className="flex flex-col h-full bg-background/80 backdrop-blur-xl border-r border-border/50 transition-all duration-300">
        
        {/* 1. BRAND HEADER */}
        <div className={`px-6 py-8 border-b border-border/50 flex flex-col ${!showLabel ? 'items-center' : ''}`}>
          <div className="flex items-center">
             <Brand className={`${showLabel ? 'scale-110 origin-left' : 'scale-100'} transition-transform`} hideText={!showLabel} />
          </div>
          
          {showLabel && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="mt-4 flex items-center gap-2"
            >
              <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
              <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/40 font-bold">
                Admin <span className="italic font-serif text-cyan-500/80">Control.</span>
              </p>
            </motion.div>
          )}
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
        <div className={`p-4 border-t border-border/50 bg-foreground/[0.02] space-y-2`}>
          {/* Theme Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className={`w-full flex items-center gap-4 p-3 rounded-xl hover:bg-foreground/5 transition-colors ${!showLabel ? 'justify-center' : ''}`}
          >
            {isDark ? <Sun size={18} className="text-orange-400" /> : <Moon size={18} className="text-cyan-500" />}
            {showLabel && (
              <span className="text-[10px] uppercase tracking-widest text-foreground/60 font-bold">
                {isDark ? "Light Mode" : "Dark Mode"}
              </span>
            )}
          </button>

          {/* Logout */}
          <div className={`flex items-center ${!showLabel ? 'justify-center' : 'justify-between px-2'}`}>
            {showLabel && (
              <div className="flex flex-col">
                <p className="text-[10px] uppercase tracking-widest text-foreground/30 font-bold">Session</p>
                <p className="text-sm font-medium text-foreground/80 italic font-serif">Admin</p>
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
        className={`hidden lg:flex fixed left-0 top-0 h-screen z-50 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-72'}`}
      >
        {/* Toggle Collapse Button */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-10 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center text-white z-[60] shadow-lg hover:scale-110 transition-transform"
        >
          <ChevronLeft size={14} className={`transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
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

      {/* Dynamic spacing for page content */}
      <div className={`hidden lg:block shrink-0 transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-72'}`} />
    </>
  );
}