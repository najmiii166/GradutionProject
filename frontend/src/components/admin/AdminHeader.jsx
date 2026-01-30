// frontend/src/components/admin/AdminHeader.jsx
import { motion } from "framer-motion";

export default function AdminHeader({ activePage }) {
  const getPageData = () => {
    switch (activePage) {
      case "overview":
        return {
          title: "Platform",
          highlight: "Overview.",
          subtitle: "Summary of analytics and platform statistics.",
        };
      case "pending":
        return {
          title: "Awaiting",
          highlight: "Approval.",
          subtitle: "Review student and mentor account requests.",
        };
      case "reports":
        return {
          title: "System",
          highlight: "Reports.",
          subtitle: "Analyze performance and feedback data.",
        };
      case "users":
        return {
          title: "User",
          highlight: "Management.",
          subtitle: "Manage and monitor all platform participants.",
        };
      default:
        return { title: "Admin", highlight: "Panel.", subtitle: "" };
    }
  };

  const { title, highlight, subtitle } = getPageData();

  return (
    <header className="sticky top-0 z-40 w-full px-8 py-6 bg-background/60 backdrop-blur-xl border-b border-border/50">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <motion.div
          key={activePage}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {/* Subtle Breadcrumb Label */}
          <span className="text-[10px] uppercase tracking-[0.3em] text-cyan-500 font-bold mb-1 block">
            Dashboard / {activePage}
          </span>

          {/* Main Title with your signature serif style */}
          <h1 className="text-2xl md:text-3xl font-light tracking-tight text-foreground">
            {title} <span className="italic font-serif text-cyan-500/80">{highlight}</span>
          </h1>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-sm font-light text-foreground/40 mt-1 max-w-2xl">
              {subtitle}
            </p>
          )}
        </motion.div>

        {/* Optional: Add a localized date or quick action here later */}
        <div className="hidden md:block">
           <div className="px-4 py-2 rounded-2xl bg-foreground/[0.03] border border-border/50 text-[11px] font-medium text-foreground/50 tracking-widest uppercase">
             {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
           </div>
        </div>
      </div>
    </header>
  );
}