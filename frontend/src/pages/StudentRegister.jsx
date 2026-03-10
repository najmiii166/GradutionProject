// src/pages/StudentRegister.jsx
import { useMemo, useState } from "react";
import { api, setAuthToken } from "../api/axios";
import { universities, faculties } from "../constants/systemData";
import Brand from "../components/Brand";
import Button from "../components/Button";
import FileDrop from "../components/FileDrop";
import UserAvatarPicker from "../components/UserAvatarPicker";
import Toast from "../components/Toast";
import ThemeToggle from "../components/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Building2,
  BookOpen,
  Layers,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Info
} from "lucide-react";

export default function StudentRegister() {
  const [step, setStep] = useState(1);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    semester: "",
  });
  const [idFile, setIdFile] = useState(null);
  const [profileImageFile, setProfileImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [successModal, setSuccessModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedUniKey, setSelectedUniKey] = useState(null);
  const [selectedFacultyKey, setSelectedFacultyKey] = useState(null);
  const [selectedLearningGoal, setSelectedLearningGoal] = useState("");

  const strongRe = /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}/;
  const isStep1Valid = useMemo(
    () =>
      form.fullName.trim().length > 2 &&
      /^\S+@\S+\.\S+$/.test(form.email) &&
      strongRe.test(form.password),
    [form.fullName, form.email, form.password]
  );

  const update = (e) => {
    const { name, value } = e.target;
    if (name === "semester") {
      // convert to number and clamp between 1 and 10
      let num = parseInt(value, 10);
      if (isNaN(num)) {
        num = "";
      } else {
        if (num < 1) num = 1;
        if (num > 10) num = 10;
      }
      setForm({ ...form, [name]: num });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const onFacultySelect = (e) => {
    const key = e.target.value || null;
    setSelectedFacultyKey(key);
    setSelectedLearningGoal("");
  };

  const nextStep = async (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password) {
      setToast("Please fill in all fields to continue");
      return;
    }
    if (!strongRe.test(form.password)) return; // Logic handled by inline feedback
    setCheckingEmail(true);
    try {
      await api.post("/auth/check-email", { email: form.email, role: "student" });
      setStep(2);
    } catch (err) {
      setToast(err.response?.data?.message || "Email is already in use");
    } finally {
      setCheckingEmail(false);
    }
  };

  const completeAcademicsStep = (e) => {
    e.preventDefault();
    if (!selectedUniKey) return setToast('Please select a university');
    if (!selectedFacultyKey) return setToast('Please select a faculty');
    if (!selectedLearningGoal) return setToast('Please select one learning goal');
    const semesterNumber = Number(form.semester);
    if (!Number.isInteger(semesterNumber) || semesterNumber < 1 || semesterNumber > 10) {
      return setToast('Semester must be a number between 1 and 10');
    }
    if (!idFile) return setToast('Please upload your Student ID');
    setStep(3);
  };

  const persistAuth = (data) => {
    const user = data?.user || {};
    if (!data?.token || !user?._id) return false;

    localStorage.setItem("token", data.token);
    localStorage.setItem("role", user.role || "student");
    localStorage.setItem("status", user.status || "pending");
    if (user.fullName) localStorage.setItem("fullName", user.fullName);
    localStorage.setItem("user", JSON.stringify(user));

    sessionStorage.setItem("token", data.token);
    sessionStorage.setItem("role", user.role || "student");
    sessionStorage.setItem("status", user.status || "pending");
    if (user.fullName) sessionStorage.setItem("fullName", user.fullName);
    sessionStorage.setItem("user", JSON.stringify(user));

    setAuthToken(data.token);
    return true;
  };

  const submit = async (e) => {
    if (e?.preventDefault) e.preventDefault();

    const data = new FormData();
    data.append('fullName', form.fullName);
    data.append('email', form.email);
    data.append('password', form.password);
    data.append('university', String(selectedUniKey));
    data.append('faculty', selectedFacultyKey);
    data.append('semester', form.semester);
    data.append('mentorshipAreas', JSON.stringify(selectedLearningGoal ? [selectedLearningGoal] : []));
    data.append("idCard", idFile);
    if (profileImageFile) {
      data.append("profileImage", profileImageFile);
    }

    setLoading(true);
    try {
      const resp = await api.post("/auth/register/student", data);
      persistAuth(resp.data);
      // Show success modal informing admin will review and email the user
      setSuccessModal(true);
    } catch (err) {
      const resp = err.response?.data;
      setToast(resp?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground flex items-center justify-center p-6 selection:bg-cyan-500/30">
      <header className="fixed top-0 w-full z-50 backdrop-blur-md border-b border-border/50">
        <div className="mx-auto max-w-7xl px-8 py-4 flex items-center justify-between">
          <Brand className="opacity-90" />
          <ThemeToggle />
        </div>
      </header>

      <div className="relative z-10 w-full max-w-xl pt-24 pb-12">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="rounded-[2.5rem] bg-card border border-border shadow-2xl p-8 md:p-12 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-muted">
              <motion.div className="h-full bg-gradient-to-r from-cyan-500 to-violet-500" animate={{ width: `${(step / 3) * 100}%` }} />
            </div>

            <div className="mb-10 flex justify-between items-end">
              <div>
                <h1 className="text-3xl font-light tracking-tight text-foreground">
                  {step === 1 ? "Create " : step === 2 ? "Academic " : "Profile "} 
                  <span className="italic font-serif text-cyan-400">{step === 1 ? "Account." : step === 2 ? "Details." : "Identity."}</span>
                </h1>
                <p className="text-sm font-light text-foreground/60 mt-2">Step {step} of 3 — {step === 1 ? "Credentials" : step === 2 ? "Academics" : "Profile Identity"}</p>
              </div>
              {step > 1 && (
                <button type="button" onClick={() => setStep((s) => Math.max(1, s - 1))} className="text-xs text-foreground/40 hover:text-cyan-400 flex items-center gap-1 transition-colors">
                  <ArrowLeft className="w-3 h-3" /> Back
                </button>
              )}
            </div>

            <form onSubmit={step === 1 ? nextStep : step === 2 ? completeAcademicsStep : submit} className="space-y-5">
              <AnimatePresence mode="wait">
                {step === 1 ? (
                  <motion.div key="s1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-5">
                    <div className="relative group">
                      <User className="absolute left-4 top-3.5 h-4 w-4 text-foreground/20 group-focus-within:text-cyan-400 transition-colors" />
                      <input type="text" name="fullName" placeholder="Full Name" value={form.fullName} onChange={update} required className="w-full rounded-2xl border border-border bg-background px-12 py-3 text-sm focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all" />
                    </div>

                    <div className="relative group">
                      <Mail className="absolute left-4 top-3.5 h-4 w-4 text-foreground/20 group-focus-within:text-cyan-400 transition-colors" />
                      <input type="email" name="email" placeholder="Email Address" value={form.email} onChange={update} required className="w-full rounded-2xl border border-border bg-background px-12 py-3 text-sm focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all" />
                    </div>

                    <div className="space-y-2">
                      <div className="relative group">
                        <Lock className="absolute left-4 top-3.5 h-4 w-4 text-foreground/20 group-focus-within:text-cyan-400 transition-colors" />
                        <input
                          type={showPassword ? "text" : "password"}
                          name="password"
                          placeholder="Password"
                          value={form.password}
                          onChange={update}
                          required
                          className="w-full rounded-2xl border border-border bg-background px-12 py-3 text-sm focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all"
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3 text-foreground/20 hover:text-foreground">
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>

                      {!strongRe.test(form.password) && form.password.length > 0 && (
                        <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-xl border border-primary/10 text-[11px] text-primary/80">
                          <Info className="w-3.5 h-3.5" /> Password must be 8+ chars with mix of cases, numbers & symbols.
                        </div>
                      )}
                    </div>

                    <Button type="submit" variant="primary" className="w-full group shadow-lg" disabled={!isStep1Valid} loading={checkingEmail}>
                      Continue to Academics
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </motion.div>
                ) : step === 2 ? (
                  <motion.div key="s2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-5">
                    <div className="relative group">
                      <Building2 className="absolute left-4 top-3.5 h-4 w-4 text-foreground/20 group-focus-within:text-cyan-400 transition-colors" />
                      <select value={selectedUniKey || ""} onChange={(e) => setSelectedUniKey(e.target.value || null)} required className="w-full rounded-2xl border border-border bg-background px-12 py-3 text-sm focus:ring-1 focus:ring-cyan-500/50 outline-none appearance-none transition-all">
                        <option value="">Select University</option>
                        {universities.map((u) => <option key={u.key} value={u.key}>{u.name}</option>)}
                      </select>
                    </div>

                    <div className="relative group">
                      <BookOpen className="absolute left-4 top-3.5 h-4 w-4 text-foreground/20 group-focus-within:text-cyan-400 transition-colors" />
                      <select value={selectedFacultyKey || ""} onChange={onFacultySelect} required className="w-full rounded-2xl border border-border bg-background px-12 py-3 text-sm focus:ring-1 focus:ring-cyan-500/50 outline-none appearance-none transition-all">
                        <option value="">Select Faculty</option>
                        {faculties.map((f) => <option key={f.key} value={f.key}>{f.name}</option>)}
                      </select>
                    </div>

                    {selectedFacultyKey && (
                      <div className="space-y-3 p-4 rounded-2xl bg-foreground/[0.02] border border-border/50">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-foreground/30 px-1">Learning Goal</p>
                        <div className="grid grid-cols-2 gap-2">
                          {(faculties.find(f => f.key === selectedFacultyKey)?.subs || []).map((sub) => (
                            <label key={sub.key} className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${selectedLearningGoal === sub.key ? 'border-cyan-500/50 bg-cyan-500/[0.03]' : 'border-border bg-background hover:border-cyan-500/30'}`}>
                              <input
                                type="radio"
                                name="learningGoal"
                                className="hidden"
                                checked={selectedLearningGoal === sub.key}
                                onChange={() => setSelectedLearningGoal(sub.key)}
                              />
                              <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${selectedLearningGoal === sub.key ? 'bg-cyan-500 border-cyan-500' : 'border-border'}`}>
                                {selectedLearningGoal === sub.key && <CheckCircle2 className="w-3 h-3 text-white" />}
                              </div>
                              <span className="text-xs text-foreground/70">{sub.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="relative group">
                      <Layers className="absolute left-4 top-3.5 h-4 w-4 text-foreground/20 group-focus-within:text-cyan-400 transition-colors" />
                      <input type="number" min="1" max="10" step="1" name="semester" placeholder="Current Semester (1-10)" value={form.semester} onChange={update} required className="w-full rounded-2xl border border-border bg-background px-12 py-3 text-sm focus:ring-1 focus:ring-cyan-500/50 outline-none transition-all" />
                    </div>

                    <FileDrop
                      label="Student ID Verification"
                      onFile={(file) => {
                        const MAX = 10 * 1024 * 1024;
                        if (file && file.size > MAX) {
                          setToast("Image must be 10MB or smaller");
                          setIdFile(null);
                        } else {
                          setIdFile(file || null);
                        }
                      }}
                    />

                    <Button type="submit" variant="primary" className="w-full shadow-lg">
                      Continue to Profile Identity
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div key="s3" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-5">
                    <UserAvatarPicker
                      label="Step 3: Profile Identity"
                      name={form.fullName}
                      onChange={(file) => setProfileImageFile(file || null)}
                      skipLabel="Skip for now"
                      onSkip={submit}
                    />

                    <Button type="submit" loading={loading} variant="primary" className="w-full shadow-lg">
                      Complete Registration
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>

            <div className="mt-8 pt-8 border-t border-border/50 text-center">
              <p className="text-sm text-foreground/50 font-light">
                Already registered? <a href="/login" className="text-cyan-400 font-medium hover:underline">Sign In</a>
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} type="error" />}

      <AnimatePresence>
        {successModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card border border-border p-8 rounded-[2.5rem] shadow-2xl text-center max-w-sm w-full">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 className="w-8 h-8" /></div>
              <h2 className="text-2xl font-light italic font-serif mb-2">Registration Submitted</h2>
              <p className="text-foreground/60 text-sm mb-6">Your registration is received — an administrator will review your information and you will receive an email update.</p>
              <div className="flex gap-3">
                <button className="flex-1 rounded-xl px-4 py-2 border border-border" onClick={() => { setSuccessModal(false); }}>Stay</button>
                <a href="/" className="flex-[2] rounded-xl px-4 py-2 bg-primary text-white">Go to Home</a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}