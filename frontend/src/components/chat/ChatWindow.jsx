// frontend/src/components/chat/ChatWindow.jsx

import React, { useEffect, useMemo, useRef } from "react";

export default function ChatWindow({
  user,
  serverOrigin,
  messages = [],
  onSendText,
  onSendFile,
  loading,
}) {
  const listRef = useRef(null);

  useEffect(() => {
    if (!listRef.current) return;
    const el = listRef.current;
    el.scrollTop = el.scrollHeight;
  }, [messages]);

  // Group messages by consecutive same sender
  const grouped = useMemo(() => {
    const res = [];
    let current = null;
    (messages || []).forEach((m) => {
      const senderId = m?.sender?._id || m?.sender;
      if (!current || current.senderId !== String(senderId)) {
        current = {
          senderId: String(senderId),
          senderName: m?.sender?.fullName || m?.sender?.name || (String(senderId) === String(user?._id || user?.id) ? "You" : "User"),
          items: [m],
        };
        res.push(current);
      } else {
        current.items.push(m);
      }
    });
    return res;
  }, [messages, user]);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    onSendFile && onSendFile(f);
    e.target.value = "";
  };

  return (
    <section className="flex flex-col h-full bg-slate-900 text-white">
      {/* Header */}
      <div className="h-12 flex items-center px-4 border-b border-slate-800">
        <div className="text-sm opacity-80">Chat</div>
      </div>

      {/* Message list */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
        {loading ? (
          <div className="text-slate-400 text-sm">Loading…</div>
        ) : grouped.length === 0 ? (
          <div className="text-slate-500 text-sm">No messages yet.</div>
        ) : (
          grouped.map((g, idx) => (
            <div key={idx} className="space-y-2">
              {/* Sender header */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-slate-800 flex items-center justify-center text-xs">{g.senderName?.[0] || "U"}</div>
                <div className="text-sm font-medium">{g.senderName}</div>
              </div>
              {/* Block messages */}
              <div className="space-y-2">
                {g.items.map((m) => (
                  <div key={m._id || m.fileUrl || m.createdAt} className="group">
                    <div className="flex items-start">
                      <div className="flex-1">
                        {m.type === "image" && m.fileUrl ? (
                          <img
                            src={`${serverOrigin}${m.fileUrl}`}
                            alt={m.fileName || "image"}
                            className="rounded-md border border-slate-800 shadow-sm max-w-[420px]"
                          />
                        ) : m.type === "file" && m.fileUrl ? (
                          <div className="rounded-md border border-slate-800 shadow-sm bg-slate-800/40 w-[340px]">
                            <div className="px-4 py-3">
                              <div className="text-sm font-medium truncate">{m.fileName || "Attachment"}</div>
                              <div className="text-[12px] opacity-80 truncate">{(m.mimeType || "file")}{m.fileSize ? ` · ${Math.max(1, Math.round(m.fileSize / 1024))} KB` : ""}</div>
                            </div>
                            <div className="px-4 pb-3 flex gap-2 items-center">
                              <button
                                className="px-3 py-1 rounded bg-slate-700 hover:bg-slate-600 text-sm"
                                onClick={(e) => {
                                  const url = `${serverOrigin}${m.fileUrl}`;
                                  const a = document.createElement('a');
                                  a.href = url;
                                  a.download = m.fileName || '';
                                  document.body.appendChild(a);
                                  a.click();
                                  a.remove();
                                  const btn = e.currentTarget;
                                  const original = btn.textContent;
                                  btn.textContent = 'Downloading…';
                                  btn.disabled = true;
                                  setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 2000);
                                }}
                              >
                                Download
                              </button>
                              <a href={`${serverOrigin}${m.fileUrl}`} target="_blank" rel="noreferrer" className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sm">Open</a>
                              <span className="text-[11px] text-slate-400">{(m.mimeType || '').split('/')[1] || 'file'}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-md border border-slate-800 bg-slate-800/40 px-4 py-2 text-sm">
                            {m.text}
                          </div>
                        )}
                        {/* Timestamp + reactions */}
                        <div className="flex items-center gap-2 mt-1">
                          <div className="text-[11px] text-slate-400">
                            {new Date(m.createdAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                          {Array.isArray(m.reactions) && m.reactions.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {Object.entries((m.reactions || []).reduce((acc, r) => { const k = r.emoji; acc[k] = (acc[k] || 0) + 1; return acc; }, {})).map(([emo, count]) => (
                                <span key={emo} className="px-2 py-0.5 rounded-full bg-slate-800 text-[11px]">{emo} {count}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Send bar */}
      <div className="h-16 border-t border-slate-800 px-4 flex items-center gap-2">
        <label className="w-9 h-9 rounded-md bg-slate-800 flex items-center justify-center cursor-pointer" title="Attach file">
          📎
          <input type="file" className="hidden" onChange={handleFileChange} />
        </label>
        <input
          className="flex-1 rounded-md bg-slate-800 border border-slate-700 px-3 py-2 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-600"
          placeholder="Write a message"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const val = e.currentTarget.value.trim();
              if (val) {
                onSendText && onSendText(val);
                e.currentTarget.value = "";
              }
            }
          }}
        />
        <button
          className="px-4 py-2 rounded-md bg-sky-600 hover:bg-sky-500 text-sm"
          onClick={(e) => {
            const input = e.currentTarget.parentElement?.querySelector("input[type='text'],input:not([type])");
            const val = input?.value?.trim();
            if (val) {
              onSendText && onSendText(val);
              if (input) input.value = "";
            }
          }}
        >
          Send
        </button>
      </div>
    </section>
  );
}
