// frontend/src/components/ThemeToggle.jsx
import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ className = "", iconSize = 16, sunClass = "", moonClass = "" }) {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("theme") || (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    } catch (e) {
      return "light";
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    try { localStorage.setItem("theme", theme); } catch (e) {}
  }, [theme]);

  const toggle = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <button
      onClick={toggle}
      aria-label="Toggle color theme"
      title="Toggle theme"
      className={`inline-flex items-center justify-center w-9 h-9 ${className}`}
    >
      {theme === "dark"
        ? <Sun size={iconSize} className={sunClass} />
        : <Moon size={iconSize} className={moonClass} />}
    </button>
  );
}
