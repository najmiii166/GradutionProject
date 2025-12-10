// frontend/src/components/chat/ChatSidebar.jsx

import React from "react";

export default function ChatSidebar({
  conversations = [],
  activeConversationId,
  onSelectConversation,
  query,
  onQueryChange,
  role,
}) {
  const filtered = (conversations || []).filter((c) => {
    const title = (role === "student" ? c.mentorName : c.studentName) || "";
    const preview = c.lastMessage || "";
    const q = (query || "").trim().toLowerCase();
    if (!q) return true;
    return title.toLowerCase().includes(q) || preview.toLowerCase().includes(q);
  });

  return (
    <aside className="h-full w-full bg-slate-900 text-white border-r border-slate-800">
      <div className="p-4 border-b border-slate-800">
        <input
          value={query}
          onChange={(e) => onQueryChange && onQueryChange(e.target.value)}
          className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600"
          placeholder="Search conversations"
        />
      </div>
      <div className="overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="p-4 text-slate-400 text-sm">No conversations.</p>
        ) : (
          filtered.map((c) => {
            const isActive = String(activeConversationId) === String(c._id);
            return (
              <button
                key={c._id}
                onClick={() => onSelectConversation && onSelectConversation(c._id)}
                className={`w-full text-left px-4 py-3 border-b border-slate-800 hover:bg-slate-800 transition ${
                  isActive ? "bg-slate-800" : "bg-transparent"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium truncate">
                    {role === "student" ? c.mentorName : c.studentName}
                  </span>
                </div>
                <div className="text-[12px] text-slate-400 truncate">{c.lastMessage}</div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
