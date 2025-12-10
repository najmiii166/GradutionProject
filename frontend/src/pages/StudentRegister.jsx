import { useState } from "react";
import { api } from "../api/axios";
import Brand from "../components/Brand";
import Select from "../components/Select";
import Button from "../components/Button";
import FileDrop from "../components/FileDrop";
import Toast from "../components/Toast";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
  BookOpen,
  Layers,
  ClipboardList,
} from "lucide-react";

const majors = [
  "Computer Science",
  "Engineering",
  "Business",
  "Medicine",
  "Agriculture",
  "Law",
  "Arts",
].map((m) => ({ value: m, label: m }));

export default function StudentRegister() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    university: "",
    major: "",
    semester: "",
    mentorshipAreas: "",
  });
  const [idFile, setIdFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [successModal, setSuccessModal] = useState(false);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => data.append(k, v));
    if (idFile) data.append("idCard", idFile);

    setLoading(true);

    try {
      await api.post("/auth/register/student", data);
      setSuccessModal(true);
      setForm({
        fullName: "",
        email: "",
        password: "",
        university: "",
        major: "",
        semester: "",
        mentorshipAreas: "",
      });
      setIdFile(null);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        "Registration failed";
      setToast(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center overflow-hidden">
      {/* Floating gradient blobs */}
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
              Student Registration 🎓
            </h1>
            <p className="text-sm text-gray-600 text-center mb-8">
              Create your account to request mentorship.
            </p>

            <form className="space-y-4" onSubmit={submit}>
              {/* Full Name */}
              <div className="relative">
                <User className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  name="fullName"
                  placeholder="Full Name"
                  value={form.fullName}
                  onChange={update}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white/70 pl-10 pr-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all"
                />
              </div>

              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={update}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white/70 pl-10 pr-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all"
                />
              </div>

              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={form.password}
                  onChange={update}
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

              {/* University */}
              <div className="relative">
                <Building2 className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  name="university"
                  placeholder="University"
                  value={form.university}
                  onChange={update}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white/70 pl-10 pr-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all"
                />
              </div>

              {/* Major */}
              <div className="relative">
                <BookOpen className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                <select
                  name="major"
                  value={form.major}
                  onChange={update}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white/70 pl-10 pr-3 py-2.5 text-sm text-gray-700 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all"
                >
                  <option value="">Select Major</option>
                  {majors.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Semester */}
              <div className="relative">
                <Layers className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  name="semester"
                  placeholder="Semester (e.g. 5 )"
                  value={form.semester}
                  onChange={update}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white/70 pl-10 pr-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all"
                />
              </div>

              {/* Mentorship Areas */}
              <div className="relative">
                <ClipboardList className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  name="mentorshipAreas"
                  placeholder="Mentorship areas (comma separated)"
                  value={form.mentorshipAreas}
                  onChange={update}
                  className="w-full rounded-lg border border-gray-300 bg-white/70 pl-10 pr-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all"
                />
              </div>

              {/* File upload */}
              <FileDrop label="Student ID Card" onFile={setIdFile} />

              <Button
                type="submit"
                loading={loading}
                className="w-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 py-2.5 text-white font-semibold shadow-md hover:shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all duration-300"
              >
                Create account
              </Button>
            </form>

            <p className="mt-6 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <a href="/login" className="text-blue-600 font-medium hover:underline">
                Login
              </a>
            </p>
          </div>
        </motion.div>
      </div>

      <Toast
        message={toast}
        onClose={() => setToast(null)}
        type={toast?.includes("Registered") ? "success" : "error"}
      />

      {/* Success Modal */}
      {successModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white/90 p-6 rounded-2xl shadow-2xl text-center max-w-sm w-full border border-blue-100"
          >
            <h2 className="text-xl font-bold mb-2 text-gray-800">
              🎉 Registration Successful!
            </h2>
            <p className="text-gray-600 text-sm mb-5 leading-relaxed">
              Your account has been created and is awaiting admin approval.
              <br />
              You will receive an email once verified.
            </p>
            <Button
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold"
              onClick={() => {
                setSuccessModal(false);
                window.location.href = "/";
              }}
            >
              OK
            </Button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
