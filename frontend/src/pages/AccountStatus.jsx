import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Brand from "../components/Brand";
import ThemeToggle from "../components/ThemeToggle";
import Button from "../components/Button";
import { CheckCircle2, Clock, AlertOctagon } from "lucide-react";

export default function AccountStatus() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const status = (params.get("status") || "pending").toLowerCase();

  const config = {
    pending: {
      title: "Account Pending",
      subtitle:
        "Thanks — your account has been submitted and is awaiting administrative review. You will receive an email notification when the review is complete.",
      icon: <Clock className="w-14 h-14 text-amber-500" />,
      accent: "from-amber-200/20 to-amber-400/10",
    },
    unverified: {
      title: "Account Unverified",
      subtitle:
        "Your account is currently unverified. An administrator will review your information and you’ll receive an email once your account is verified.",
      icon: <AlertOctagon className="w-14 h-14 text-rose-500" />,
      accent: "from-rose-200/20 to-rose-400/10",
    },
  };

  const info = config[status] || config.pending;

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <header className="fixed top-0 w-full z-50 backdrop-blur-md border-b border-border/50">
        <div className="mx-auto max-w-7xl px-8 py-4 flex items-center justify-between">
          <Brand className="opacity-90" />
          <ThemeToggle />
        </div>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl md:max-w-4xl mt-20 md:mt-24"
      >
        <div className="relative rounded-[2.5rem] p-6 md:p-10 border border-border shadow-2xl bg-card/60 overflow-hidden">
          <div className={`hidden md:block absolute -right-24 -top-24 w-[420px] h-[420px] rounded-full bg-gradient-to-br ${info.accent} opacity-30 blur-3xl pointer-events-none`} />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-center">
            <div className="flex items-center justify-center">
              <motion.div animate={{ y: [-6, 0, -6] }} transition={{ duration: 3, repeat: Infinity }} className="rounded-full p-4 md:p-6 bg-foreground/[0.04] shadow-lg md:shadow-xl border border-border flex items-center justify-center">
                <div className="scale-105 md:scale-110">{info.icon}</div>
              </motion.div>
            </div>

            <div className="md:col-span-2">
              <h1 className="text-2xl md:text-4xl font-extralight tracking-tight mb-3 md:mb-4 text-cyan-400">{info.title}</h1>

              <p className="text-base md:text-lg text-foreground/70 mb-5 md:mb-6">{info.subtitle}</p>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <Button onClick={() => navigate('/')} variant="primary">Go to Home</Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
