import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  School,
  CalendarDays,
  Clock,
  GraduationCap,
  BookOpen,
  X,
} from "lucide-react";
import Spinner from "../Spinner";
import { faculties } from "../../constants/systemData";


const formatTime = (time) => {
  if (!time) return "";
  const [hours, minutes] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const h12 = hours % 12 || 12;
  return `${h12}:${minutes.toString().padStart(2, "0")} ${period}`;
};


/* ============================
   Helpers
============================ */
const getFacultyName = (key) => {
  if (!key) return "—";
  const faculty = faculties.find((f) => f.key === key);
  return faculty ? faculty.name : key.replace(/_/g, " ");
};

export default function MentorRequests({
  loading,
  requests,
  onAction,
  onViewStudent,
  externalOpenRequest,
}) {
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    if (externalOpenRequest) {
      setSelectedRequest(externalOpenRequest);
    }
  }, [externalOpenRequest]);

  return (
    <>
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800 p-5 shadow-lg backdrop-blur-lg">
        <h2 className="text-lg font-semibold text-slate-200 mb-4">
          Mentorship Requests
        </h2>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Spinner className="border-white/60" />
            <span>Loading requests…</span>
          </div>
        ) : !requests || requests.length === 0 ? (
          <p className="text-sm text-slate-400">No new mentorship requests.</p>
        ) : (
          <ul className="space-y-4">
            {requests.map((r) => {
              const student = r.studentId || {};
              const slot = r.slot || {};

              return (
                <motion.li
  key={r._id}
  whileHover={{ scale: 1.01 }}
  className="rounded-xl bg-slate-800/60 border border-slate-700 p-3 shadow-sm hover:border-sky-500/40 transition"
>
  {/* HEADER */}
  <div className="flex items-center gap-2">
    <User className="w-4 h-4 text-sky-400" />
    <p className="text-sm font-semibold text-slate-100 truncate">
      {student.fullName || "Student"}
    </p>
  </div>

  {/* UNIVERSITY + FACULTY */}
  <div className="mt-1 text-[12px] text-slate-400 flex items-center gap-2">
    <School className="w-3.5 h-3.5 text-sky-400" />
    <span className="truncate">
      {student.university || "—"}
    </span>
  </div>

  <div className="mt-1 text-[12px] text-slate-400 flex items-center gap-2">
    <BookOpen className="w-3.5 h-3.5 text-sky-400" />
    <span className="truncate">
      {getFacultyName(student.faculty)}
    </span>
  </div>

  {/* SEMESTER + DATE */}
  <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
    <div className="flex items-center gap-1">
      <GraduationCap className="w-3.5 h-3.5 text-sky-400" />
      <span>Semester {student.semester || "—"}</span>
    </div>

    <span>
      {r.requestedAt
        ? new Date(r.requestedAt).toLocaleDateString()
        : "—"}
    </span>
  </div>

  {/* TIME SLOT – HIGHLIGHT */}
  {slot.day && (
    <div className="mt-2 rounded-lg bg-slate-900/60 border border-slate-700 px-3 py-2 text-[12px] text-slate-200 flex items-center gap-2">
      <Clock className="w-4 h-4 text-sky-400" />
      <span className="font-medium">{slot.day}</span>
     <span className="text-slate-400">
  {formatTime(slot.from)} – {formatTime(slot.to)}
</span>

    </div>
  )}

  {/* ACTION */}
  <div className="mt-3 flex justify-end">
    <button
      onClick={() => setSelectedRequest(r)}
      className="text-xs text-sky-300 hover:text-sky-100 hover:underline"
    >
      View details →
    </button>
  </div>
</motion.li>

              );
            })}
          </ul>
        )}
      </div>

      {/* ================= MODAL ================= */}
      <AnimatePresence>
        {selectedRequest && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="w-full max-w-xl bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setSelectedRequest(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-semibold text-slate-100 mb-4">
                Mentorship Questionnaire
              </h3>

              <Section title="Motivation">
                {selectedRequest.questionnaire?.reason ||
                  "No motivation provided."}
              </Section>

              <Section title="Goals">
                {selectedRequest.questionnaire?.goals?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedRequest.questionnaire.goals.map((g) => (
                      <span
                        key={g}
                        className="px-3 py-1 rounded-full bg-sky-500/20 border border-sky-500/40 text-xs text-sky-200"
                      >
                        {g.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                ) : (
                  "No goals selected."
                )}
              </Section>

              <Section title="Session Focus">
                {selectedRequest.questionnaire?.sessionGoal ||
                  "No session focus provided."}
              </Section>

              <Section title="Experience Level">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4" />
                  {selectedRequest.questionnaire?.experienceLevel || "—"}
                </div>
              </Section>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    onAction(selectedRequest._id, "reject");
                    setSelectedRequest(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-500"
                >
                  Reject
                </button>

                <button
                  onClick={() => {
                    onAction(selectedRequest._id, "accept");
                    setSelectedRequest(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500"
                >
                  Accept
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ---------- Small reusable row ---------- */
function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 text-slate-500">{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-wide text-slate-500">
          {label}
        </p>
        <p className="text-slate-300 break-words line-clamp-2">
          {value}
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="mb-4">
      <p className="text-sm font-medium text-slate-300 mb-1">{title}</p>
      <div className="text-sm text-slate-400 bg-slate-900/60 border border-slate-800 rounded-lg p-3">
        {children}
      </div>
    </div>
  );
}
