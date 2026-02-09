import { useEffect, useMemo, useRef, useState } from "react";
import Spinner from "./Spinner";
import Toast from "./Toast";
import { api } from "../api/axios";

export default function AskAssistantPanel({ open, onClose }) {
  const [messages, setMessages] = useState([]); // {role:'user'|'assistant', text}
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "info" });
  const [language, setLanguage] = useState("en");

  const role = useMemo(() => localStorage.getItem("role") || "student", []);
  const quickActions = useMemo(() => {
    if (role === "mentor") {
      return [
        "Summarize my pending requests",
        "Draft a reply to latest request",
        "My next session",
      ];
    }
    if (role === "admin") {
      return [
        "Platform summary",
        "Top demanded skills",
        "Peak booking times",
      ];
    }
    return [
      "How to find a mentor",
      "My next session",
      "Explain React hooks (Somali)",
    ];
  }, [role]);

  const listRef = useRef(null);
  useEffect(() => {
    listRef.current?.scrollTo(0, listRef.current.scrollHeight);
  }, [messages, open]);

  async function sendMessage(text) {
    const msg = (text ?? input).trim();
    if (!msg) return;
    const lang = msg.toLowerCase().includes("somali") || msg.toLowerCase().includes("so") ? "so" : language;
    setMessages((prev) => [...prev, { role: "user", text: msg }]);
    setInput("");
    setLoading(true);
    try {
      const { data } = await api.post("/ask", { message: msg, language: lang });
      const reply = data?.data?.reply || (lang === "so" ? "Waan ka xumahay, ma hubo." : "Sorry, I'm not sure.");
      setMessages((prev) => [...prev, { role: "assistant", text: reply }]);
    } catch (err) {
      console.error("AskAssistant error", err);
      setToast({ message: "Failed to send message.", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end pointer-events-none">
      <div className="m-4 w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900/80 backdrop-blur-md shadow-2xl pointer-events-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
          <p className="text-slate-100 font-semibold">MentorLink Ask Assistant</p>
          <div className="flex items-center gap-2">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="text-xs bg-slate-800 text-slate-200 border border-slate-700 rounded px-2 py-1"
            >
              <option value="en">English</option>
              <option value="so">Somali</option>
            </select>
            <button
              onClick={onClose}
              className="text-xs text-slate-300 hover:text-white"
            >
              Close
            </button>
          </div>
        </div>

        {/* Quick actions */}
        <div className="px-4 py-2 flex flex-wrap gap-2">
          {quickActions.map((q) => (
            <button
              key={q}
              onClick={() => sendMessage(q)}
              className="px-2 py-1 rounded bg-sky-500/20 text-sky-200 border border-sky-500/40 text-xs hover:bg-sky-500/30"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div ref={listRef} className="px-4 py-3 max-h-80 overflow-y-auto space-y-3">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`rounded-lg px-3 py-2 text-sm ${m.role === "user" ? "bg-slate-800 text-slate-100" : "bg-sky-900/40 text-slate-100"}`}
            >
              {m.text}
            </div>
          ))}
          {loading && (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Spinner className="border-white/60" />
              <span>Thinking…</span>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-slate-700 flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
            placeholder="Ask something…"
            className="flex-1 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 px-3 py-2 text-sm"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading}
            className="px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm disabled:opacity-60"
          >
            Send
          </button>
        </div>

        {/* Toast */}
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ message: "", type: "info" })}
        />
      </div>
    </div>
  );
}
