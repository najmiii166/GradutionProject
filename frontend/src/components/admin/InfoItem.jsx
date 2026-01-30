// frontend/src/components/admin/InfoItem.jsx
export default function InfoItem({ label, value, icon }) {
  return (
    <div className="group flex flex-col gap-1">
      {/* Label: Small-caps, wide tracking, low opacity */}
      <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-foreground/30 flex items-center gap-1.5">
        {icon && <span className="text-cyan-500/50">{icon}</span>}
        {label}
      </p>
      
      {/* Value: High contrast, slightly larger, adaptive weight */}
      <p className={`
        text-sm tracking-tight transition-colors duration-300
        ${value ? "text-foreground font-medium" : "text-foreground/20 font-light italic"}
      `}>
        {value || "Not provided"}
      </p>
      
      {/* Subtle bottom accent that appears on group hover */}
      <div className="w-4 h-[1px] bg-cyan-500/0 group-hover:bg-cyan-500/30 transition-all duration-500" />
    </div>
  );
}