import useCountdown from "../hooks/useCountdown";
import { MessageCircle } from "lucide-react";

export default function RequestCard({
  r,
  user,
  navigate,
  api,
  cancelRequest,
  deleteRejected,
  setToast,
}) {
  const { text, isStarted } = useCountdown(r.startTime);

  const now = new Date();
  const start = r.startTime ? new Date(r.startTime) : null;
  const end = r.endTime ? new Date(r.endTime) : null;

  const isOngoing =
    start && end && now >= start && now <= end;

  const effectiveStatus = isOngoing ? "ongoing" : r.status;

  const canJoin =
    r.meetingLink &&
    isOngoing;

  return (
    <div className="rounded-lg bg-slate-950/50 border border-slate-800 p-3 shadow-sm hover:shadow-[0_0_10px_rgba(56,189,248,0.2)] transition">
      <p className="text-sm font-medium text-slate-100">
        {r.mentorId?.user?.fullName || "Mentor"}
      </p>

      <p className="text-xs text-slate-400">
        {r.slot?.day} • {r.slot?.from}–{r.slot?.to}
      </p>

      {/* COUNTDOWN — only before start */}
      {!isOngoing &&
        r.status === "upcoming" &&
        text &&
        text !== "Starting now" && (
          <p className="text-xs text-slate-400 mt-1">
            Starts in {text}
          </p>
        )}

      {/* STATUS (same style, just corrected value) */}
      <p
        className={`text-xs mt-1 ${
          effectiveStatus === "rejected"
            ? "text-rose-400"
            : effectiveStatus === "ongoing"
            ? "text-emerald-400"
            : effectiveStatus === "upcoming"
            ? "text-emerald-400"
            : "text-sky-400"
        }`}
      >
        {effectiveStatus}
      </p>

      {/* ACTIONS */}
      {(effectiveStatus === "upcoming" || effectiveStatus === "ongoing") && (
        <div className="mt-3 flex flex-wrap gap-3">
          {/* JOIN — only when ongoing */}
          {canJoin && (
            <a
              href={r.meetingLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[12px] px-3 py-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-500 transition"
            >
              Join session
            </a>
          )}

          {/* CHAT — ALWAYS visible for upcoming & ongoing */}
          <button
            onClick={async () => {
              try {
                const mentorUserId =
                  r.mentorId?.user?._id || r.mentorId?._id;

                const { data } = await api.post("/chat/open", {
                  mentorId: mentorUserId,
                  studentId: user._id,
                });

                navigate(`/chat/${data._id}`);
              } catch {
                setToast("Failed to open chat");
              }
            }}
            className="inline-flex items-center gap-1 text-[12px] text-sky-400 hover:text-sky-300"
          >
            <MessageCircle className="w-4 h-4" />
            Chat
          </button>
        </div>
      )}

      <div className="mt-2 flex gap-2">
        {r.status === "pending" && (
          <button
            onClick={() => cancelRequest(r._id)}
            className="text-[11px] text-rose-400 hover:text-rose-300 transition"
          >
            Cancel
          </button>
        )}

        {r.status === "rejected" && (
          <button
            onClick={() => deleteRejected(r._id)}
            className="text-[11px] text-slate-400 hover:text-slate-300 transition"
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
