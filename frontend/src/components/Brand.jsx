import { Sparkles } from "lucide-react";

export default function Brand({ className = "" }) {
  return (
    <div className={`flex items-center gap-2 select-none ${className}`}>
      {/* Logo icon */}
      <div className="flex items-center justify-center h-10 w-10 rounded-2xl bg-gradient-to-br from-sky-400 to-blue-500 shadow-md">
        <Sparkles className="h-5 w-5 text-white" />
      </div>

      {/* Brand name */}
      <span className="text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-600">
        MentorLink
      </span>
    </div>
  );
}
