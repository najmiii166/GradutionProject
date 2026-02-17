import { useState, useEffect } from "react";
import { api, setAuthToken } from "../api/axios";
import Brand from "../components/Brand";
import Button from "../components/Button";
import Toast from "../components/Toast";
import ThemeToggle from "../components/ThemeToggle";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const resetMessage = sessionStorage.getItem("resetSuccess");
    if (resetMessage) {
      setToast(resetMessage);
      sessionStorage.removeItem("resetSuccess");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      const user = data.user || {};
      const role = user.role ?? data.role;
      const status = user.status ?? data.status;
      const fullName = user.fullName ?? data.fullName ?? "Mentor";

      localStorage.setItem("token", data.token);
      if (role) localStorage.setItem("role", role);
      if (status) localStorage.setItem("status", status);
      if (fullName) localStorage.setItem("fullName", fullName);
      if (data.user) localStorage.setItem("user", JSON.stringify(data.user));

      // Keep per-tab auth snapshot so multiple tabs can use different users safely.
      sessionStorage.setItem("token", data.token);
      if (role) sessionStorage.setItem("role", role);
      if (status) sessionStorage.setItem("status", status);
      if (fullName) sessionStorage.setItem("fullName", fullName);
      if (data.user) sessionStorage.setItem("user", JSON.stringify(data.user));

      setAuthToken(data.token);
      setToast("Logged in successfully ✨");

      if (role === "admin") window.location.href = "/admin";
      else if (role === "student")
        window.location.href = status === "verified" ? "/student/dashboard" : "/";
      else if (role === "mentor")
        window.location.href = status === "verified" ? "/mentor/dashboard" : "/";
      else window.location.href = "/";
    } catch (err) {
      console.error("Login error:", err);
      setToast(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground flex items-center justify-center p-6 selection:bg-cyan-500/30">
      
      {/* === NAVBAR === */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-md border-b border-border/50">
        <div className="mx-auto max-w-7xl px-8 py-4 flex items-center justify-between">
          <Brand className="opacity-90" />
          <ThemeToggle />
        </div>
      </header>

      <div className="relative z-10 w-full max-w-md pt-16">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Card Style */}
          <div className="rounded-[2.5rem] bg-card border border-border shadow-2xl p-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-violet-500" />

            <h1 className="text-3xl font-light tracking-tight text-foreground mb-2 text-center">
              Welcome <span className="italic font-serif text-cyan-400">Back.</span>
            </h1>
            <p className="text-sm font-light text-foreground/60 text-center mb-10">
              Expertise meets <span className="font-medium text-foreground/80">Ambition</span>. Sign in to continue.
            </p>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Email input */}
              <div className="relative group">
                <Mail className="absolute left-4 top-3.5 h-4 w-4 text-foreground/20 group-focus-within:text-cyan-400 transition-colors" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-border bg-background px-12 py-3 text-sm text-foreground placeholder-foreground/20 focus:ring-1 focus:ring-cyan-500/50 focus:outline-none transition-all"
                />
              </div>

              {/* Password input */}
              <div className="relative group">
                <Lock className="absolute left-4 top-3.5 h-4 w-4 text-foreground/20 group-focus-within:text-cyan-400 transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-border bg-background px-12 py-3 text-sm text-foreground placeholder-foreground/20 focus:ring-1 focus:ring-cyan-500/50 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-3 text-foreground/20 hover:text-foreground transition"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex justify-end text-sm">
                <a href="/forgot-password" className="text-cyan-400 hover:underline">
                  Forgot password?
                </a>
              </div>

              {/* Using your Global Button Component */}
              <Button
                type="submit"
                loading={loading}
                variant="primary"
                className="w-full shadow-xl group"
              >
                Sign In 
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </form>

            <div className="mt-8 pt-8 border-t border-border/50 text-center">
              <p className="text-sm text-foreground/50 font-light">
                New here?{" "}
                <span className="inline-flex gap-2">
                  <a href="/register/student" className="text-cyan-400 font-medium hover:underline transition-all">
                    Register Student
                  </a>
                  <span className="text-border">|</span>
                  <a href="/register/mentor" className="text-violet-400 font-medium hover:underline transition-all">
                    Mentor
                  </a>
                </span>
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      <Toast
        message={toast}
        onClose={() => setToast(null)}
        type={toast && /successfully|updated/i.test(toast) ? "success" : "error"}
      />
    </div>
  );
}