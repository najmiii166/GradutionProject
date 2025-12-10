// src/components/mentor/AvailabilityModal.jsx
import { motion } from "framer-motion";
import { CalendarDays, Clock, Trash2, Plus } from "lucide-react";

export default function AvailabilityModal({
  open,
  availability,
  onChange,
  onAddRow,
  onRemoveRow,
  onClose,
  onSave,
  saving,
}) {
  if (!open) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md"
    >
      <motion.div
        initial={{ scale: 0.93, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="
          w-full max-w-2xl        /* BIGGER MODAL */
          rounded-2xl bg-slate-950 
          border border-slate-800 shadow-2xl 
          p-6 text-slate-50 relative
        "
      >
        {/* HEADER */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
              Manage Availability
            </p>
            <h2 className="text-xl font-semibold mt-1 flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-sky-400" />
              Weekly Schedule
            </h2>
            <p className="text-[12px] text-slate-400 mt-1">
              Add the days and time ranges when you are available for mentoring.
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-xl"
          >
            ✕
          </button>
        </div>

        {/* AVAILABILITY LIST */}
        <div
          className="
            max-h-[380px] overflow-y-auto      /* MORE HEIGHT, LESS SCROLLING */
            rounded-xl bg-slate-900/60 
            border border-slate-800 p-4 space-y-3
          "
        >
          {availability.length === 0 ? (
            <p className="text-slate-400 text-sm">
              No availability added yet. Click **Add day** to create one.
            </p>
          ) : (
            availability.map((slot, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="
                  flex flex-col sm:flex-row items-center gap-4
                  bg-slate-900 px-4 py-3 rounded-xl
                  border border-slate-700 shadow-sm
                  hover:border-sky-500/40 hover:shadow-sky-500/10 
                  transition
                "
              >
                {/* DAY SELECT */}
                <div className="flex items-center gap-2 w-full sm:w-1/3">
                  <CalendarDays className="w-4 h-4 text-sky-400" />
                  <select
                    value={slot.day}
                    onChange={(e) => onChange(idx, "day", e.target.value)}
                    className="
                      flex-1 rounded-md bg-slate-950 border border-slate-700 
                      px-2 py-1 text-[12px] outline-none 
                      focus:ring-1 focus:ring-sky-500
                    "
                  >
                    {[
                      "Monday",
                      "Tuesday",
                      "Wednesday",
                      "Thursday",
                      "Friday",
                      "Saturday",
                      "Sunday",
                    ].map((d) => {
                      const used = availability.map((s) => s.day);
                      const disabled = used.includes(d) && d !== slot.day;
                      return (
                        <option key={d} value={d} disabled={disabled}>
                          {d}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* TIME RANGE + REMOVE (now on SAME LINE!) */}
                <div className="flex-1 flex items-center gap-2">

                  <Clock className="w-4 h-4 text-sky-300" />

                  <input
                    type="time"
                    value={slot.from}
                    onChange={(e) => onChange(idx, "from", e.target.value)}
                    className="
                      flex-1 rounded-md bg-slate-950 border border-slate-700 
                      px-2 py-1 text-[12px] outline-none 
                      focus:ring-1 focus:ring-sky-500
                    "
                  />

                  <span className="text-slate-400 text-[11px]">to</span>

                  <input
                    type="time"
                    value={slot.to}
                    onChange={(e) => onChange(idx, "to", e.target.value)}
                    className="
                      flex-1 rounded-md bg-slate-950 border border-slate-700 
                      px-2 py-1 text-[12px] outline-none 
                      focus:ring-1 focus:ring-sky-500
                    "
                  />

                  {/* FIXED REMOVE BUTTON POSITION */}
                  <button
                    onClick={() => onRemoveRow(idx)}
                    className="
                      flex items-center gap-1
                      rounded-md px-2 py-1 text-[11px]
                      text-rose-300 bg-rose-500/10 
                      hover:bg-rose-500/20 transition
                    "
                  >
                    <Trash2 className="w-3 h-3" />
                    Remove
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* FOOTER */}
        <div className="mt-6 flex items-center justify-between">
          {/* ADD BUTTON */}
          <button
            onClick={onAddRow}
            className="
              flex items-center gap-2
              rounded-full px-4 py-2 text-[12px] font-medium
              bg-gradient-to-r from-sky-500 to-blue-600 text-white
              hover:shadow-sky-500/20 transition
            "
          >
            <Plus className="w-4 h-4 text-white" />
            Add day
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="
                rounded-full px-4 py-2 text-[12px]
                border border-slate-600 text-slate-200
                hover:bg-slate-800
              "
            >
              Cancel
            </button>

            <button
              onClick={onSave}
              disabled={saving}
              className="
                rounded-full px-5 py-2 text-[12px] font-medium
                bg-gradient-to-r from-emerald-500 to-emerald-600 text-white
                hover:shadow-emerald-500/20
                disabled:opacity-60 transition
              "
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
