// src/components/mentor/MentorNotifications.jsx
import React from "react";
import { Bell, MessageCircle, Calendar, ChevronRight, X } from "lucide-react";

export default function MentorNotifications({
  notifications,
  requests,
  notifRef,
  setShowNotifications,
  setExternalOpenRequest,
  navigate,
  setNotifications,
}) {
  const allEmpty = notifications.length === 0 && requests.length === 0;

  return (
    <div
      ref={notifRef}
      className="
        w-full bg-card/95 backdrop-blur-2xl 
        border border-border/50 rounded-[2rem] 
        shadow-2xl shadow-black/20 overflow-hidden
      "
    >
      {/* HEADER */}
      <div className="px-5 py-4 border-b border-border/50 flex items-center justify-between bg-foreground/[0.02]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-500">
            <Bell size={14} strokeWidth={2.5} />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-foreground/80">
            Updates
          </h3>
        </div>
        <button
          onClick={() => setShowNotifications(false)}
          className="p-1 rounded-md hover:bg-foreground/5 text-foreground/30 hover:text-foreground transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* CONTENT AREA */}
      <div className="max-h-[380px] overflow-y-auto custom-scrollbar p-3 space-y-2">
        {allEmpty ? (
          <div className="py-10 text-center">
            <p className="text-xs font-medium text-foreground/30">Everything caught up!</p>
          </div>
        ) : (
          <>
            {/* RENDER NOTIFICATIONS (Messages, System) */}
            {notifications.map((n, idx) => {
              const isMsg = n.type?.includes("message");
              return (
                <div
                  key={`n-${idx}`}
                  className="group relative p-3 rounded-2xl bg-foreground/[0.02] border border-border/50 hover:border-cyan-500/30 hover:bg-foreground/[0.04] transition-all duration-300"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isMsg ? 'text-emerald-500' : 'text-cyan-500'}`}>
                      {isMsg ? "New Message" : "System Update"}
                    </span>
                    <span className="text-[9px] font-medium text-foreground/20">
                      {new Date().toLocaleDateString()}
                    </span>
                  </div>
                  
                  <p className="text-xs text-foreground/60 leading-relaxed line-clamp-2">
                    {n.message?.text || n.message || "You have a new update"}
                  </p>

                  <button
                    onClick={() => {
                      if (n.conversationId) navigate(`/chat/${n.conversationId}`);
                      setNotifications((prev) => prev.filter((_, i) => i !== idx));
                    }}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-xl bg-foreground/[0.03] hover:bg-cyan-500 hover:text-white text-[10px] font-bold transition-all"
                  >
                    {isMsg ? <MessageCircle size={12} /> : <ChevronRight size={12} />}
                    {isMsg ? "Reply Now" : "Dismiss"}
                  </button>
                </div>
              );
            })}

            {/* RENDER REQUESTS */}
            {requests.map((r) => (
              <div
                key={r._id}
                className="group p-3 rounded-2xl bg-cyan-500/5 border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300"
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={12} className="text-cyan-500" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600">
                      Session Request
                    </span>
                  </div>
                </div>

                <div className="mt-2 space-y-0.5">
                  <p className="text-xs font-bold text-foreground/80">{r.studentName || "Student"}</p>
                  <p className="text-[10px] font-medium text-foreground/40 italic">
                    {r.slot?.day} • {r.slot?.from} – {r.slot?.to}
                  </p>
                </div>

                <button
                  onClick={() => {
                    setExternalOpenRequest(r);
                    setShowNotifications(false);
                  }}
                  className="mt-3 w-full py-2 rounded-xl bg-cyan-500 text-white shadow-lg shadow-cyan-500/20 text-[10px] font-bold hover:bg-cyan-600 transition-all"
                >
                  View Details & Approve
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      
    </div>
  );
}