// frontend/src/components/Brand.jsx
import { Logo } from "./Logo";

export default function Brand({ className = "", hideText = false }) {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <Logo className="h-8 w-8 text-cyan-500 dark:text-cyan-400 transition-colors duration-300 flex-shrink-0" />

      {!hideText && (
        <span className="text-2xl font-light tracking-tighter text-foreground whitespace-nowrap">
          Mentor<span className="font-semibold">Link</span>
        </span>
      )}
    </div>
  );
}