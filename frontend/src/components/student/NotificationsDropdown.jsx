import React from "react";
import { api } from "../../api/axios";
import { formatSessionInfo } from "../../utils/student";
import { X, Bell, Trash2, CheckCircle2, XCircle } from "lucide-react";

export default function NotificationsDropdown({
  refObj,
  notifications,
  setNotifications,
  onView,
  onCancel,
  onDelete,
  close,
  setSelectedMentor,
  setShowProfile,
  setToast,
}) {
  const notifRef = refObj?.notifRef;

  const handleView = async (t, req) => {
    try {
      let mentorUserId = req.mentorUserId || req.mentorId;
      if (!mentorUserId) {
        const { data: allReqs } = await api.get("/requests/student");
        const found = (allReqs || []).find((r) => String(r._id) === String(req._id));
        mentorUserId = found?.mentorId?.user?._id || found?.mentorId || null;
      }
      if (!mentorUserId) {
        setToast?.("Failed to determine mentor.");
        return;
      }
      const { data } = await api.get(`/mentor/mentors/${mentorUserId}`);
      setSelectedMentor?.(data || null);
      setShowProfile?.(true);
      close();
      setNotifications((prev) => 
        prev.filter((x) => !(x.type === t && x.request && String(x.request._id) === String(req._id)))
      );
    } catch (err) {
      setToast?.("Failed to load mentor profile.");
    }
  };

  return (
    <div
      ref={notifRef}
      id="student-notifications"
      role="dialog"
      aria-label="Notifications"
      // FIXED: Removed /98 and used solid bg-card. 
      // Added a slight shadow ring to separate it from the background visually.
      className="fixed right-6 top-20 w-96 bg-card border border-border rounded-2xl shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] p-4 space-y-4 z-[999] transition-all duration-300 ring-1 ring-white/10"
    >
      <div className="flex items-center justify-between border-b border-border/50 pb-3">
        <div className="flex items-center gap-2">
            <Bell size={16} className="text-cyan-500" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-foreground/70">Notifications</h3>
        </div>
        <button 
          onClick={close} 
          className="p-1 rounded-lg hover:bg-foreground/10 text-foreground/40 hover:text-foreground transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {(() => {
        const dropdownItems = [
          ...notifications.filter((n) => n.type === "request:accepted" || n.type === "request:rejected"),
        ]
          .slice()
          .sort((a, b) => {
            const ta = (a.createdAt ?? Date.parse(a.request?.requestedAt || 0)) || 0;
            const tb = (b.createdAt ?? Date.parse(b.request?.requestedAt || 0)) || 0;
            return tb - ta;
          });

        if (dropdownItems.length === 0) {
          return (
            <div className="py-12 text-center">
                <p className="text-xs text-foreground/30 italic font-medium">No active protocol updates.</p>
            </div>
          );
        }

        return (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {dropdownItems.map((item, idx) => {
              const t = item.type;
              const req = item.request || {};
              const key = `${t}-${req._id || idx}`;
              const isAccepted = t === "request:accepted";

              return (
                <div key={key} className="relative group rounded-xl border border-border/50 bg-background p-4 transition-all hover:border-cyan-500/30">
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 shrink-0 ${isAccepted ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {isAccepted ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                    </div>
                    
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isAccepted ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {isAccepted ? "Accepted" : "Rejected"}
                        </span>
                        <span className="text-[9px] text-foreground/30 font-mono">
                          {req.requestedAt || item.createdAt ? new Date(req.requestedAt || item.createdAt).toLocaleDateString() : ""}
                        </span>
                      </div>
                      
                      <p className="text-xs text-foreground/80 leading-relaxed">
                        {isAccepted ? (
                          <>
                            Request granted by <span className="text-foreground font-bold">{req.mentorName}</span>.
                            <span className="block mt-2 p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-mono text-[10px]">
                              {formatSessionInfo(req)}
                            </span>
                          </>
                        ) : (
                          <>Mentorship request declined by <span className="font-bold text-foreground">{req.mentorName}</span>.</>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-end border-t border-border/20 pt-3">
                    {!isAccepted && (
                      <button
                        onClick={() => {
                          onDelete?.(req._id);
                          close();
                          setNotifications((prev) => 
                            prev.filter((x) => !(x.type === t && x.request && String(x.request._id) === String(req._id)))
                          );
                        }}
                        className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-foreground/40 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 size={12} /> Clear Update
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}
    </div>
  );
}