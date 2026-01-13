import { useState } from "react";
import { api } from "../api/axios";
import Spinner from "./Spinner";
import { Briefcase, Sparkles, Calendar, Info } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function MentorModal({ mentor, onClose, onRequestSent, disabled }) {
  const name = mentor.user?.fullName || "Mentor";
  const university = mentor.user?.university || "—";
  const bio = mentor.bio || "No bio provided.";
  const experience = mentor.yearsOfExperience ?? 0;
  const areas = mentor.expertiseAreas || [];
  const availability = mentor.availability || [];

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [sending, setSending] = useState(false);

  const [showQuestionnaire, setShowQuestionnaire] = useState(false);

  const [questionnaire, setQuestionnaire] = useState({
    reason: "",
    goals: [],
    sessionGoal: "",
    experienceLevel: "",
  });

  const [fieldErrors, setFieldErrors] = useState({
    reason: "",
    sessionGoal: "",
    experienceLevel: "",
  });

  /* ---------------- STEP 1 → NEXT ---------------- */
  const handleNext = () => {
    if (disabled) return;

    if (!selectedSlot) {
      return;
    }

    setShowQuestionnaire(true);
  };

  /* ---------------- VALIDATION ---------------- */
  const validate = () => {
    const errors = {};

    if (questionnaire.reason.trim().length < 30) {
      errors.reason = "Motivation must be at least 30 characters.";
    }

    if (questionnaire.sessionGoal.trim().length < 20) {
      errors.sessionGoal = "Session focus must be at least 20 characters.";
    }

    if (!questionnaire.experienceLevel) {
      errors.experienceLevel = "Please select your experience level.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* ---------------- FINAL SUBMIT ---------------- */
  const handleSubmitRequest = async () => {
    if (disabled) return;
    if (!validate()) return;

    setSending(true);
    try {
      await api.post("/requests", {
        mentorId: mentor._id,
        slot: selectedSlot,
        questionnaire,
      });

      if (onRequestSent) onRequestSent();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950/80 backdrop-blur-xl p-6 shadow-2xl relative"
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/60 transition"
          >
            ✕
          </button>

          {/* ================= STEP 1 ================= */}
          {!showQuestionnaire && (
            <>
              <div className="mb-4">
                <h2 className="text-lg font-semibold bg-gradient-to-r from-cyan-400 via-violet-400 to-blue-400 bg-clip-text text-transparent">
                  {name}
                </h2>
                <p className="text-xs text-slate-400">{university}</p>

                {experience > 0 && (
                  <p className="flex items-center gap-1 text-[0.7rem] text-slate-400 mt-1">
                    <Briefcase className="w-3 h-3 text-cyan-400" />
                    {experience} years experience
                  </p>
                )}
              </div>

              <div className="mb-4">
                <p className="text-xs text-slate-400 mb-1">About</p>
                <p className="text-sm text-slate-300 bg-slate-900/40 border border-slate-800 rounded-lg p-3">
                  {bio}
                </p>
              </div>

              {areas.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-cyan-400" /> Expertise
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {areas.map((tag, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 rounded-full bg-cyan-600/20 border border-cyan-600/40 text-[0.7rem] text-sky-200"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <p className="text-xs text-slate-400 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-violet-400" /> Available time slots
                </p>
                <select
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                  onChange={(e) => setSelectedSlot(JSON.parse(e.target.value))}
                >
                  <option value="">Select a time slot</option>
                  {availability.map((slot, i) => (
                    <option key={i} value={JSON.stringify(slot)}>
                      {slot.day} — {slot.from} to {slot.to}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleNext}
                  disabled={disabled}
                  className="px-4 py-2 rounded-full text-xs font-medium text-white bg-gradient-to-r from-cyan-500 to-violet-600 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </>
          )}

          {/* ================= STEP 2 ================= */}
          {showQuestionnaire && (
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-slate-100">
                Mentorship Questionnaire
              </h3>

              {/* Motivation */}
              <div>
                <p className="text-sm font-medium text-slate-300 mb-1">Motivation</p>
                <textarea
                  className="w-full p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-sm text-slate-200"
                  value={questionnaire.reason}
                  onChange={(e) => {
                    const val = e.target.value;
                    setQuestionnaire({ ...questionnaire, reason: val });
                    setFieldErrors((p) => ({
                      ...p,
                      reason:
                        val.trim().length < 30
                          ? "Minimum 30 characters required."
                          : "",
                    }));
                  }}
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  {questionnaire.reason.length} / 30 characters
                </p>
                {fieldErrors.reason && (
                  <p className="text-xs text-rose-400">{fieldErrors.reason}</p>
                )}
              </div>

              {/* Goals */}
              <div>
                <p className="text-sm font-medium text-slate-300 mb-2">Goals</p>
                <div className="grid grid-cols-2 gap-2 text-sm text-slate-300">
                  {[
                    "career_development",
                    "interview_prep",
                    "technical_skills",
                    "portfolio_review",
                    "academic_guidance",
                  ].map((g) => (
                    <label key={g} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={questionnaire.goals.includes(g)}
                        onChange={(e) =>
                          setQuestionnaire((prev) => ({
                            ...prev,
                            goals: e.target.checked
                              ? [...prev.goals, g]
                              : prev.goals.filter((x) => x !== g),
                          }))
                        }
                      />
                      {g.replace("_", " ")}
                    </label>
                  ))}
                </div>
              </div>

              {/* Session Focus */}
              <div>
                <p className="text-sm font-medium text-slate-300 mb-1">
                  Session Focus
                </p>
                <textarea
                  className="w-full p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-sm text-slate-200"
                  value={questionnaire.sessionGoal}
                  onChange={(e) => {
                    const val = e.target.value;
                    setQuestionnaire({ ...questionnaire, sessionGoal: val });
                    setFieldErrors((p) => ({
                      ...p,
                      sessionGoal:
                        val.trim().length < 20
                          ? "Minimum 20 characters required."
                          : "",
                    }));
                  }}
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  {questionnaire.sessionGoal.length} / 20 characters
                </p>
                {fieldErrors.sessionGoal && (
                  <p className="text-xs text-rose-400">
                    {fieldErrors.sessionGoal}
                  </p>
                )}
              </div>

              {/* Experience */}
              <div>
                <p className="text-sm font-medium text-slate-300 mb-1">
                  Experience Level
                </p>
                <select
                  className="w-full bg-slate-900/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200"
                  value={questionnaire.experienceLevel}
                  onChange={(e) => {
                    setQuestionnaire({
                      ...questionnaire,
                      experienceLevel: e.target.value,
                    });
                    setFieldErrors((p) => ({
                      ...p,
                      experienceLevel: "",
                    }));
                  }}
                >
                  <option value="">Select level</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
                {fieldErrors.experienceLevel && (
                  <p className="text-xs text-rose-400">
                    {fieldErrors.experienceLevel}
                  </p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSubmitRequest}
                  disabled={sending || disabled}
                  className="px-4 py-2 rounded-full text-xs font-medium text-white bg-gradient-to-r from-cyan-500 to-violet-600 disabled:opacity-40"
                >
                  {sending ? <Spinner /> : "Submit Request"}
                </button>
              </div>
            </div>
          )}

          {disabled && (
            <p className="flex items-center gap-1 text-[11px] text-rose-400 mt-3">
              <Info className="w-3 h-3" />
              You reached the limit of 2 active mentor requests.
            </p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
