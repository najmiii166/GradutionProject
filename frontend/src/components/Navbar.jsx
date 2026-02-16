/// components/Navbar.jsx
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header 
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled 
          ? "py-3 bg-background/60 backdrop-blur-xl border-b border-border/50 shadow-sm" 
          : "py-6 bg-transparent border-b border-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-8 flex items-center justify-between">
        <Brand className="text-foreground transition-transform hover:scale-105" />
        
        <nav className="hidden md:flex items-center gap-8 bg-card/40 px-6 py-2.5 rounded-full border border-border/40 backdrop-blur-md shadow-inner shadow-white/5">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={handleScrollTo(section.id)}
              className={`relative text-[13px] font-medium tracking-wide transition-colors outline-none ${
                activeId === section.id ? "text-foreground" : "text-muted hover:text-foreground"
              }`}
            >
              {section.label}
              {activeId === section.id && (
                <motion.span
                  layoutId="nav-underline"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-cyan-500"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-5">
          <a
            href="/login"
            className="hidden sm:block text-[13px] font-semibold text-foreground/70 hover:text-foreground transition-colors"
          >
            Sign in
          </a>
          <button
            onClick={onOpenJoin}
            className="group relative px-6 py-2.5 bg-foreground text-background rounded-full overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10 active:scale-95"
          >
            <span className="relative z-10 text-[13px] font-bold">Join Now</span>
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </button>
        </div>
      </div>
    </header>
  );
}