/// components/Navbar.jsx
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import Brand from "./Brand";

const SECTIONS = [
  { id: "home", label: "Home" },
  { id: "why", label: "Why MentorLink" },
  { id: "how", label: "How it works" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
];

export default function Navbar({ onOpenJoin }) {
  const [activeId, setActiveId] = useState("home");
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      { threshold: 0.35, rootMargin: "-30% 0px -50% 0px" }
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  const handleScrollTo = (id) => (event) => {
    event.preventDefault();
    setActiveId(id);
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <header 
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled 
            ? "py-3 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm" 
            : "py-6 bg-transparent border-b border-transparent"
        }`}
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8 flex items-center justify-between">
          <Brand className="text-foreground transition-transform hover:scale-105 relative z-50" />
          
          <nav className="hidden md:flex items-center gap-2 bg-card/60 px-2 py-1.5 rounded-full border border-border/40 backdrop-blur-md shadow-inner shadow-white/5">
            {SECTIONS.map((section) => (
              <button
                key={section.id}
                onClick={handleScrollTo(section.id)}
                className={`relative px-5 py-2 text-[13px] font-semibold tracking-wide transition-colors outline-none rounded-full ${
                  activeId === section.id ? "text-background" : "text-muted hover:text-foreground hover:bg-foreground/5"
                }`}
              >
                <span className="relative z-10">{section.label}</span>
                {activeId === section.id && (
                  <motion.div
                    layoutId="nav-bg"
                    className="absolute inset-0 bg-foreground rounded-full shadow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-4 z-50">
            <a
              href="/login"
              className="hidden sm:block text-[14px] font-semibold text-foreground/80 hover:text-foreground transition-colors"
            >
              Sign in
            </a>
            <button
              onClick={onOpenJoin}
              className="hidden sm:flex group relative px-6 py-2.5 bg-foreground text-background rounded-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20 active:scale-95 items-center justify-center"
            >
              <span className="relative z-10 text-[13px] font-bold">Join Now</span>
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </button>

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-2 text-foreground relative z-50"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <X className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }}>
                    <Menu className="w-6 h-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, backdropFilter: 'blur(0px)' }}
            animate={{ opacity: 1, y: 0, backdropFilter: 'blur(16px)' }}
            exit={{ opacity: 0, y: -20, backdropFilter: 'blur(0px)' }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 bg-background/95 md:hidden flex flex-col items-center justify-center pt-20"
          >
            <nav className="flex flex-col items-center gap-6 w-full px-8">
              {SECTIONS.map((section, idx) => (
                <motion.button
                  key={section.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={handleScrollTo(section.id)}
                  className={`text-3xl font-bold tracking-tight w-full text-center py-2 ${
                    activeId === section.id ? "text-cyan-500" : "text-foreground"
                  }`}
                >
                  {section.label}
                </motion.button>
              ))}
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.3 }}
                className="w-full flex flex-col gap-4 mt-8 pt-8 border-t border-border/50"
              >
                <a
                  href="/login"
                  className="w-full py-4 text-center rounded-2xl bg-card border border-border text-foreground font-semibold text-lg"
                >
                  Sign in
                </a>
                <button
                  onClick={() => { setMobileMenuOpen(false); onOpenJoin(); }}
                  className="w-full py-4 text-center rounded-2xl bg-foreground text-background font-bold text-lg shadow-xl shadow-cyan-500/20"
                >
                  Join MentorLink
                </button>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}