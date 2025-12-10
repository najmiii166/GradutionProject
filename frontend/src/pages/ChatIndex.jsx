// src/pages/ChatIndex.jsx

import { useEffect, useState } from "react";
import { api, setAuthToken } from "../api/axios";
import { Navigate, useNavigate } from "react-router-dom";
import Avatar from "../components/Avatar";

export default function ChatIndex() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const navigate = useNavigate();

  if (!token) return <Navigate to="/login" />;
  setAuthToken(token);

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadChats = async () => {
    try {
      const url = role === "student" ? "/chat/student" : "/chat/mentor";
      const { data } = await api.get(url);
      setConversations(data || []);
    } catch (err) {
      console.error("Chat list error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const mentor = params.get("mentor");
      const studentFromQuery = params.get("student");

      const user = JSON.parse(localStorage.getItem("user") || "{}");

      if (mentor) {
        try {
          const open = await api.post("/chat/open", {
            mentorId: mentor,
            studentId: studentFromQuery || user._id,
          });

          if (open.data?._id) {
            navigate(`/chat/${open.data._id}`);
            return;
          }
        } catch (err) {
          console.error("open chat failed", err);
        }
      }

      await loadChats();
    })();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6">
      <h1 className="text-xl font-bold mb-4">Messages</h1>

      {loading ? (
        <p className="text-slate-400">Loading chats...</p>
      ) : conversations.length === 0 ? (
        <p className="text-slate-400">No conversations yet.</p>
      ) : (
        <div className="space-y-2">
          {conversations.map((c) => {
            const title = c.studentName || c.mentorName;
            const when = c.lastMessageAt;

            return (
              <button
                key={c._id}
                onClick={() => navigate(`/chat/${c._id}`)}
                className="w-full p-3 rounded-lg bg-slate-800 hover:bg-slate-700 transition border border-slate-700 text-left"
              >
                <div className="flex items-center gap-3">
                  <Avatar name={title} size={40} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold truncate">{title}</p>
                      <span className="text-[10px] text-slate-400">
                        {when
                          ? new Date(when).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : ""}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 truncate mt-0.5">
                      {c.lastMessage || "No messages yet"}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
