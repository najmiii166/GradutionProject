import { useEffect, useState } from "react";
import Brand from "./Brand";
import ThemeToggle from "./ThemeToggle";

const SECTIONS = [
  { id: "home", label: "Home" },
  { id: "how", label: "How it works" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
];

export default function Navbar({ onOpenJoin }) {
  const [activeId, setActiveId] = useState("home");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        root: null,
        threshold: 0.4,
        rootMargin: "-20% 0px -60% 0px",
      }
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleScrollTo = (id) => (event) => {
    event.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    setActiveId(id);
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className="fixed top-0 w-full z-50 backdrop-blur-md border-b border-border bg-background/80">
      <div className="mx-auto max-w-7xl px-8 py-5 flex items-center justify-between">
        <Brand className="text-foreground opacity-90" />
        <nav className="flex items-center gap-6 text-[13px] font-medium tracking-wide" aria-label="Main navigation">
          <ThemeToggle />
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              onClick={handleScrollTo(section.id)}
              className={`relative text-foreground/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background ${
                activeId === section.id ? "text-foreground" : "hover:text-foreground"
              }`}
              aria-current={activeId === section.id ? "page" : undefined}
            >
              {section.label}
              {activeId === section.id && (
                <span className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-linear-to-r from-cyan-500 to-violet-500" />
              )}
            </button>
          ))}
          <a
            href="/login"
            className="text-foreground/80 hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Sign in
          </a>
          <button
            onClick={onOpenJoin}
            className="px-6 py-2 bg-foreground text-background rounded-full hover:opacity-95 transition-all duration-300 font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Join
          </button>
        </nav>
      </div>
    </header>
  );
}
