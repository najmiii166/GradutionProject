// src/components/mentor/MentorRequests.jsx
import { motion } from "framer-motion";
import { User, School, FileText, CalendarDays } from "lucide-react";
import Spinner from "../Spinner";

export default function MentorRequests({
  loading,
  requests,
  onAction,
  onViewStudent,
}) {
  return (
    <div
      className="
        rounded-2xl bg-slate-900/60 border border-slate-800 
        p-5 shadow-lg backdrop-blur-lg
        hover:shadow-[0_0_20px_rgba(56,189,248,0.20)] transition
      "
    >
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
            const studentId =
              r.studentId || r.student?._id || r.student || null;

            return (
              <motion.li
                key={r._id}
                whileHover={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
                className="
                  rounded-xl bg-slate-800/60 border border-slate-700 
                  p-4 shadow-lg
                  hover:border-sky-500/40 hover:shadow-sky-500/10
                "
              >
                {/* TOP ROW */}
                <div className="flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-50 flex items-center gap-2">
                      <User className="w-4 h-4 text-sky-400" />
                      {r.studentName || r.student?.fullName || "Student"}
                    </p>

                    <p className="text-[12px] text-slate-400 flex items-center gap-2">
                      <School className="w-3 h-3" />
                      {r.studentUniversity || r.student?.university || "—"}
                    </p>

                  </div>

                  {/* Requested date */}
                  <div className="text-right text-[11px] text-slate-400 flex flex-col items-end">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      Requested:
                    </span>
                    <span className="font-medium">
                      {r.requestedAt
                        ? new Date(r.requestedAt).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>
                </div>

                {/* NOTE */}
                {r.note && (
                  <p className="mt-3 text-[12px] text-slate-300 leading-relaxed">
                    <span className="text-slate-400 font-medium">Note: </span>
                    {r.note}
                  </p>
                )}

                {/* ACTIONS */}
                <div className="mt-4 flex items-center justify-between">
                  {studentId && (
                    <button
                      onClick={() => onViewStudent(studentId?._id || studentId)}
                      className="
                        text-[12px] text-sky-300 hover:text-sky-100 
                        hover:underline transition
                      "
                    >
                      View student profile →
                    </button>
                  )}

                  <div className="flex gap-2">
                    {/* Reject */}
                    <button
                      onClick={() => onAction(r._id, "reject")}
                      className="
                        px-4 py-1.5 rounded-lg text-[12px] font-medium 
                        bg-gradient-to-r from-rose-500 to-pink-500 
                        text-white shadow 
                        hover:shadow-pink-400/30 hover:scale-[1.03] 
                        transition
                      "
                    >
                      Reject
                    </button>

                    {/* Accept */}
                    <button
                      onClick={() => onAction(r._id, "accept")}
                      className="
                        px-4 py-1.5 rounded-lg text-[12px] font-medium 
                        bg-gradient-to-r from-emerald-500 to-green-500 
                        text-white shadow 
                        hover:shadow-emerald-400/30 hover:scale-[1.03] 
                        transition
                      "
                    >
                      Accept
                    </button>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
