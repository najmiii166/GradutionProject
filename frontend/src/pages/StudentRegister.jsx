import { useState } from "react";
import { api } from "../api/axios";
import { universities, faculties } from "../constants/systemData";
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

// majors removed in favor of structured `faculties` from systemData

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
  const [selectedUniKey, setSelectedUniKey] = useState(null);
  const [selectedFacultyKey, setSelectedFacultyKey] = useState(null);
  const [selectedLearningGoals, setSelectedLearningGoals] = useState([]);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onUniversitySelect = (e) => {
    const key = e.target.value;
    setSelectedUniKey(key || null);
  };

  const onFacultySelect = (e) => {
    const key = e.target.value || null;
    setSelectedFacultyKey(key);
    setSelectedLearningGoals([]);
  };

  const submit = async (e) => {
    e.preventDefault();

    // require university and faculty to be chosen from list
    if (!selectedUniKey) return setToast('Please select a university from the list');
    if (!selectedFacultyKey) return setToast('Please select a Faculty');

    const data = new FormData();
    data.append('fullName', form.fullName);
    data.append('email', form.email);
    data.append('password', form.password);
    data.append('university', String(selectedUniKey));
    data.append('faculty', selectedFacultyKey || '');
    data.append('semester', form.semester || '');
    // send learning goals as JSON string of keys
    data.append('mentorshipAreas', JSON.stringify(selectedLearningGoals || []));
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
      setSelectedUniKey(null);
      setSelectedFacultyKey(null);
      setSelectedLearningGoals([]);
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
                <select
                  name="university"
                  value={selectedUniKey || ""}
                  onChange={onUniversitySelect}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white/70 pl-10 pr-3 py-2.5 text-sm text-gray-700 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all"
                >
                  <option value="">Select University</option>
                  {universities.map((u) => (
                    <option key={u.key} value={u.key}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Faculty */}
              <div className="relative">
                <BookOpen className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                <select
                  name="faculty"
                  value={selectedFacultyKey || ""}
                  onChange={onFacultySelect}
                  required
                  className="w-full rounded-lg border border-gray-300 bg-white/70 pl-10 pr-3 py-2.5 text-sm text-gray-700 focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all"
                >
                  <option value="">Select Faculty</option>
                  {faculties.map((f) => (
                    <option key={f.key} value={f.key}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Learning Goals (checkboxes based on selected faculty) */}
              <div className="relative">
                {selectedFacultyKey ? (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600">Learning Goals</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {(faculties.find(f => f.key === selectedFacultyKey)?.subs || []).map((sub) => (
                        <label key={sub.key} className="flex items-center gap-2 px-3 py-2 bg-white/70 rounded text-sm text-gray-800">
                          <input
                            type="checkbox"
                            checked={selectedLearningGoals.includes(sub.key)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedLearningGoals((s) => [...s, sub.key]);
                              else setSelectedLearningGoals((s) => s.filter(x => x !== sub.key));
                            }}
                          />
                          <span>{sub.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-400">Choose a Faculty to show learning goals</p>
                )}
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

              {/* old free-text mentorship input removed; learning goals above are used instead */}

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
