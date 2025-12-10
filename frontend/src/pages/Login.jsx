import { useState } from "react";
import { api, setAuthToken } from "../api/axios";
import Brand from "../components/Brand";
import Button from "../components/Button";
import Toast from "../components/Toast";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

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

      setAuthToken(data.token);
      setToast("Logged in successfully ✨");

      if (role === "admin") window.location.href = "/admin";
      else if (role === "student")
        window.location.href =
          status === "verified" ? "/student/dashboard" : "/";
      else if (role === "mentor")
        window.location.href =
          status === "verified" ? "/mentor/dashboard" : "/";
      else window.location.href = "/";
    } catch (err) {
      console.error("Login error:", err);
      setToast(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center overflow-hidden">
      {/* === Floating Background Blobs === */}
      <motion.div
        className="absolute top-0 left-[-100px] h-[300px] w-[300px] bg-blue-400/30 blur-[100px] rounded-full"
        animate={{ y: [0, 30, 0] }}
        transition={{ repeat: Infinity, duration: 8, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-0 right-[-100px] h-[300px] w-[300px] bg-indigo-400/30 blur-[100px] rounded-full"
        animate={{ y: [0, -30, 0] }}
        transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
      />

      <div className="relative z-10 w-full max-w-md px-6 sm:px-0">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-8 text-center">
            <Brand />
          </div>

          <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-slate-200 shadow-xl p-8">
            <h1 className="text-2xl font-bold text-gray-800 mb-1 text-center">
              Welcome back 👋
            </h1>
            <p className="text-sm text-gray-600 text-center mb-8">
              Sign in to continue to MentorLink.
            </p>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {/* Email input */}
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white/70 pl-10 pr-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all"
                />
              </div>

              {/* Password input */}
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white/70 pl-10 pr-10 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Login button */}
              <Button
                type="submit"
                loading={loading}
                className="w-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 py-2.5 text-white font-semibold shadow-md hover:shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all duration-300"
              >
                Login
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              New here?{" "}
              <a
                href="/register/student"
                className="text-blue-600 font-medium hover:underline"
              >
                Register as Student
              </a>{" "}
              or{" "}
              <a
                href="/register/mentor"
                className="text-blue-600 font-medium hover:underline"
              >
                Mentor
              </a>
            </p>
          </div>
        </motion.div>
      </div>

      <Toast
        message={toast}
        onClose={() => setToast(null)}
        type={toast?.includes("successfully") ? "success" : "error"}
      />
    </div>
  );
}
