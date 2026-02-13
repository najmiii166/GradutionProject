import { useState, useEffect } from "react";
import { api } from "../api/axios";
import { Briefcase, Calendar, Info, X, ChevronRight , CheckCircle2} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MentorQuestionnaire from "./MentorQuestionnaire";
import { universities } from "../constants/systemData";

export default function MentorModal({ mentor, onClose, onRequestSent, disabledGlobal = false, disabledMentor = false }) {
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [sending, setSending] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [occupiedSlots, setOccupiedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [questionnaire, setQuestionnaire] = useState({
    reason: "",
    goals: [],
    sessionGoal: "",
    experienceLevel: "",
  });

  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    const fetchOccupied = async () => {
      try {
        setLoadingSlots(true);
        const { data } = await api.get(`/requests/mentor/${mentor._id}/occupied-slots`);
        setOccupiedSlots(data || []);
      } catch (err) {
        console.error("Failed to load occupied slots", err);
      } finally {
        setLoadingSlots(false);
      }
    };

    if (mentor?._id) {
      fetchOccupied();
    }
  }, [mentor?._id]);

  const isSlotOccupied = (slot) =>
    occupiedSlots.some(
      (s) => s.day === slot.day && s.from === slot.from && s.to === slot.to
    );

  const validate = () => {
    const errors = {};
    if (questionnaire.reason.trim().length < 30) errors.reason = "Need 30+ characters.";
    if (questionnaire.sessionGoal.trim().length < 20) errors.sessionGoal = "Need 20+ characters.";
    if (questionnaire.goals.length === 0) errors.goals = "Required.";
    if (!questionnaire.experienceLevel) errors.experienceLevel = "Required.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitRequest = async () => {
    const disabledEffective = disabledGlobal || disabledMentor;
    if (disabledEffective || !validate()) return;
    setSending(true);
    setErrorMsg("");
    try {
      await api.post("/requests", {
        mentorId: mentor._id,
        slot: selectedSlot,
        questionnaire,
      });
      if (onRequestSent) onRequestSent();
      onClose();
    } catch (err) {
      console.error("Request Error:", err);
      const status = err?.response?.status;
      const msg = err?.response?.data?.message || "Failed to send request.";
      if (status === 409) {
        setErrorMsg(msg || "You already have an active request with this mentor.");
      } else {
        setErrorMsg(msg);
      }
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
        className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-md p-4"
      >
        <motion.div
          initial={{ scale: 0.95, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.95, y: 20 }}
          className="w-full max-w-xl rounded-3xl border border-border/50 bg-card/90 backdrop-blur-2xl p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Subtle Background Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/10 blur-[100px] rounded-full" />

          {/* Close Button */}
          <button 
            onClick={onClose} 
            className="absolute top-6 right-6 p-2 rounded-xl hover:bg-foreground/5 text-foreground/40 transition-colors"
          >
            <X size={20} />
          </button>

          {/* Stepper Header */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-2">
               <div className={`h-1 w-8 rounded-full transition-colors ${!showQuestionnaire ? 'bg-cyan-500' : 'bg-cyan-500/20'}`} />
               <div className={`h-1 w-8 rounded-full transition-colors ${showQuestionnaire ? 'bg-cyan-500' : 'bg-foreground/10'}`} />
            </div>
            <h2 className="text-2xl font-light tracking-tight text-foreground">
              {showQuestionnaire ? "Request " : "Request "} 
              <span className="text-cyan-500 italic font-serif">Mentorship.</span>
            </h2>
            
          </div>

          {/* STEP 1: Profile & Slot Selection */}
          {!showQuestionnaire && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-foreground/[0.03] border border-border/50">
                
                <div className="flex gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold shrink-0 shadow-lg shadow-cyan-500/20">
  {mentor.user?.fullName?.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
</div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{mentor.user?.fullName}</h3>
                    <p className="text-xs text-foreground/50">
                      {(() => {
                        const key = mentor.user?.university || mentor.institution || "";
                        const match = universities.find((u) => String(u.key) === String(key));
                        return match?.name || "Independent";
                      })()}
                    </p>
                    {mentor.yearsOfExperience > 0 && (
                      <p className="flex items-center gap-1 text-[10px] text-cyan-500 font-bold mt-1">
                        <Briefcase size={10} /> {mentor.yearsOfExperience} Years XP
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <p className="text-[11px] text-rose-400 font-semibold">
                    {errorMsg} — Manage your existing request in the Requests panel.
                  </p>
                </div>
              )}

              <div className="space-y-3">
  <label className="text-[10px] uppercase tracking-widest font-bold text-foreground/40 flex items-center gap-2 px-1">
    <Calendar size={12} className="text-violet-500" /> Availability Window
  </label>
  
  <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
    {mentor.availability?.length > 0 ? (
      mentor.availability.map((slot, i) => {
        const isSelected = JSON.stringify(selectedSlot) === JSON.stringify(slot);
        const occupied = isSlotOccupied(slot);
        return (
          <div
            key={i}
            onClick={() => {
              if (!occupied) setSelectedSlot(slot);
            }}
            className={`
              relative group cursor-pointer p-3 rounded-xl border transition-all duration-200
              ${occupied
                ? "bg-foreground/[0.02] border-border/30 opacity-60 cursor-not-allowed"
                : isSelected 
                  ? "bg-cyan-500/10 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.1)]" 
                  : "bg-foreground/[0.03] border-border/50 hover:border-foreground/20 hover:bg-foreground/[0.05]"}
            `}
          >
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className={`text-xs font-bold uppercase tracking-tight ${isSelected ? "text-cyan-500" : "text-foreground/70"}`}>
                  {slot.day}
                </span>
                <span className="text-[11px] text-foreground/40 font-medium">
                  {slot.from} – {slot.to}
                </span>
              </div>

              {occupied ? (
                <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 text-[10px] font-bold uppercase tracking-widest border border-rose-500/20">
                  Occupied
                </span>
              ) : isSelected ? (
                <motion.div layoutId="activeCheck" className="h-5 w-5 rounded-full bg-cyan-500 flex items-center justify-center">
                  <CheckCircle2 size={10} className="text-white" />
                </motion.div>
              ) : null}
            </div>
          </div>
        );
      })
    ) : (
      <p className="text-[10px] text-foreground/30 italic px-1">No active slots available.</p>
    )}
  </div>
</div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setShowQuestionnaire(true)}
                  disabled={!selectedSlot || disabledGlobal || disabledMentor || isSlotOccupied(selectedSlot)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-foreground text-background text-xs font-bold uppercase tracking-widest hover:bg-cyan-500 hover:text-white disabled:opacity-20 transition-all shadow-xl shadow-black/10 active:scale-95"
                >
                  Configure Request <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Questionnaire Component */}
          {showQuestionnaire && (
            <MentorQuestionnaire
              questionnaire={questionnaire}
              setQuestionnaire={setQuestionnaire}
              fieldErrors={fieldErrors}
              setFieldErrors={setFieldErrors}
              sending={sending}
              handleSubmitRequest={handleSubmitRequest}
              disabled={disabledGlobal || disabledMentor}
              onBack={() => setShowQuestionnaire(false)}
            />
          )}

          {(disabledGlobal || disabledMentor) && (
            <div className="mt-6 flex items-center gap-3 p-3 rounded-xl bg-rose-500/5 border border-rose-500/20">
              <Info size={14} className="text-rose-500" />
              <p className="text-[10px] font-bold text-rose-500/80 uppercase tracking-widest">
                {disabledGlobal
                  ? 'Active Request Limit Reached (2/2)'
                  : 'You already have a pending or upcoming request with this mentor'}
              </p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}