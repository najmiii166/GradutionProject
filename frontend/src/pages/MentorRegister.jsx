// src/pages/MentorRegister.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/axios";
import Brand from "../components/Brand";
import Button from "../components/Button";
import Toast from "../components/Toast";
import { motion } from "framer-motion";

import {
  User,
  Mail,
  Lock,
  Building2,
  BookMarked,
  Briefcase,
  PenLine,
  BadgeCheck,
  CalendarDays,
  Eye,
  EyeOff,
} from "lucide-react";

// Strong Password regex
const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default function MentorRegister() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    institution: "",
    faculty: "",
    department: "",
    yearsOfExperience: "",
    bio: "",
    expertiseAreas: "",
    university: "",
  });

  const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const [availability, setAvailability] = useState(
    DAYS.map((d) => ({
      day: d,
      available: false,
      from: "09:00",
      to: "17:00",
    }))
  );

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const navigate = useNavigate();

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const toggleDay = (day) => {
    setAvailability((a) =>
      a.map((it) => (it.day === day ? { ...it, available: !it.available } : it))
    );
  };

  const setDayFrom = (day, value) => {
    setAvailability((a) =>
      a.map((it) => (it.day === day ? { ...it, from: value } : it))
    );
  };

  const setDayTo = (day, value) => {
    setAvailability((a) =>
      a.map((it) => (it.day === day ? { ...it, to: value } : it))
    );
  };

  const submit = async (e) => {
    e.preventDefault();
    const required = [
      "fullName",
      "email",
      "password",
      "institution",
      "faculty",
      "department",
    ];

    const missing = required.find((k) => !String(form[k] || "").trim());
    if (missing) return setToast(`Please fill the required field: ${missing}`);

    if (!strongPasswordRegex.test(form.password))
      return setToast(
        "Password must be 8+ chars and include upper, lower, number & symbol"
      );

    setLoading(true);

    try {
      const payload = {
        ...form,
        yearsOfExperience: Number(form.yearsOfExperience || 0),
        expertiseAreas: form.expertiseAreas
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        availability: availability
          .filter((d) => d.available)
          .map(({ day, from, to }) => ({ day, from, to })),
      };

      await api.post("/auth/register/mentor", payload);

      setSuccessModal(true);
      setForm({
        fullName: "",
        email: "",
        password: "",
        institution: "",
        faculty: "",
        department: "",
        yearsOfExperience: "",
        bio: "",
        expertiseAreas: "",
        university: "",
      });
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
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center overflow-hidden p-6">

      {/* Animated gradient blobs */}
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

      {/* Card Wrapper */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-xl"
      >
        <Brand className="mb-5 text-center" />
        <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-slate-200 shadow-xl p-8">
          <h1 className="text-2xl font-bold text-gray-800 mb-1 text-center">
            Mentor Registration 🧑‍🏫
          </h1>
          <p className="text-sm text-gray-600 text-center mb-8">
            Join as a mentor to support students.
          </p>

          {/* FORM */}
          <form className="space-y-4" onSubmit={submit}>
            {/* ICON INPUT COMPONENTS */}
            {[
              { icon: User, name: "fullName", placeholder: "Full Name" },
              { icon: Mail, name: "email", type: "email", placeholder: "Email address" },
              { icon: Building2, name: "institution", placeholder: "Institution" },
              { icon: BookMarked, name: "faculty", placeholder: "Faculty" },
              { icon: PenLine, name: "department", placeholder: "Department" },
              { icon: Briefcase, name: "yearsOfExperience", type: "number", placeholder: "Years of Experience" },
              { icon: BadgeCheck, name: "university", placeholder: "University (optional)" },
            ].map((f, i) => (
              <div className="relative" key={i}>
                <f.icon className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                <input
                  type={f.type || "text"}
                  name={f.name}
                  placeholder={f.placeholder}
                  value={form[f.name]}
                  onChange={update}
                  required={i < 5}
                  className="w-full rounded-lg border border-gray-300 bg-white/70 pl-10 pr-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:outline-none"
                />
              </div>
            ))}

            {/* PASSWORD */}
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={form.password}
                onChange={update}
                required
                className="w-full rounded-lg border border-gray-300 bg-white/70 pl-10 pr-10 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {/* BIO */}
            <textarea
              name="bio"
              placeholder="Short Bio"
              value={form.bio}
              onChange={update}
              className="w-full rounded-lg border border-gray-300 bg-white/70 p-3 text-sm text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-400"
            />

            {/* EXPERTISE */}
            <input
              type="text"
              name="expertiseAreas"
              placeholder="Expertise areas (comma separated)"
              value={form.expertiseAreas}
              onChange={update}
              className="w-full rounded-lg border border-gray-300 bg-white/70 p-3 text-sm text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-400"
            />

            {/* AVAILABILITY SECTION */}
            <div className="mt-6">
              <p className="text-sm font-semibold flex items-center gap-2 mb-3">
                <CalendarDays className="h-4 w-4 text-blue-600" /> Availability
              </p>

              <div className="grid grid-cols-7 gap-2 mb-4">
                {availability.map((d) => (
                  <button
                    type="button"
                    key={d.day}
                    onClick={() => toggleDay(d.day)}
                    className={`px-3 py-1 rounded-md text-center text-sm font-medium transition ${
                      d.available
                        ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md"
                        : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                    }`}
                  >
                    {d.day}
                  </button>
                ))}
              </div>

              {/* Time selector if available */}
              {availability.some((d) => d.available) && (
                <div className="space-y-2">
                  {availability
                    .filter((d) => d.available)
                    .map((d) => (
                      <div key={d.day} className="flex items-center justify-between bg-white/70 border rounded-lg p-3 shadow-sm">
                        <span className="font-medium text-sm">{d.day}</span>
                        <div className="flex items-center gap-2">
                          <input type="time" value={d.from} onChange={(e) => setDayFrom(d.day, e.target.value)} className="border rounded p-1" />
                          <span className="text-xs text-gray-500">to</span>
                          <input type="time" value={d.to} onChange={(e) => setDayTo(d.day, e.target.value)} className="border rounded p-1" />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* SUBMIT BUTTON */}
            <Button
              type="submit"
              loading={loading}
              className="w-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 py-2.5 text-white font-semibold shadow-md hover:shadow-[0_0_15px_rgba(37,99,235,0.4)] transition-all"
            >
              Create mentor account
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

      <Toast message={toast} onClose={() => setToast(null)} />

      {/* SUCCESS MODAL */}
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
            <p className="text-gray-600 text-sm mb-5">
              Your mentor account was created successfully.
              <br /> Admin will verify soon.
            </p>

            <Button
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white font-semibold"
              onClick={() => {
                setSuccessModal(false);
                navigate("/");
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
