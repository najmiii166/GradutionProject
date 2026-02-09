import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Mail, ShieldCheck, ArrowRight, ArrowLeft } from "lucide-react";
import { api } from "../api/axios";
import Brand from "../components/Brand";
import ThemeToggle from "../components/ThemeToggle";
import Button from "../components/Button";
import Toast from "../components/Toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [csrfToken, setCsrfToken] = useState("");

  const fetchCsrf = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/csrf-token", { withCredentials: true });
      const token = data?.csrfToken || "";
      setCsrfToken(token);
      return token;
    } catch (err) {
      console.error("Failed to fetch CSRF token", err);
      return "";
    }
  }, []);

  useEffect(() => {
    fetchCsrf();
  }, [fetchCsrf]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setToast("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      let tokenHeader = csrfToken;
      if (!tokenHeader) tokenHeader = await fetchCsrf();
      
      await api.post(
        "/auth/forgot-password",
        { email },
        { headers: { "X-CSRF-Token": tokenHeader } }
      );
      
      setToast("Check your inbox! We've sent a secure link if your email exists.");
      setEmail("");
    } catch (err) {
      // Security best practice: same message even on error
      setToast("Check your inbox! We've sent a secure link if your email exists.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground flex items-center justify-center p-6 selection:bg-cyan-500/30 overflow-hidden">
      
      {/* === NAVBAR === */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-md border-b border-border/50">
        <div className="mx-auto max-w-7xl px-8 py-4 flex items-center justify-between">
          <Brand className="opacity-90" />
          <ThemeToggle />
        </div>
      </header>

      <div className="relative z-10 w-full max-w-md pt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="rounded-[2.5rem] bg-card border border-border shadow-2xl p-8 md:p-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-violet-500" />

            <div className="flex flex-col items-center mb-8">
               <div className="p-2.5 rounded-2xl bg-cyan-500/10 mb-3">
                 <ShieldCheck className="w-7 h-7 text-cyan-400" />
               </div>
               <h1 className="text-2xl font-light tracking-tight text-center">
                 Recover <span className="italic font-serif text-cyan-400">Access.</span>
               </h1>
               <p className="text-[11px] font-light text-foreground/50 text-center mt-2 px-4 leading-relaxed">
                 Enter your email and we'll send a secure link to reset your password.
               </p>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-foreground/40 font-bold ml-1">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-3 h-4 w-4 text-foreground/20 group-focus-within:text-cyan-400 transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@university.edu"
                    required
                    className="w-full rounded-2xl border border-border bg-background px-11 py-2.5 text-sm text-foreground placeholder-foreground/20 focus:ring-1 focus:ring-cyan-500/50 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <Button
                type="submit"
                loading={loading}
                variant="primary"
                className="w-full group mt-2 shadow-lg shadow-cyan-500/10"
              >
                Get Recovery Link
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-border/50 flex flex-col items-center gap-4">
               <a 
                 href="/login" 
                 className="flex items-center gap-2 text-xs text-foreground/40 hover:text-cyan-400 transition-colors group"
                >
                 <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                 Back to login
               </a>
               <p className="text-[10px] text-foreground/20 font-light text-center px-4 leading-tight">
                 For security, reset links expire after 20 minutes.
               </p>
            </div>
          </div>
        </motion.div>
      </div>

      <Toast
        message={toast}
        onClose={() => setToast(null)}
        type={toast && /inbox|secure link/i.test(toast) ? "success" : "error"}
      />
    </div>
  );
}