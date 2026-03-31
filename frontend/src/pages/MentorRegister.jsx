//frontend/src/pages/MentorRegister.jsx
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { api, setAuthToken } from "../api/axios";
import { universities, faculties, DAYS } from "../constants/systemData";
import Brand from "../components/Brand";
import Button from "../components/Button";
import UserAvatarPicker from "../components/UserAvatarPicker";
import Toast from "../components/Toast";
import ThemeToggle from "../components/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";

import {
  User,
  Mail,
  Lock,
  Building2,
  BookMarked,
  Briefcase,
  CalendarDays,
  Eye,
  EyeOff,
  Info,
  ArrowRight,
  CheckCircle2,
  Globe,
  Linkedin,
  Twitter,
  Facebook,
  FileText,
} from "lucide-react";

const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const fullNameRegex = /^[A-Za-z]+(?:[ '\-][A-Za-z]+)*$/;
const urlPatterns = {
  linkedin: /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?$/,
  x: /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]+\/?$/,
  facebook: /^(https?:\/\/)?(www\.)?facebook\.com\/[a-zA-Z0-9.]+\/?$/,
};

const format12h = (time) => {
  const [rawHour = "0", rawMinute = "0"] = time.split(":");
  const hour = Number(rawHour);
  const minute = Number(rawMinute);
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  const paddedMinute = minute.toString().padStart(2, "0");
  return `${displayHour}:${paddedMinute} ${period}`;
};

export default function MentorRegister() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailValidationError, setEmailValidationError] = useState("");
  const [fullNameValidationError, setFullNameValidationError] = useState("");
  const [bioValidationError, setBioValidationError] = useState("");
  const [toast, setToast] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [successModal, setSuccessModal] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    institution: "",
    faculty: "",
    yearsOfExperience: "",
    bio: "",
  });

  const [selectedFacultyKey, setSelectedFacultyKey] = useState(null);
  const [selectedInstitutionKey, setSelectedInstitutionKey] = useState(null);
  const [selectedSubAreas, setSelectedSubAreas] = useState([]);
  const [socialLinks, setSocialLinks] = useState({ linkedin: '', website: '', x: '', facebook: '' });
  const [profileImageFile, setProfileImageFile] = useState(null);
  
  const [skipAvailability, setSkipAvailability] = useState(false);
  
  const [availability, setAvailability] = useState(
    DAYS.map((d) => ({ day: d.key, slots: [] }))
  );
  const [newSlot, setNewSlot] = useState({ day: DAYS[0].key, from: "09:00", to: "10:00" });

  const update = (e) => {
    const { name, value } = e.target;
    if (name === "email" && emailValidationError) {
      setEmailValidationError("");
    }
    if (name === "fullName") {
      if (value.trim() === "") {
        setFullNameValidationError("Full name is required.");
      } else if (!fullNameRegex.test(value.trim())) {
        setFullNameValidationError("Name may only contain letters, spaces, hyphens, and apostrophes.");
      } else {
        setFullNameValidationError("");
      }
    }
    if (name === "yearsOfExperience") {
      if (value.trim() === "") {
        setForm({ ...form, [name]: "" });
        return;
      }

      const num = Number(value);
      if (Number.isNaN(num)) {
        // ignore invalid numeric input, keep existing value
        return;
      }

      if (num < 1) {
        setForm({ ...form, [name]: "1" });
        return;
      }

      setForm({ ...form, [name]: String(Math.floor(num)) });
      return;
    }

    if (name === "bio") {
      const trimmed = value.trim();
      if (trimmed.length === 0) {
        setBioValidationError("Professional bio is required.");
      } else if (trimmed.length < 15) {
        setBioValidationError("Bio must be at least 15 characters.");
      } else {
        setBioValidationError("");
      }
    }

    setForm({ ...form, [name]: value });
  };

  // Step 1 Validation & Email Check
  const isStep1Valid = useMemo(() => {
    const isFullNameValid = fullNameRegex.test(form.fullName.trim());
    return (
      isFullNameValid &&
      /^\S+@\S+\.\S+$/.test(form.email) &&
      strongPasswordRegex.test(form.password)
    );
  }, [form]);

  const handleStep1Submit = async () => {
    const isFullNameValid = fullNameRegex.test(form.fullName.trim());
    if (!isFullNameValid) {
      setFullNameValidationError("Name may only contain letters, spaces, hyphens, and apostrophes.");
      setToast("Please fix your full name before continuing");
      return;
    }
    setEmailValidationError("");
    setCheckingEmail(true);
    try {
      // Check if email exists
      await api.post("/auth/check-email", { email: form.email, role: "mentor" });
      setStep(2);
    } catch (err) {
      if (!err.response) {
        setEmailValidationError("Unable to validate email. Please ensure your backend is running and CORS permits http://localhost:5174.");
        setToast("Network or CORS error while validating email. Check server logs and origin settings.");
        return;
      }
      if (err.response?.data?.code === "EMAIL_NOT_EXIST") {
        setEmailValidationError("Email does not exist.");
        return;
      }
      if (err.response?.status === 409) {
        setEmailValidationError("Email already in use.");
        return;
      }
      setToast(err.response?.data?.message || "Email validation failed");
    } finally {
      setCheckingEmail(false);
    }
  };

  // Step 2 Validation (All fields required)
  const isStep2Valid = useMemo(() => {
    const years = Number(form.yearsOfExperience || 0);
    const bioTrimmed = form.bio.trim();
    const hasBasics = selectedInstitutionKey && selectedFacultyKey && Number.isInteger(years) && years >= 1 && bioTrimmed.length >= 15;
    const hasSubAreas = selectedSubAreas.length > 0;
    const linkedinValid = urlPatterns.linkedin.test(socialLinks.linkedin);
    const xValid = urlPatterns.x.test(socialLinks.x);
    const fbValid = urlPatterns.facebook.test(socialLinks.facebook);
    const webValid = socialLinks.website && socialLinks.website.includes('.');

    // Require at least one valid social/profile link (linkedin, x, facebook, or website)
    const socialValid = linkedinValid || xValid || fbValid || webValid;

    return hasBasics && hasSubAreas && socialValid;
  }, [selectedInstitutionKey, selectedFacultyKey, form.yearsOfExperience, form.bio, selectedSubAreas, socialLinks]);

  // Step 3 Validation
  const isStep3Valid = useMemo(() => {
    return skipAvailability || availability.some((d) => d.slots.length > 0);
  }, [skipAvailability, availability]);

  const handleAddSlot = () => {
    if (skipAvailability) setSkipAvailability(false);

    const toMinutes = (time) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    const start = toMinutes(newSlot.from);
    const end = toMinutes(newSlot.to);

    if (start >= end) {
      setToast("End time must be after start time");
      return;
    }

    const dayEntry = availability.find((d) => d.day === newSlot.day);
    const hasOverlap = dayEntry?.slots.some((slot) => {
      const slotStart = toMinutes(slot.from);
      const slotEnd = toMinutes(slot.to);
      return start < slotEnd && end > slotStart;
    });

    if (hasOverlap) {
      setToast("This time slot overlaps with another!");
      return;
    }

    setAvailability((prev) =>
      prev.map((d) => {
        if (d.day !== newSlot.day) return d;
        const slot = { id: crypto.randomUUID(), from: newSlot.from, to: newSlot.to };
        return { ...d, slots: [...d.slots, slot] };
      })
    );

    setNewSlot((slot) => ({ ...slot, from: "09:00", to: "10:00" }));
  };

  const removeSlot = (day, id) => {
    setAvailability((prev) =>
      prev.map((d) =>
        d.day === day ? { ...d, slots: d.slots.filter((s) => s.id !== id) } : d
      )
    );
  };

  const submit = async (e) => {
    if (e?.preventDefault) e.preventDefault();
    setLoading(true);
    try {
      const normalizedSocial = {};
      
      Object.entries(socialLinks).forEach(([k, v]) => {
        const trimmedValue = v.trim();
        
        // ONLY add to payload if the user actually typed something
        if (trimmedValue !== "") {
          let url = trimmedValue;
          // Only prepend https:// if it doesn't already have a protocol
          if (!/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
          }
          normalizedSocial[k] = url;
        } else {
          // Explicitly set as empty string so backend doesn't receive "https://"
          normalizedSocial[k] = "";
        }
      });

      const formData = new FormData();
      formData.append("fullName", form.fullName);
      formData.append("email", form.email);
      formData.append("password", form.password);
      formData.append("institution", selectedInstitutionKey || "");
      formData.append("university", selectedInstitutionKey || "");
      formData.append("faculty", selectedFacultyKey || "");
      formData.append("yearsOfExperience", String(Number(form.yearsOfExperience || 0)));
      formData.append("bio", form.bio || "");
      formData.append("expertiseAreas", JSON.stringify(selectedSubAreas));
      formData.append("socialLinks", JSON.stringify(normalizedSocial));
      formData.append(
        "availability",
        JSON.stringify(
          skipAvailability
            ? []
            : availability.flatMap((d) => d.slots.map(({ from, to }) => ({ day: d.day, from, to })))
        )
      );
      if (profileImageFile) {
        formData.append("profileImage", profileImageFile);
      }

      const { data } = await api.post("/auth/register/mentor", formData);
      const user = data?.user || {};
      if (data?.token && user?._id) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", user.role || "mentor");
        localStorage.setItem("status", user.status || "pending");
        if (user.fullName) localStorage.setItem("fullName", user.fullName);
        localStorage.setItem("user", JSON.stringify(user));

        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("role", user.role || "mentor");
        sessionStorage.setItem("status", user.status || "pending");
        if (user.fullName) sessionStorage.setItem("fullName", user.fullName);
        sessionStorage.setItem("user", JSON.stringify(user));

        setAuthToken(data.token);
      }

      // Always show success modal informing admin will review and email the user
      setSuccessModal(true);
    } catch (err) {
      const resp = err.response?.data;
      if (resp?.errors && Array.isArray(resp.errors)) {
        const msgs = resp.errors.map((e) => e.msg || e.msg || JSON.stringify(e)).join("; ");
        setToast(msgs || "Validation failed");
      } else {
        setToast(resp?.message || "Registration failed");
      }
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="relative min-h-screen bg-background text-foreground flex items-center justify-center p-6 transition-colors duration-300">
      <header className="fixed top-0 w-full z-50 backdrop-blur-md border-b border-border/40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Brand />
          <ThemeToggle />
        </div>
      </header>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-xl mt-16">
        <div className="bg-card/60 backdrop-blur-xl border border-border/50 rounded-[2.5rem] p-8 md:p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-muted">
            <motion.div className="h-full bg-primary" animate={{ width: `${(step / 4) * 100}%` }} />
          </div>

          <div className="mb-8">
            <h1 className="text-3xl font-light tracking-tight">
              Mentor <span className="italic font-serif text-primary">Registration.</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2">Step {step}: {step === 1 ? "Credentials" : step === 2 ? "Profile Details" : step === 3 ? "Working Hours" : "Profile Picture"}</p>
          </div>

          <form autoComplete="off" className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
                    <input name="fullName" placeholder="Full Name" value={form.fullName} onChange={update} autoComplete="name" className={`w-full bg-background/50 rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none ${fullNameValidationError ? 'border-red-500' : 'border border-border'}`} />
                  </div>
                  {fullNameValidationError && (
                    <p className="-mt-2 text-[11px] font-medium text-red-500 px-1">{fullNameValidationError}</p>
                  )}
                  <div className="relative">
                    <Mail className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
                    <input
                      type="email"
                      name="email"
                      placeholder="Email address"
                      value={form.email}
                      onChange={update}
                      autoComplete="email"
                      className={`w-full bg-background/50 border rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none ${emailValidationError ? 'border-red-500' : 'border-border'}`}
                    />
                  </div>
                  {emailValidationError && (
                    <p className="-mt-2 text-[11px] font-medium text-red-500 px-1">{emailValidationError}</p>
                  )}
                  <div className="relative">
                    <Lock className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
                    <input type={showPassword ? "text" : "password"} name="password" placeholder="Password" value={form.password} onChange={update} autoComplete="new-password" className="w-full bg-background/50 border border-border rounded-2xl pl-11 pr-12 py-3.5 text-sm outline-none" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-muted-foreground">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {!strongPasswordRegex.test(form.password) && form.password.length > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-xl border border-primary/10 text-[11px] text-primary/80">
                      <Info size={14} /> Password must be 8+ chars with mix of cases, numbers & symbols.
                    </div>
                  )}
                  <Button onClick={handleStep1Submit} disabled={!isStep1Valid} loading={checkingEmail} variant="primary" className="w-full group">
                    Continue <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <p className="text-center text-xs text-muted-foreground mt-2">
                    Already registered? <button type="button" onClick={() => navigate("/login")} className="text-primary font-semibold hover:underline">Sign In</button>
                  </p>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-4">
                  <div className="space-y-4">
                    <div className="relative">
                      <Building2 className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
                      <select value={selectedInstitutionKey || ""} onChange={(e) => setSelectedInstitutionKey(e.target.value)} className="w-full bg-background/50 border border-border rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none appearance-none">
                        <option value="">Institution *</option>
                        {universities.map(u => <option key={u.key} value={u.key}>{u.name}</option>)}
                      </select>
                    </div>

                    <div className="relative">
                      <BookMarked className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
                      <select value={selectedFacultyKey || ""} onChange={(e) => setSelectedFacultyKey(e.target.value)} className="w-full bg-background/50 border border-border rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none appearance-none">
                        <option value="">Faculty *</option>
                        {faculties.map(f => <option key={f.key} value={f.key}>{f.name}</option>)}
                      </select>
                    </div>
                  </div>

                  {selectedFacultyKey && (
                    <div className="p-4 bg-muted/30 rounded-2xl border border-border/50">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Expertise Areas *</p>
                      <div className="grid grid-cols-2 gap-2">
                        {(faculties.find(f => f.key === selectedFacultyKey)?.subs || []).map((sub) => (
                          <label key={sub.key} className={`flex items-center gap-2 p-2 rounded-xl border cursor-pointer transition-all ${selectedSubAreas.includes(sub.key) ? 'bg-primary/10 border-primary' : 'bg-background border-border hover:border-primary/50'}`}>
                            <input type="checkbox" checked={selectedSubAreas.includes(sub.key)} onChange={(e) => e.target.checked ? setSelectedSubAreas([...selectedSubAreas, sub.key]) : setSelectedSubAreas(selectedSubAreas.filter(x => x !== sub.key))} className="hidden" />
                            <span className="text-xs truncate">{sub.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="relative">
                    <Briefcase className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
                    <input type="number" name="yearsOfExperience" placeholder="Years of Experience *" value={form.yearsOfExperience} onChange={update} className="w-full bg-background/50 border border-border rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none" />
                  </div>

                                  <div className="relative">
                      <FileText className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
                      <textarea
                        name="bio"
                        placeholder="Professional Bio (Minimum 15 chars) *"
                        value={form.bio}
                        onChange={update}
                        className={`w-full bg-background/50 rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none min-h-[100px] ${bioValidationError ? 'border-red-500' : 'border border-border'}`}
                      />
                    </div>
                    {bioValidationError && (
                      <p className="-mt-2 text-[11px] font-medium text-red-500 px-1">{bioValidationError}</p>
                    )}

                  <div className="space-y-3 pt-2">
                    <p className="text-xs font-medium text-muted-foreground px-1">Social Profiles (Only one required)</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       <div className="relative">
                          <Linkedin className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
                          <input placeholder="LinkedIn URL" value={socialLinks.linkedin} onChange={(e) => setSocialLinks({...socialLinks, linkedin: e.target.value})} className={`w-full bg-background/50 border rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none ${socialLinks.linkedin && !urlPatterns.linkedin.test(socialLinks.linkedin) ? 'border-red-500' : 'border-border'}`} />
                       </div>
                       <div className="relative">
                          <Twitter className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
                          <input placeholder="X URL" value={socialLinks.x} onChange={(e) => setSocialLinks({...socialLinks, x: e.target.value})} className={`w-full bg-background/50 border rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none ${socialLinks.x && !urlPatterns.x.test(socialLinks.x) ? 'border-red-500' : 'border-border'}`} />
                       </div>
                       <div className="relative">
                          <Facebook className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
                          <input placeholder="Facebook URL" value={socialLinks.facebook} onChange={(e) => setSocialLinks({...socialLinks, facebook: e.target.value})} className={`w-full bg-background/50 border rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none ${socialLinks.facebook && !urlPatterns.facebook.test(socialLinks.facebook) ? 'border-red-500' : 'border-border'}`} />
                       </div>
                       <div className="relative">
                          <Globe className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
                          <input placeholder="Portfolio/Website" value={socialLinks.website} onChange={(e) => setSocialLinks({...socialLinks, website: e.target.value})} className="w-full bg-background/50 border border-border rounded-2xl pl-11 pr-4 py-3.5 text-sm outline-none" />
                       </div>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={() => setStep(1)} variant="secondary" className="flex-1">Back</Button>
                    <Button onClick={() => setStep(3)} disabled={!isStep2Valid} variant="primary" className="flex-[2]">Next </Button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2 text-sm font-medium"><CalendarDays className="w-4 h-4 text-primary" /> Availability</div>
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <span className="text-xs text-muted-foreground group-hover:text-primary transition-colors">Skip for now</span>
                      <input type="checkbox" checked={skipAvailability} onChange={(e) => {
                        const checked = e.target.checked;
                        setSkipAvailability(checked);
                        if (checked) {
                          setAvailability((a) => a.map((d) => ({ ...d, slots: [] })));
                        }
                      }} className="w-4 h-4 rounded border-border text-primary focus:ring-primary/20" />
                    </label>
                  </div>

                  <div className="p-4 bg-muted/30 backdrop-blur-xl border border-border/50 rounded-2xl space-y-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                      Add A Slot
                    </p>
                    <div className="grid grid-cols-12 gap-3">
                      <select
                        value={newSlot.day}
                        onChange={(e) => setNewSlot({ ...newSlot, day: e.target.value })}
                        className="col-span-12 sm:col-span-3 w-full bg-background/50 border border-border rounded-xl px-4 py-3.5 text-sm outline-none"
                        disabled={skipAvailability}
                      >
                        {DAYS.map((day) => (
                          <option key={day.key} value={day.key}>{day.label}</option>
                        ))}
                      </select>
                      <input
                        type="time"
                        value={newSlot.from}
                        onChange={(e) => setNewSlot({ ...newSlot, from: e.target.value })}
                        className="col-span-12 sm:col-span-3 w-full bg-background/50 border border-border rounded-xl px-2 py-3.5 text-[11px] font-mono leading-tight outline-none"
                        disabled={skipAvailability}
                      />
                      <input
                        type="time"
                        value={newSlot.to}
                        onChange={(e) => setNewSlot({ ...newSlot, to: e.target.value })}
                        className="col-span-12 sm:col-span-3 w-full bg-background/50 border border-border rounded-xl px-2 py-3.5 text-[11px] font-mono leading-tight outline-none"
                        disabled={skipAvailability}
                      />
                      <Button
                        type="button"
                        onClick={handleAddSlot}
                        disabled={skipAvailability}
                        className="col-span-12 sm:col-span-3 w-full rounded-xl py-3.5"
                      >
                        Add Slot
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {availability.some((d) => d.slots.length > 0) ? (
                      availability
                        .filter((d) => d.slots.length > 0)
                        .map((d) => (
                          <div key={d.day} className="space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">
                              {d.day}
                            </p>
                            {d.slots.map((slot) => (
                              <div key={slot.id} className="flex items-center justify-between p-3 bg-muted/30 border border-border/50 rounded-xl">
                                <div className="flex items-center gap-2 font-mono text-[11px]">
                                  <span className="font-mono text-[11px]">{format12h(slot.from)}</span>
                                  <span className="opacity-40 font-mono text-[10px] tracking-[0.3em]">TO</span>
                                  <span className="font-mono text-[11px]">{format12h(slot.to)}</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeSlot(d.day, slot.id)}
                                  className="text-[11px] text-muted-foreground hover:text-primary transition-colors"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        ))
                    ) : (
                      !skipAvailability && (
                        <p className="text-xs text-muted-foreground px-1">Use the form above to add your first slot.</p>
                      )
                    )}
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={() => setStep(2)} variant="secondary" className="flex-1">Back</Button>
                    <Button onClick={() => setStep(4)} disabled={!isStep3Valid} variant="primary" className="flex-[2] shadow-xl shadow-primary/20">Continue to Profile Identity</Button>
                  </div>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div key="s4" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                  <UserAvatarPicker
                    label="Step 4: Profile Picture"
                    name={form.fullName}
                    onChange={(file) => setProfileImageFile(file || null)}
                    skipLabel="Skip for now"
                    onSkip={submit}
                  />

                  <div className="flex gap-3">
                    <Button onClick={() => setStep(3)} variant="secondary" className="flex-1">Back</Button>
                    <Button onClick={submit} loading={loading} variant="primary" className="flex-[2] shadow-xl shadow-primary/20">Complete Registration</Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </div>
      </motion.div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}

      <AnimatePresence>
        {successModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-card border border-border p-8 rounded-[2.5rem] shadow-2xl text-center max-w-sm w-full">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6"><CheckCircle2 className="w-8 h-8" /></div>
              <h2 className="text-2xl font-light italic font-serif mb-2">Registration Submitted</h2>
              <p className="text-muted-foreground text-sm mb-8">Administrator will review your information and you will receive an email update once the review is complete.</p>
              <Button className="w-full" onClick={() => navigate("/")}>Go to Home</Button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}