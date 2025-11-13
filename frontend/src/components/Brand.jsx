// src/components/Brand.jsx
export default function Brand({ className = "" }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-500 shadow-inner" />
      <span className="text-xl font-bold tracking-tight">MentorLink</span>
    </div>
  );
}
