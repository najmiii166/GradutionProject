import { useState } from "react";
import { api } from "../api/axios";
import { universities, faculties } from "../constants/systemData";
import Brand from "../components/Brand";
import Button from "../components/Button";
import FileDrop from "../components/FileDrop";
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
  ArrowLeft
} from "lucide-react";

export default function StudentRegister() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    semester: "",
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

  // --- ADDED THIS FUNCTION BACK ---
  const onFacultySelect = (e) => {
    const key = e.target.value || null;
    setSelectedFacultyKey(key);
    setSelectedLearningGoals([]); // Reset goals if faculty changes
  };

  const nextStep = (e) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password) {
      setToast("Please fill in all fields to continue");
      return;
    }
    setStep(2);
  };

  const prevStep = () => setStep(1);

  const submit = async (e) => {
    e.preventDefault();
    if (!selectedUniKey) return setToast('Please select a university');
    if (!selectedFacultyKey) return setToast('Please select a Faculty');
    if (!idFile) return setToast('Please upload your Student ID');

    const data = new FormData();
    data.append('fullName', form.fullName);
    data.append('email', form.email);
    data.append('password', form.password);
    data.append('university', String(selectedUniKey));
    data.append('faculty', selectedFacultyKey || '');
    data.append('semester', form.semester || '');
    data.append('mentorshipAreas', JSON.stringify(selectedLearningGoals || []));
    if (idFile) data.append("idCard", idFile);

    setLoading(true);
    try {
      await api.post("/auth/register/student", data);
      setSuccessModal(true);
    } catch (err) {
      setToast(err.response?.data?.message || "Registration failed");
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
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="rounded-[2.5rem] bg-card border border-border shadow-2xl p-8 md:p-12 relative overflow-hidden">
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 w-full h-1 bg-muted">
                <motion.div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-violet-500" 
                    animate={{ width: step === 1 ? "50%" : "100%" }}
                    transition={{ duration: 0.5 }}
                />
            </div>

            <div className="mb-10 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-light tracking-tight text-foreground">
                        {step === 1 ? "Create " : "Final "} 
                        <span className="italic font-serif text-cyan-400">{step === 1 ? "Account." : "Details."}</span>
                    </h1>
                    <p className="text-sm font-light text-foreground/60 mt-2">
                        Step {step} of 2 — {step === 1 ? "Basic Information" : "Academic Verification"}
                    </p>
                </div>
                {step === 2 && (
                    <button 
                      type="button" 
                      onClick={prevStep} 
                      className="text-xs text-foreground/40 hover:text-cyan-400 flex items-center gap-1 transition-colors"
                    >
                        <ArrowLeft className="w-3 h-3" /> Back
                    </button>
                )}
            </div>

            <form onSubmit={step === 1 ? nextStep : submit} className="space-y-5">
              <AnimatePresence mode="wait">
                {step === 1 ? (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                  >
                    <div className="relative group">
                      <User className="absolute left-4 top-3.5 h-4 w-4 text-foreground/20 group-focus-within:text-cyan-400 transition-colors" />
                      <input
                        type="text"
                        name="fullName"
                        placeholder="Full Name"
                        value={form.fullName}
                        onChange={update}
                        required
                        className="w-full rounded-2xl border border-border bg-background px-12 py-3 text-sm text-foreground focus:ring-1 focus:ring-cyan-500/50 focus:outline-none transition-all"
                      />
                    </div>

                    <div className="relative group">
                      <Mail className="absolute left-4 top-3.5 h-4 w-4 text-foreground/20 group-focus-within:text-cyan-400 transition-colors" />
                      <input
                        type="email"
                        name="email"
                        placeholder="Email Address"
                        value={form.email}
                        onChange={update}
                        required
                        className="w-full rounded-2xl border border-border bg-background px-12 py-3 text-sm text-foreground focus:ring-1 focus:ring-cyan-500/50 focus:outline-none transition-all"
                      />
                    </div>

                    <div className="relative group">
                      <Lock className="absolute left-4 top-3.5 h-4 w-4 text-foreground/20 group-focus-within:text-cyan-400 transition-colors" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="Create Password"
                        value={form.password}
                        onChange={update}
                        required
                        className="w-full rounded-2xl border border-border bg-background px-12 py-3 text-sm text-foreground focus:ring-1 focus:ring-cyan-500/50 focus:outline-none transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-3 text-foreground/20 hover:text-foreground transition"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    <Button type="submit" variant="primary" className="w-full group shadow-lg">
                      Continue to Academics
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-5"
                  >
                    {/* University */}
                    <div className="relative group">
                      <Building2 className="absolute left-4 top-3.5 h-4 w-4 text-foreground/20 group-focus-within:text-cyan-400 transition-colors" />
                      <select
                        value={selectedUniKey || ""}
                        onChange={(e) => setSelectedUniKey(e.target.value || null)}
                        required
                        className="w-full rounded-2xl border border-border bg-background px-12 py-3 text-sm text-foreground focus:ring-1 focus:ring-cyan-500/50 focus:outline-none appearance-none transition-all"
                      >
                        <option value="">Select University</option>
                        {universities.map((u) => <option key={u.key} value={u.key}>{u.name}</option>)}
                      </select>
                    </div>

                    {/* Faculty */}
                    <div className="relative group">
                      <BookOpen className="absolute left-4 top-3.5 h-4 w-4 text-foreground/20 group-focus-within:text-cyan-400 transition-colors" />
                      <select
                        value={selectedFacultyKey || ""}
                        onChange={onFacultySelect}
                        required
                        className="w-full rounded-2xl border border-border bg-background px-12 py-3 text-sm text-foreground focus:ring-1 focus:ring-cyan-500/50 focus:outline-none appearance-none transition-all"
                      >
                        <option value="">Select Faculty</option>
                        {faculties.map((f) => <option key={f.key} value={f.key}>{f.name}</option>)}
                      </select>
                    </div>

                    {/* Learning Goals (Dynamic Checkboxes) */}
                    {selectedFacultyKey && (
                      <div className="space-y-3 p-4 rounded-2xl bg-foreground/[0.02] border border-border/50">
                        <p className="text-xs font-medium uppercase tracking-widest text-foreground/40 px-1">Learning Goals</p>
                        <div className="grid grid-cols-2 gap-2">
                          {(faculties.find(f => f.key === selectedFacultyKey)?.subs || []).map((sub) => (
                            <label key={sub.key} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background cursor-pointer hover:border-cyan-500/50 transition-all group">
                              <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-border text-cyan-500 focus:ring-cyan-500/20"
                                checked={selectedLearningGoals.includes(sub.key)}
                                onChange={(e) => {
                                  if (e.target.checked) setSelectedLearningGoals((s) => [...s, sub.key]);
                                  else setSelectedLearningGoals((s) => s.filter(x => x !== sub.key));
                                }}
                              />
                              <span className="text-xs text-foreground/70 group-hover:text-foreground transition-colors">{sub.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="relative group">
                      <Layers className="absolute left-4 top-3.5 h-4 w-4 text-foreground/20 group-focus-within:text-cyan-400 transition-colors" />
                      <input
                        type="text"
                        name="semester"
                        placeholder="Current Semester (e.g. 5)"
                        value={form.semester}
                        onChange={update}
                        required
                        className="w-full rounded-2xl border border-border bg-background px-12 py-3 text-sm text-foreground focus:ring-1 focus:ring-cyan-500/50 focus:outline-none transition-all"
                      />
                    </div>

                    <FileDrop label="Student ID Verification" onFile={setIdFile} />

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

      {/* Render Toast if message exists */}
      {toast && <Toast message={toast} onClose={() => setToast(null)} type="error" />}

      {/* Success Modal */}
      <AnimatePresence>
        {successModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              className="relative bg-card border border-border p-8 rounded-[2.5rem] shadow-2xl text-center max-w-sm w-full"
            >
              <div className="w-16 h-16 bg-cyan-500/10 text-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-light mb-3 text-foreground italic font-serif">Success.</h2>
              <p className="text-foreground/60 text-sm mb-8 leading-relaxed font-light">
                Your profile has been submitted for review. Look out for an email soon.
              </p>
              <Button className="w-full" onClick={() => window.location.href = "/"}>Back to Home</Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}