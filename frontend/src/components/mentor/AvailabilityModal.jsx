// src/components/mentor/AvailabilityModal.jsx
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Clock, Trash2, Plus, X } from "lucide-react";
import { DAYS } from "../../constants/systemData";

export default function AvailabilityModal({
  open,
  availability,
  onAddSlot,
  onRemoveSlot,
  onClose,
  onSave,
  saving,
}) {
  if (!open) return null;

  const safeAvailability = Array.isArray(availability) ? availability : [];
  const [newSlot, setNewSlot] = useState({ day: DAYS[0].key, from: "09:00", to: "10:00" });
  const [error, setError] = useState("");

  const groupedAvailability = useMemo(() => {
    // Normalize slots to ensure legacy "Monday" slots are grouped with "Mon"
    const normalizedSlots = safeAvailability.map((slot, index) => {
      const dayDef = DAYS.find(d => d.key === slot.day || d.label === slot.day);
      return {
        ...slot,
        normalizedDay: dayDef ? dayDef.key : slot.day,
        index // original index for removal
      };
    });

    return DAYS.map((dayDef) => ({
      day: dayDef.key,
      label: dayDef.label,
      slots: normalizedSlots.filter((slot) => slot.normalizedDay === dayDef.key),
    })).filter((group) => group.slots.length > 0);
  }, [safeAvailability]);

  const toMinutes = (time) => {
    if (!time || typeof time !== "string") return 0;
    const [h = 0, m = 0] = time.split(":").map(Number);
    return h * 60 + m;
  };

  const formatTime = (time) => {
    if (!time || typeof time !== "string") return "--";
    const [h = "0", m = "00"] = time.split(":");
    let hours = parseInt(h, 10);
    if (Number.isNaN(hours)) return "--";
    const minutes = parseInt(m, 10) || 0;
    const period = hours >= 12 ? "PM" : "AM";
    hours = hours % 12 || 12;
    return `${hours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  const handleAddSlot = () => {
    if (!onAddSlot) return;
    setError("");

    const start = toMinutes(newSlot.from);
    const end = toMinutes(newSlot.to);

    if (start >= end) {
      setError("End time must be after start time.");
      return;
    }

    const overlaps = safeAvailability.some((slot) => {
      // Normalize slot day for comparison
      const dayDef = DAYS.find(d => d.key === slot.day || d.label === slot.day);
      const slotDay = dayDef ? dayDef.key : slot.day;
      
      if (slotDay !== newSlot.day) return false;
      const slotStart = toMinutes(slot.from);
      const slotEnd = toMinutes(slot.to);
      return start < slotEnd && end > slotStart;
    });

    if (overlaps) {
      setError("This slot overlaps with an existing one.");
      return;
    }

    onAddSlot({ day: newSlot.day, from: newSlot.from, to: newSlot.to });
    setNewSlot((prev) => ({ ...prev, from: "09:00", to: "10:00" }));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/60 backdrop-blur-md px-4 py-6"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="
          w-full max-w-2xl max-h-[90vh]
          flex flex-col
          rounded-[2.5rem] bg-card/90
          border border-border/50 shadow-2xl 
          p-8 text-foreground relative overflow-hidden
        "
      >
        {/* Background Glow Effect */}
        <div className="absolute -top-24 -right-24 h-48 w-48 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />

        {/* 1. FIXED HEADER */}
        <div className="flex-none flex items-start justify-between mb-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-cyan-500 mb-1">
              <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <CalendarDays size={14} strokeWidth={3} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">
                Schedule Management
              </span>
            </div>
            <h2 className="text-2xl font-semibold tracking-wide text-foreground">
              Weekly Availability
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-foreground/5 hover:bg-foreground/10 text-foreground/40 hover:text-foreground transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2. UNIFIED SCROLLABLE AREA */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar relative z-10 space-y-8">
          
          {/* Add Slot Block */}
          <div className="p-5 rounded-3xl bg-muted/30 border border-border/50">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40 mb-4">
              Create New Slot
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <select
                value={newSlot.day}
                onChange={(e) => setNewSlot((prev) => ({ ...prev, day: e.target.value }))}
                className="w-full rounded-2xl bg-background border border-border/60 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-cyan-500/20 transition"
              >
                {DAYS.map((day) => (
                  <option key={day.key} value={day.key}>{day.label}</option>
                ))}
              </select>
              <input
                type="time"
                value={newSlot.from}
                onChange={(e) => setNewSlot((prev) => ({ ...prev, from: e.target.value }))}
                className="w-full rounded-2xl bg-background border border-border/60 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-cyan-500/20 transition"
              />
              <input
                type="time"
                value={newSlot.to}
                onChange={(e) => setNewSlot((prev) => ({ ...prev, to: e.target.value }))}
                className="w-full rounded-2xl bg-background border border-border/60 px-4 py-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-cyan-500/20 transition"
              />
              <button
                type="button"
                onClick={handleAddSlot}
                className="w-full rounded-2xl px-4 py-3 text-sm font-bold uppercase bg-cyan-500 text-white hover:bg-cyan-600 transition flex items-center justify-center gap-2"
              >
                <Plus size={16} strokeWidth={3} /> Add
              </button>
            </div>
            {error && <p className="text-xs text-rose-400 font-medium mt-3 px-1">{error}</p>}
          </div>

          {/* Availability List Block */}
          <div className="space-y-6">
            {groupedAvailability.length === 0 ? (
              <div className="text-center py-10 rounded-3xl border border-dashed border-border/40 bg-foreground/[0.01]">
                <p className="text-foreground/30 text-sm">No slots added yet.</p>
              </div>
            ) : (
              groupedAvailability.map((group) => (
                <div key={group.day} className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-500 px-1">
                    {group.label}
                  </p>
                  <div className="grid gap-2">
                    <AnimatePresence mode="popLayout">
                      {group.slots.map((slot) => (
                        <motion.div
                          key={`${slot.day}-${slot.from}-${slot.index}`}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="flex items-center justify-between bg-card/40 px-5 py-3 rounded-2xl border border-border/50 hover:border-cyan-500/30 transition-all shadow-sm"
                        >
                          <div className="flex items-center gap-3 text-xs font-semibold text-foreground/80">
                            <Clock size={14} className="text-cyan-500/50" />
                            <span className="tabular-nums">{formatTime(slot.from)}</span>
                            <span className="text-foreground/20 text-[10px] font-black">—</span>
                            <span className="tabular-nums">{formatTime(slot.to)}</span>
                          </div>
                          <button
                            onClick={() => onRemoveSlot && onRemoveSlot(slot.index)}
                            className="p-2 rounded-xl text-rose-500 bg-rose-500/5 hover:bg-rose-500 hover:text-white transition-all"
                          >
                            <Trash2 size={14} />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3. FIXED FOOTER */}
        <div className="flex-none mt-6 pt-6 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
          <p className="text-[11px] text-foreground/40 font-medium">
            Slots are saved only after clicking <span className="text-foreground/70">Save Schedule</span>.
          </p>
          <button
            onClick={onSave}
            disabled={saving}
            className="w-full sm:w-auto rounded-2xl px-8 py-3 text-xs font-semibold uppercase tracking-widest bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 hover:bg-cyan-600 disabled:opacity-50 transition-all"
          >
            {saving ? "Updating..." : "Save Schedule"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}