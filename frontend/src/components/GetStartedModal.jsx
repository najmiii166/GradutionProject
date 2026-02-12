import { motion } from "framer-motion";

export default function GetStartedModal({ onClose }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="join-heading"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-card border border-border rounded-[2.5rem] p-12 text-center shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-violet-500" />
        <h2 id="join-heading" className="text-3xl font-light text-foreground mb-2">
          Join MentorLink
        </h2>
        <p className="text-foreground text-sm mb-10 font-light leading-relaxed">
          Select your role to begin. Your profile will be submitted to admins for verification.
        </p>
        <div className="space-y-4">
          <button
            onClick={() => (window.location.href = "/register/student")}
            className="w-full py-4 rounded-2xl bg-foreground text-background font-bold hover:opacity-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Student Registration
          </button>
          <button
            onClick={() => (window.location.href = "/register/mentor")}
            className="w-full py-4 rounded-2xl bg-card border border-border text-foreground font-bold hover:opacity-95 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            Mentor Registration
          </button>
        </div>
        <button
          onClick={onClose}
          className="mt-8 text-[10px] text-foreground uppercase tracking-[0.2em] hover:opacity-90 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Return
        </button>
      </motion.div>
    </div>
  );
}
