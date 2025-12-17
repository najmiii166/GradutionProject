// frontend/src/components/ChatPanel.jsx
import { useEffect, useRef, useState } from "react";
import { api } from "../api/axios";
import Spinner from "./Spinner";
import Toast from "./Toast";
import MentorProfileModal from "./mentor/MentorProfileModal";
import StudentProfileModal from "./mentor/StudentProfileModal";
import { createSocket } from "../socket";

export default function ChatPanel({ currentUserId, initialTarget }) {
  const role = localStorage.getItem("role");

  const [conversations, setConversations] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);

  const [selectedConvId, setSelectedConvId] = useState("");
  const [selectedPartner, setSelectedPartner] = useState(null);

  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [input, setInput] = useState("");
  const [toast, setToast] = useState(null);

  const socketRef = useRef(null);
  const scrollRef = useRef(null);

  const listUrl = role === "student" ? "/chat/student" : "/chat/mentor";

  const loadConversations = async () => {
    try {
      setLoadingConversations(true);
      const { data } = await api.get(listUrl);
      // Filter out invalid conversations that lack participant display names
      const convos = (data || []).filter(
        (c) => (c.studentName && String(c.studentName).trim() !== "") || (c.mentorName && String(c.mentorName).trim() !== "")
      );
      setConversations(convos);
    } catch (err) {
      console.error("Conversations error:", err);
      setToast("Failed to load conversations.");
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadMessages = async (conversationId, { silent = false } = {}) => {
    if (!conversationId) return;
    try {
      if (!silent) setLoadingMessages(true);
      const { data } = await api.get(`/chat/${conversationId}/messages`);
      setMessages(data || []);
    } catch (err) {
      console.error("Messages load error:", err);
      setToast("Failed to load messages.");
    } finally {
      if (!silent) setLoadingMessages(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  /* SOCKET SETUP */
  useEffect(() => {
    const s = createSocket();
    socketRef.current = s;

    return () => {
      s.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Auto-open conversation when ?mentorId= or ?studentId= is passed
  useEffect(() => {
    (async () => {
      if (!initialTarget?.id) return;

      try {
        const mentorId =
          role === "student" ? initialTarget.id : currentUserId;
        const studentId =
          role === "student" ? currentUserId : initialTarget.id;

        const { data } = await api.post("/chat/open", {
          mentorId,
          studentId,
        });

        if (data && data._id) {
          setSelectedConvId(data._id);
          setSelectedPartner({
            _id: initialTarget.id,
            fullName: initialTarget.name,
          });
          loadMessages(data._id);
        }
      } catch (e) {
        console.error("Open convo error:", e);
      }
    })();
  }, [initialTarget?.id, currentUserId]);

  /* SOCKET LISTENERS */
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !selectedConvId) return;

    socket.emit("join_conversation", { conversationId: selectedConvId });

    const handleNewMessage = (msg) => {
      if (String(msg.conversationId) === String(selectedConvId)) {
        setMessages((prev) => [...prev, msg]);
      }

      setConversations((prev) =>
        prev.map((c) =>
          c._id === msg.conversationId
            ? { ...c, lastMessage: msg.text, lastMessageAt: msg.createdAt }
            : c
        )
      );
    };

    socket.on("new_message", handleNewMessage);

    return () => {
      socket.emit("leave_conversation", { conversationId: selectedConvId });
      socket.off("new_message", handleNewMessage);
    };
  }, [selectedConvId]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSelectConversation = (conv) => {
    const partnerName = conv.studentName || conv.mentorName || "User";

    // set conversation selected (messages) — we'll lazily resolve the partner id when needed
    setSelectedPartner({ _id: conv._id, fullName: partnerName });
    setSelectedConvId(conv._id);
    loadMessages(conv._id);
  };

  // Profile modal state
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [profileType, setProfileType] = useState(null); // 'mentor' | 'student'

  // Open a participant's profile for a given conversation id or object
  const openProfile = async (convOrId, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    try {
      setProfileOpen(true);
      setProfileLoading(true);
      setProfileData(null);

      const convoId = typeof convOrId === "string" ? convOrId : convOrId?._id;
      if (!convoId) {
        setProfileLoading(false);
        return;
      }

      // Get participants (mentor / student ids)
      const { data: parts } = await api.get(`/chat/${convoId}/participants`);
      const partnerId = role === "student" ? parts.mentor : parts.student;

      if (!partnerId) {
        setProfileLoading(false);
        setProfileData(null);
        return;
      }

      if (role === "student") {
        // student viewing mentor
        setProfileType("mentor");
        const { data } = await api.get(`/mentor/mentors/${partnerId}`);
        setProfileData(data || null);
      } else {
        // mentor viewing student
        setProfileType("student");
        const { data } = await api.get(`/mentor/students/${partnerId}`);
        setProfileData(data || null);
      }
    } catch (err) {
      console.error("Failed to load profile:", err);
      setProfileData(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    const txt = input.trim();
    if (!txt || !selectedConvId) return;

    try {
      const { data } = await api.post(`/chat/${selectedConvId}/messages`, {
        text: txt,
      });
      setMessages((prev) => [...prev, data]);
      setInput("");
    } catch (err) {
      console.error("Send message error:", err);
      setToast("Failed to send message.");
    }
  };

  return (
    <div className="grid grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)] gap-4">
      {/* SIDEBAR */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3 flex flex-col">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-200">
            Conversations
          </h3>
          <button
            onClick={loadConversations}
            className="text-[10px] text-slate-400 hover:text-slate-200"
          >
            Refresh
          </button>
        </div>

        {loadingConversations ? (
          <div className="flex-1 flex items-center justify-center">
            <Spinner className="border-white/60" />
          </div>
        ) : conversations.length === 0 ? (
          <p className="text-xs text-slate-400">No conversations yet.</p>
        ) : (
          <ul className="flex-1 overflow-y-auto space-y-1">
            {conversations.map((c) => (
              <li key={c._id}>
                <div
                  onClick={() => handleSelectConversation(c)}
                  role="button"
                  tabIndex={0}
                  className={`w-full text-left rounded-xl px-3 py-2 text-xs ${
                    selectedConvId === c._id
                      ? "bg-sky-500/20 border border-sky-500/60 text-sky-100"
                      : "bg-slate-900/70 border border-slate-800 text-slate-200 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{c.studentName || c.mentorName}</span>
                      <button
                        onClick={(e) => openProfile(c, e)}
                        className="text-[11px] text-slate-400 hover:text-slate-200"
                        title="View profile"
                      >
                        ℹ️
                      </button>
                    </div>

                    {c.lastMessageAt && (
                      <span className="text-[10px] text-slate-400">
                        {new Date(c.lastMessageAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>

                  {c.lastMessage && (
                    <p className="mt-0.5 text-[11px] text-slate-400 truncate">{c.lastMessage}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* CHAT WINDOW */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-3 flex flex-col">
        {selectedConvId && selectedPartner ? (
          <>
            {/* Header */}
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Chat</p>
                  <p className="text-xs font-semibold text-slate-100">{selectedPartner.fullName}</p>
                </div>
                <button
                  onClick={() => openProfile(selectedConvId)}
                  className="text-[12px] bg-slate-800 px-2 py-1 rounded text-slate-200 hover:bg-slate-700"
                  title="View profile"
                >
                  Profile
                </button>
              </div>
              <div>
                {/* Call button is handled elsewhere in app; keep space for it */}
              </div>
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto mb-2 space-y-1"
            >
              {loadingMessages ? (
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Spinner className="border-white/60" />
                  <span>Loading messages…</span>
                </div>
              ) : messages.length === 0 ? (
                <p className="text-[11px] text-slate-400">
                  No messages yet. Start the conversation!
                </p>
              ) : (
                messages.map((m) => {
                  const senderId = m.sender?._id || m.sender;
                  const isMe = String(senderId) === String(currentUserId);

                  return (
                    <div
                      key={m._id}
                      className={`flex ${
                        isMe ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-[75%] rounded-2xl px-3 py-1.5 text-xs ${
                          isMe
                            ? "bg-sky-500 text-white"
                            : "bg-slate-700 text-slate-50"
                        }`}
                      >
                        <p>{m.text}</p>
                        <p className="mt-0.5 text-[9px] opacity-70 text-right">
                          {m.createdAt
                            ? new Date(m.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : ""}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Send bar */}
            <form
              className="flex items-center gap-2 mt-1"
              onSubmit={handleSend}
            >
              <input
                type="text"
                className="flex-1 rounded-full bg-slate-900/80 border border-slate-600 px-3 py-1.5 text-xs text-white outline-none focus:ring-1 focus:ring-sky-400"
                placeholder="Type a message…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />

              <button
                type="submit"
                disabled={!input.trim()}
                className="rounded-full bg-sky-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-sky-400 disabled:opacity-50"
              >
                Send
              </button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
            Select a conversation to start chatting
          </div>
        )}
      </div>

      {/* TOAST */}
      {profileType === "mentor" ? (
        <MentorProfileModal
          open={profileOpen}
          loading={profileLoading}
          profile={profileData}
          fullName={profileData?.fullName || selectedPartner?.fullName}
          onClose={() => setProfileOpen(false)}
        />
      ) : profileType === "student" ? (
        <StudentProfileModal
          open={profileOpen}
          loading={profileLoading}
          profile={profileData}
          onClose={() => setProfileOpen(false)}
        />
      ) : null}

      <Toast
        message={toast}
        onClose={() => setToast(null)}
        type={
          toast?.toLowerCase()?.includes("fail") ? "error" : "info"
        }
      />
    </div>
  );
}
