import { useState, useEffect, useMemo, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Shield, Eye, EyeOff, ArrowRight, Info, CheckCircle2 } from "lucide-react";
import { api } from "../api/axios";
import Brand from "../components/Brand";
import ThemeToggle from "../components/ThemeToggle";
import Button from "../components/Button";
import Toast from "../components/Toast";

const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default function ResetPassword() {
  const { search } = useLocation();
  const token = useMemo(() => new URLSearchParams(search).get("token"), [search]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Independent visibility states
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [csrfToken, setCsrfToken] = useState("");
  const [isTokenMissing, setIsTokenMissing] = useState(false);

  const isPasswordValid = useMemo(() => strongPasswordRegex.test(password), [password]);
  const doPasswordsMatch = useMemo(() => password === confirmPassword && confirmPassword !== "", [password, confirmPassword]);
  const canSubmit = useMemo(() => isPasswordValid && doPasswordsMatch && !isTokenMissing, [isPasswordValid, doPasswordsMatch, isTokenMissing]);

  const fetchCsrf = useCallback(async () => {
    try {
      const { data } = await api.get("/auth/csrf-token", { withCredentials: true });
      const tokenValue = data?.csrfToken || "";
      setCsrfToken(tokenValue);
      return tokenValue;
    } catch (err) {
      console.error("Failed to fetch CSRF token", err);
      return "";
    }
  }, []);

  useEffect(() => {
    fetchCsrf();
  }, [fetchCsrf]);

  useEffect(() => {
    if (!token) {
      setIsTokenMissing(true);
      setToast("Reset link is invalid or expired.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    try {
      let tokenHeader = csrfToken;
      if (!tokenHeader) tokenHeader = await fetchCsrf();
      await api.post(
        "/auth/reset-password",
        { token, password },
        { headers: { "X-CSRF-Token": tokenHeader } }
      );

      sessionStorage.setItem("resetSuccess", "Your password has been updated. ✨");
      setToast("Password updated. Redirecting...");
      setTimeout(() => { window.location.href = "/login"; }, 1400);
    } catch (err) {
      setToast(err.response?.data?.message || "Reset link is invalid or expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground flex items-center justify-center p-6 overflow-hidden">
      <header className="fixed top-0 w-full z-50 backdrop-blur-md border-b border-border/50">
        <div className="mx-auto max-w-7xl px-8 py-4 flex items-center justify-between">
          <Brand className="opacity-90" />
          <ThemeToggle />
        </div>
      </header>

      <div className="relative z-10 w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="rounded-[2.5rem] bg-card border border-border shadow-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-violet-500" />

            <div className="flex flex-col items-center mb-6">
               <div className="p-2.5 rounded-2xl bg-cyan-500/10 mb-3">
                 <Shield className="w-7 h-7 text-cyan-400" />
               </div>
               <h1 className="text-2xl font-light tracking-tight text-center">
                 Secure your <span className="italic font-serif text-cyan-400">Account.</span>
               </h1>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {/* New Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-foreground/40 font-bold ml-1">New Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-3 h-4 w-4 text-foreground/20 group-focus-within:text-cyan-400 transition-colors" />
                  <input
                    type={showPass ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-border bg-background px-11 py-2.5 text-sm focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all"
                  />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-3 text-foreground/20 hover:text-foreground">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                
                <AnimatePresence>
                  {!isPasswordValid && password.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-1.5 px-2 text-[10px] text-cyan-500/80">
                      <Info size={12} className="shrink-0" />
                      <span>8+ characters with uppercase, lowercase, numbers, and symbols. </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-foreground/40 font-bold ml-1">Confirm</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-3 h-4 w-4 text-foreground/20 group-focus-within:text-cyan-400 transition-colors" />
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-2xl border border-border bg-background px-11 py-2.5 text-sm focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-3 text-foreground/20 hover:text-foreground">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {doPasswordsMatch && isPasswordValid && (
                   <div className="flex items-center gap-1 px-2 text-[10px] text-emerald-400 font-medium">
                     <CheckCircle2 size={12} /> Ready to update.
                   </div>
                )}
              </div>

              <Button
                type="submit"
                loading={loading}
                disabled={!canSubmit}
                variant="primary"
                className={`w-full group mt-2 py-3 ${!canSubmit ? 'opacity-40 grayscale' : 'shadow-lg shadow-cyan-500/20'}`}
              >
                Update Password
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>

            <p className="mt-6 text-[10px] text-foreground/30 font-light text-center">
              Identity verification required after update.
            </p>
          </div>
        </motion.div>
      </div>

      <Toast message={toast} onClose={() => setToast(null)} type={toast?.includes("updated") ? "success" : "error"} />
    </div>
  );
}