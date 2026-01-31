// frontend/src/components/student/MentorQuestionnaire.jsx
import Spinner from "./Spinner";
import { CheckCircle2, ChevronLeft } from "lucide-react";

export default function MentorQuestionnaire({
  questionnaire,
  setQuestionnaire,
  fieldErrors,
  setFieldErrors,
  sending,
  handleSubmitRequest,
  disabled,
  onBack,
}) {
  const goalOptions = [
    { id: "career_development", label: "Career Development" },
    { id: "interview_prep", label: "Interview Preparation" },
    { id: "skill_improvement", label: "Skill Improvement" },
    { id: "project_development", label: "Project Development" },
  ];

  const proficiencyOptions = [
    { id: "beginner", label: "Beginner", desc: "Foundations" },
    { id: "intermediate", label: "Intermediate", desc: "Optimization" },
    { id: "advanced", label: "Advanced", desc: "Specialization" },
  ];

  const handleGoalToggle = (goalId) => {
    const isSelected = questionnaire.goals.includes(goalId);
    const updatedGoals = isSelected
      ? questionnaire.goals.filter((g) => g !== goalId)
      : [...questionnaire.goals, goalId];

    setQuestionnaire((prev) => ({
      ...prev,
      goals: updatedGoals,
    }));

    // Clear error if at least one goal is selected
    if (updatedGoals.length > 0) {
      setFieldErrors((prev) => ({ ...prev, goals: "" }));
    }
  };

  return (
    <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
      {/* Motivation Field */}
      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest font-bold text-foreground/40 px-1">
          Motivation Statement
        </label>
        <textarea
          className={`w-full p-4 rounded-xl bg-foreground/[0.03] border text-sm transition-all focus:ring-0 placeholder:text-foreground/20 min-h-[100px] resize-none
            ${fieldErrors.reason ? "border-rose-500/40" : "border-border/50 focus:border-cyan-500/50"}`}
          value={questionnaire.reason}
          placeholder="Describe your motivation for seeking this mentorship..."
          onChange={(e) => {
            const val = e.target.value;
            setQuestionnaire({ ...questionnaire, reason: val });
            setFieldErrors((p) => ({
              ...p,
              reason: val.trim().length < 30 ? "Minimum 30 characters required." : "",
            }));
          }}
        />
        <div className="flex justify-between px-1">
          <p className="text-[10px] text-foreground/30 uppercase font-bold tracking-tighter">
            {questionnaire.reason.length} / 30 chars
          </p>
          {fieldErrors.reason && <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">{fieldErrors.reason}</p>}
        </div>
      </div>

      {/* Primary Objectives - With Validation Display */}
      <div className="space-y-3">
        <label className="text-[10px] uppercase tracking-widest font-bold text-foreground/40 px-1 flex justify-between items-center">
          <span>Primary Objectives</span>
          {fieldErrors.goals && (
            <span className="text-rose-500 lowercase font-normal italic animate-pulse">
              {fieldErrors.goals}
            </span>
          )}
        </label>
        <div className={`grid grid-cols-2 gap-2 p-1 rounded-xl transition-all ${fieldErrors.goals ? 'bg-rose-500/5 ring-1 ring-rose-500/20' : ''}`}>
          {goalOptions.map((goal) => {
            const isSelected = questionnaire.goals.includes(goal.id);
            return (
              <button
                key={goal.id}
                type="button"
                onClick={() => handleGoalToggle(goal.id)}
                className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between group
                  ${isSelected 
                    ? "bg-cyan-500/10 border-cyan-500/40 text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.1)]" 
                    : fieldErrors.goals
                      ? "bg-background border-rose-500/20 text-foreground/30"
                      : "bg-foreground/[0.02] border-border/50 text-foreground/40 hover:border-foreground/20"}`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider">{goal.label}</span>
                {isSelected && <CheckCircle2 size={14} className="animate-in zoom-in-50" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Proficiency Selection */}
      <div className="space-y-3">
        <label className="text-[10px] uppercase tracking-widest font-bold text-foreground/40 px-1 flex justify-between items-center">
          Current Proficiency
          {fieldErrors.experienceLevel && <span className="text-rose-500 lowercase font-normal italic">Required</span>}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {proficiencyOptions.map((level) => {
            const isSelected = questionnaire.experienceLevel === level.id;
            return (
              <button
                key={level.id}
                type="button"
                onClick={() => {
                  setQuestionnaire({ ...questionnaire, experienceLevel: level.id });
                  setFieldErrors((p) => ({ ...p, experienceLevel: "" }));
                }}
                className={`p-3 rounded-xl border transition-all text-center flex flex-col items-center gap-1 group
                  ${isSelected 
                    ? "bg-cyan-500 border-cyan-500 text-white shadow-lg shadow-cyan-500/20" 
                    : "bg-foreground/[0.02] border-border/50 text-foreground/50 hover:border-cyan-500/30"}`}
              >
                <span className={`text-[10px] font-black uppercase tracking-tighter ${isSelected ? 'text-white' : 'text-foreground/70'}`}>
                  {level.label}
                </span>
                <span className={`text-[8px] uppercase tracking-widest opacity-60 ${isSelected ? 'text-white/80' : ''}`}>
                  {level.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Session Focus */}
      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest font-bold text-foreground/40 px-1">
          Session goal
        </label>
        <textarea
          className={`w-full p-4 rounded-xl bg-foreground/[0.03] border text-sm transition-all focus:ring-0 placeholder:text-foreground/20 min-h-[80px] resize-none
            ${fieldErrors.sessionGoal ? "border-rose-500/40" : "border-border/50 focus:border-cyan-500/50"}`}
          value={questionnaire.sessionGoal}
          placeholder="What specific outcome do you want from this session?"
          onChange={(e) => {
            const val = e.target.value;
            setQuestionnaire({ ...questionnaire, sessionGoal: val });
            setFieldErrors((p) => ({
              ...p,
              sessionGoal: val.trim().length < 20 ? "Minimum 20 characters required." : "",
            }));
          }}
        />
        <div className="flex justify-between px-1">
          <p className="text-[10px] text-foreground/30 uppercase font-bold tracking-tighter">
            {questionnaire.sessionGoal.length} / 20 chars
          </p>
          {fieldErrors.sessionGoal && <p className="text-[10px] text-rose-500 font-bold uppercase tracking-widest">{fieldErrors.sessionGoal}</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-4 pt-4">
        <button 
          onClick={onBack}
          className="px-6 py-3 rounded-xl text-xs font-bold text-foreground/40 hover:text-foreground tracking-widest flex items-center gap-2 transition-colors"
        >
          <ChevronLeft size={16} /> BACK
        </button>
        <button
          onClick={handleSubmitRequest}
          disabled={sending || disabled}
          className="flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-cyan-500 text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-cyan-400 disabled:opacity-20 transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.98]"
        >
          {sending ? <Spinner /> : <><CheckCircle2 size={16} /> Submit Request</>}
        </button>
      </div>
    </div>
  );
}