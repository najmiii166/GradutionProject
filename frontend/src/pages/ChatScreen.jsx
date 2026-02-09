// src/pages/ChatScreen.jsx
import { useEffect, useRef, useState, useContext, useMemo } from "react";
import { api, setAuthToken } from "../api/axios";
import { useNavigate, useParams } from "react-router-dom";
import { SocketContext } from "../Contexts/SocketContext";
import { 
  Search, 
  Send, 
  Paperclip, 
  Mic, 
  MoreVertical, 
  Smile, 
  Reply, 
  Trash2, 
  Edit3, 
  X,
  ChevronLeft,
  User
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import Spinner from "../components/Spinner";
import Toast from "../components/Toast";
import Avatar from "../components/Avatar";
import MentorProfileModal from "../components/mentor/MentorProfileModal";
import StudentProfileModal from "../components/mentor/StudentProfileModal";

export default function ChatScreen() {
  const navigate = useNavigate();
  const { id: routeConversationId } = useParams();

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  // Handle auth and axios token setup in an effect,
  // so we don't perform navigation or side effects during render.
  useEffect(() => {
    if (!token) {
      navigate("/login");
    } else {
      setAuthToken(token);
    }
  }, [token, navigate]);

  const socketContext = useContext(SocketContext);
  const {
    socket,
    markAsRead,
    setActiveId: setGlobalActiveId,
    unreadCounts = {},
  } = socketContext || {};

  // -----------------------------------------
  // STATE
  // -----------------------------------------
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [activePartnerName, setActivePartnerName] = useState("");
  const [activePartnerId, setActivePartnerId] = useState(null);
  const [showMentorModal, setShowMentorModal] = useState(false);
  const [mentorLoading, setMentorLoading] = useState(false);
  const [mentorProfile, setMentorProfile] = useState(null);

  const [showStudentModal, setShowStudentModal] = useState(false);
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentProfile, setStudentProfile] = useState(null);

  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");
  const [text, setText] = useState("");

  const [loadingConvos, setLoadingConvos] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const [theirTyping, setTheirTyping] = useState(false);
  const [theirStatus, setTheirStatus] = useState("offline");
  const [seenData, setSeenData] = useState({});

  const [toast, setToast] = useState(null);

  const messagesRef = useRef(null);
  const messageRefs = useRef({});

  const [selectedMessageId, setSelectedMessageId] = useState(null);
  const [showEmojiFor, setShowEmojiFor] = useState(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);
  const [replyTarget, setReplyTarget] = useState(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);

  const recorderRef = useRef(null);
  const streamRef = useRef(null);
  const timerRef = useRef(null);
  const lastTypingRef = useRef(0);

  // Sync active conversation with global socket context
  useEffect(() => {
    if (activeConversationId) {
      setGlobalActiveId(activeConversationId);
      markAsRead(activeConversationId);
    }

    return () => {
      setGlobalActiveId(null);
    };
  }, [activeConversationId, setGlobalActiveId, markAsRead]);

  const apiBase = (api?.defaults?.baseURL || "").replace(/\/$/, "");
  const serverOrigin = apiBase.replace(/\/api$/i, "");

  // -----------------------------------------
  // CORE LOGIC (UNTOUCHED)
  // -----------------------------------------
  useEffect(() => {
    const load = async () => {
      setLoadingConvos(true);
      try {
        const url = role === "student" ? "/chat/student" : "/chat/mentor";
        const { data } = await api.get(url);
        const convos = (data || []).filter(c => c.studentName || c.mentorName);
        setConversations(convos);
        if (routeConversationId) {
          if (data.some(c => String(c._id) === String(routeConversationId))) 
            setActiveConversationId(routeConversationId);
        }
      } catch { setToast("Failed to load conversations"); }
      finally { setLoadingConvos(false); }
    };
    load();
  }, [routeConversationId, role]);

  useEffect(() => {
    if (!activeConversationId) return;
    
    // Sync with global context for unread tracking
    if (setGlobalActiveId) setGlobalActiveId(activeConversationId);
    if (markAsRead) markAsRead(activeConversationId);

    const conv = conversations.find((c) => c._id === activeConversationId);
    if (conv) {
      setActivePartnerName(role === "student" ? conv.mentorName : conv.studentName);
      setActivePartnerId(role === "student" 
        ? conv.mentorId || conv.mentor?._id 
        : conv.studentId || conv.student?._id
      );
    }

    const loadMsgs = async () => {
      setLoadingMsgs(true);
      try {
        const { data } = await api.get(`/chat/${activeConversationId}/messages`);
        setMessages(data || []);
        // Mark last message seen logic...
        const last = data[data.length - 1];
        if (last && last.sender !== user._id && socket) {
          socket.emit("seen", { conversationId: activeConversationId, messageId: last._id });
        }
      } catch { setToast("Failed to load messages"); }
      finally { setLoadingMsgs(false); }
    };
    loadMsgs();

    return () => {
      // Clear global active ID when leaving chat
      if (setGlobalActiveId) setGlobalActiveId(null);
    };
  }, [activeConversationId, conversations, role, user._id, socket, setGlobalActiveId, markAsRead]);

  useEffect(() => {
    if (!socket || !activeConversationId) return;
    socket.emit("user_online", user._id);
    socket.emit("get_user_status", activePartnerId);
    socket.emit("join_conversation", { conversationId: activeConversationId });

    socket.on("new_message", (msg) => {
      setMessages((prev) => {
        if (String(msg.conversationId) === String(activeConversationId)) {
          if (prev.some((m) => String(m._id) === String(msg._id))) return prev;
          return [...prev, msg];
        }
        return prev;
      });
      if (msg.sender !== user._id && String(msg.conversationId) === String(activeConversationId)) {
        socket.emit("seen", { conversationId: activeConversationId, messageId: msg._id });
      }
    });

    socket.on("typing", (data) => {
      if (data.conversationId === activeConversationId && data.userId !== user._id) {
        setTheirTyping(true);
        setTimeout(() => setTheirTyping(false), 1500);
      }
    });

    socket.on("seen", (data) => setSeenData((prev) => ({ ...prev, [data.messageId]: true })));
    socket.on("user_status", (data) => {
      if (String(data.userId) === String(activePartnerId)) setTheirStatus(data.status);
    });
    socket.on("message:updated", (msg) => {
      setMessages((prev) => prev.map((m) => String(m._id) === String(msg._id) ? { ...m, ...msg } : m));
    });
    socket.on("message:deleted", (msg) => {
      setMessages((prev) => prev.map((m) => String(m._id) === String(msg._id) ? { ...m, deleted: true, text: "" } : m));
    });
    socket.on("message:react", (msg) => {
      setMessages((prev) => prev.map((m) => String(m._id) === String(msg._id) ? { ...m, reactions: msg.reactions } : m));
    });

    return () => {
      socket.off("new_message"); socket.off("typing"); socket.off("seen");
      socket.off("user_status"); socket.off("message:updated");
      socket.off("message:deleted"); socket.off("message:react");
    };
  }, [socket, activeConversationId, activePartnerId, user._id]);

  const sendMessage = async () => {
    if (!text.trim() && !attachment) return;

    // OPTIMISTIC UPDATE
    const tempId = "temp-" + Date.now();
    const tempMsg = {
      _id: tempId,
      sender: user._id,
      text: text,
      createdAt: new Date().toISOString(),
      status: "pending",
      conversationId: activeConversationId,
      fileUrl: attachmentPreview && !attachment.file ? attachmentPreview : null, 
      type: attachment ? (attachment.file?.type.startsWith('image') ? 'image' : 'file') : 'text'
    };

    setMessages((prev) => [...prev, tempMsg]);
    setText("");
    setAttachment(null);
    setAttachmentPreview(null);

    try {
      let form = new FormData();
      if (attachment) {
        const fileToSend = attachment.file || attachment;
        form.append("file", fileToSend);
        if (attachment.duration) form.append("duration", attachment.duration);
      }
      if (tempMsg.text.trim()) form.append("text", tempMsg.text);
      
      const { data } = await api.post(`/chat/${activeConversationId}/messages`, form, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      // RECONCILIATION
      setMessages((prev) => 
        prev.map((m) => (m._id === tempId ? { ...data, status: "sent" } : m))
      );
    } catch (err) {
      setToast("Message transmission failed");
      setMessages((prev) => 
        prev.map((m) => (m._id === tempId ? { ...m, status: "error" } : m))
      );
    }
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    if (socket && activeConversationId) {
      const now = Date.now();
      if (now - lastTypingRef.current > 3000) {
        socket.emit("typing", { conversationId: activeConversationId, userId: user._id });
        lastTypingRef.current = now;
      }
    }
  };

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      recorderRef.current = recorder;
      chunksRef.current = [];
      setRecordTime(0);
      setIsRecording(true);
      const start = Date.now();
      timerRef.current = setInterval(() => setRecordTime(Math.floor((Date.now() - start) / 1000)), 250);
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        clearInterval(timerRef.current);
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voice-${Date.now()}.webm`, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAttachment({ file, duration: recordTime });
        setAttachmentPreview(url);
        streamRef.current?.getTracks().forEach((t) => t.stop());
      };
      recorder.start();
    } catch { setToast("Microphone access denied"); }
  }

  function stopRecording() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
    setIsRecording(false);
  }

  const handleEdit = (m) => {
    const newText = prompt("Edit message:", m.text);
    if (newText != null && newText !== m.text) socket.emit("message:edit", { messageId: m._id, text: newText });
    setSelectedMessageId(null);
  };

  const handleDelete = (m) => {
    if (confirm("Delete for everyone?")) socket.emit("message:delete", { messageId: m._id });
    setSelectedMessageId(null);
  };

  const handleReact = (id, emoji) => {
    socket.emit("message:react", { messageId: id, emoji });
    setShowEmojiFor(null);
    setSelectedMessageId(null);
  };

  const filtered = conversations.filter(c => 
    (role === "student" ? c.mentorName : c.studentName)?.toLowerCase().includes(query.toLowerCase())
  );

  const groupedMessages = useMemo(() => {
    const groups = [];
    let lastDate = "";
    messages.forEach((m) => {
      const d = new Date(m.createdAt);
      const dateStr = d.toDateString();
      let label = dateStr;
      
      const today = new Date().toDateString();
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      
      if (dateStr === today) label = "Today";
      else if (dateStr === yesterday) label = "Yesterday";

      if (label !== lastDate) {
        groups.push({ type: "date", label, id: label });
        lastDate = label;
      }
      groups.push({ type: "msg", data: m, id: m._id });
    });
    return groups;
  }, [messages]);

  // -----------------------------------------
  // RENDER (Dossier Theme Update)
  // -----------------------------------------
  return (
    <div className="flex flex-col md:flex-row h-screen bg-background text-foreground selection:bg-cyan-500/30 overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <div className="flex flex-col w-full md:w-80 bg-foreground/[0.02] border-b md:border-b-0 md:border-r border-border/40 backdrop-blur-md">
        <div className="p-6 border-b border-border/20">
          <h2 className="text-xl font-black uppercase tracking-widest  mb-4">
            chat 
          </h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground/30" />
            <input
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-foreground/[0.03] border border-border/20 text-[10px] font-bold uppercase tracking-widest focus:border-cyan-500/50 outline-none transition-all"
              placeholder="SEARCH BY NAME..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
          {loadingConvos ? (
            <div className="p-10 opacity-20"><Spinner /></div>
          ) : filtered.length === 0 ? (
            <p className="text-[10px] text-center font-bold text-foreground/20 uppercase mt-10 tracking-widest">No active chats</p>
          ) : (
            filtered.map((c) => {
              const name = role === "student" ? c.mentorName : c.studentName;
              const active = activeConversationId === c._id;
              const count = unreadCounts?.[c._id] || 0;
              return (
                <button
                  key={c._id}
                  onClick={() => {
                    setActiveConversationId(c._id);
                    if (markAsRead) markAsRead(c._id);
                  }}
                  className={`flex items-center justify-between w-full gap-3 p-3 rounded-xl transition-all duration-300 group ${
                    active 
                    ? "bg-cyan-500/10 border border-cyan-500/20" 
                    : "hover:bg-foreground/[0.03] border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative shrink-0">
                      <Avatar name={name} size={42} />
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-background rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                      </div>
                    </div>
                    <div className="min-w-0 text-left">
                      <p className={`text-[12px] font-bold tracking-tight truncate ${active ? "text-cyan-400" : "text-foreground/80"}`}>
                        {name}
                      </p>
                      <p className="text-[9px] font-medium text-foreground/40 truncate uppercase tracking-tighter">
                        {c.lastMessage || "Establish connection..."}
                      </p>
                    </div>
                  </div>

                  {!active && count > 0 && (
                    <div className="ml-2 flex items-center justify-center">
                      <div className="relative inline-flex">
                        <span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60 animate-ping" />
                        <span className="relative inline-flex h-5 min-w-[1.25rem] px-1.5 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-black text-white leading-none shadow-md shadow-cyan-500/40">
                          {count > 9 ? "9+" : count}
                        </span>
                      </div>
                    </div>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* CHAT PANEL */}
      {activeConversationId ? (
        <div className="flex flex-col flex-1 bg-background relative">
          
          {/* PANEL HEADER */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-border/20 bg-foreground/[0.01] backdrop-blur-xl z-20">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setActiveConversationId(null)}
                className="md:hidden p-2 text-foreground/40"
              >
                <ChevronLeft />
              </button>
              <div 
                className="flex items-center gap-3 cursor-pointer group"
                onClick={async () => {
                  try {
                    let partnerId = activePartnerId;
                    if (!partnerId) {
                      const { data: parts } = await api.get(`/chat/${activeConversationId}/participants`);
                      partnerId = role === "student" ? parts.mentor : parts.student;
                      if (partnerId) setActivePartnerId(partnerId);
                    }
                    if (role === "student") {
                      setShowMentorModal(true); setMentorLoading(true);
                      const { data } = await api.get(`/mentor/mentors/${partnerId}`);
                      setMentorProfile(data);
                    } else {
                      setShowStudentModal(true); setStudentLoading(true);
                      const { data } = await api.get(`/mentor/students/${partnerId}`);
                      setStudentProfile(data);
                    }
                  } catch { setToast("Failed to load node data"); }
                  finally { setMentorLoading(false); setStudentLoading(false); }
                }}
              >
                <Avatar name={activePartnerName} size={44} />
                <div>
                  <h3 className="text-[14px] font-black uppercase tracking-tight text-foreground/90 group-hover:text-cyan-500 transition-colors">
                    {activePartnerName}
                  </h3>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-1.5 h-1.5 rounded-full ${theirStatus === "online" ? "bg-emerald-500 animate-pulse" : "bg-foreground/20"}`} />
                    <span className="text-[9px] font-black uppercase tracking-widest text-foreground/30">
                      {theirTyping ? "Transmitting..." : theirStatus}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MESSAGE AREA */}
          <div
            ref={messagesRef}
            className="flex-1 overflow-y-auto px-6 py-8 space-y-6 custom-scrollbar bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-cyan-500/[0.02] via-transparent to-transparent"
          >
            {loadingMsgs ? (
              <div className="flex items-center justify-center h-full opacity-20"><Spinner /></div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-20 grayscale">
                <User size={48} className="mb-4 text-cyan-500" />
                <p className="text-[10px] font-black uppercase tracking-[0.4em]">Zero data packets found</p>
              </div>
            ) : (
              groupedMessages.map((item, idx) => {
                if (item.type === "date") {
                   return (
                     <div key={item.id} className="flex justify-center my-4">
                        <span className="px-3 py-1 bg-foreground/[0.05] rounded-full text-[10px] font-bold uppercase tracking-widest text-foreground/40 border border-border/10">
                          {item.label}
                        </span>
                     </div>
                   );
                }
                const m = item.data;
                const isMe = String(m.sender?._id || m.sender) === String(user._id);
                return (
                  <motion.div
                    initial={{ opacity: 0, x: isMe ? 10 : -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={m._id}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div className={`flex flex-col ${isMe ? "items-end" : "items-start"} max-w-[80%]`}>
                      <div
                        ref={(el) => (messageRefs.current[m._id] = el)}
                        className={`relative group px-4 py-3 rounded-2xl text-[13px] font-medium leading-relaxed shadow-sm transition-all duration-300 ${
                          isMe
                            ? "bg-cyan-600 text-white rounded-tr-none shadow-cyan-500/10"
                            : "bg-foreground/[0.04] border border-border/20 text-foreground/80 rounded-tl-none"
                        } ${highlightedMessageId === m._id ? "ring-2 ring-cyan-500 ring-offset-2 ring-offset-background" : ""}`}
                        onClick={() => setSelectedMessageId(m._id)}
                      >
                        {/* REPLY THREAD */}
                        {m.replyTo && (
                          <div className={`mb-2 p-2 rounded-lg text-[10px] border-l-2 ${isMe ? "bg-black/10 border-white/40" : "bg-foreground/5 border-cyan-500/40"}`}>
                            {m.replyTo.text?.slice(0, 50) || "Data Packet"}
                          </div>
                        )}

                        {/* PACKET CONTENT */}
                        {m.fileUrl && (
                          <div className="mb-2 overflow-hidden rounded-lg">
                            {m.type === "image" && (
                              <img src={`${serverOrigin}${m.fileUrl}`} className="max-w-full h-auto hover:scale-105 transition-transform" alt="Packet" />
                            )}
                            {m.type === "audio" && (
                              <audio controls src={`${serverOrigin}${m.fileUrl}`} className="w-48 h-8 opacity-80 filter invert" />
                            )}
                            {m.type === "file" && (
                              <a href={`${serverOrigin}${m.fileUrl}`} download className="flex items-center gap-2 p-3 bg-black/20 rounded-xl text-[11px] font-bold uppercase tracking-widest hover:bg-black/40 transition-all">
                                <Paperclip size={14} /> {m.fileName || "Download"}
                              </a>
                            )}
                          </div>
                        )}

                        {!m.deleted ? (
                          <p className="whitespace-pre-wrap">
                            {m.text}
                            {m.edited && <span className="ml-2 text-[8px] uppercase font-black opacity-40">(Modified)</span>}
                          </p>
                        ) : (
                          <p className="italic opacity-40 text-[11px] uppercase font-black tracking-widest">Packet Purged</p>
                        )}

                        {/* PACKET REACTIONS */}
                        {m.reactions?.length > 0 && (
                          <div className="absolute -bottom-3 left-2 flex gap-1 bg-background border border-border/40 rounded-full px-1.5 py-0.5 shadow-xl">
                            {m.reactions.map((r, i) => <span key={idx+i} className="text-[10px]">{r.emoji}</span>)}
                          </div>
                        )}

                        {/* CONTEXT MENU TRIGGER (Icon) */}
                        <div className={`absolute top-0 ${isMe ? "-left-8" : "-right-8"} opacity-0 group-hover:opacity-100 transition-opacity`}>
                            <button className="p-1 text-foreground/20 hover:text-cyan-500"><MoreVertical size={14}/></button>
                        </div>
                      </div>
                      
                      {/* PACKET META */}
                      <span className="mt-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-foreground/20">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {isMe && (
                          m.status === "error" ? <span className="text-rose-500"> • FAILED</span> :
                          m.status === "pending" ? <span className="animate-pulse opacity-70"> • SENDING</span> :
                          (seenData[m._id] ? " • SEEN" : " • SENT")
                        )}
                      </span>
                    </div>
                  </motion.div>
                );
              })
            )}
            <div ref={messagesRef} />
          </div>

          {/* TRANSISSION INPUT */}
          <div className="p-6 bg-background border-t border-border/20 z-10">
            <AnimatePresence>
              {replyTarget && (
                <motion.div initial={{y: 10, opacity: 0}} animate={{y: 0, opacity: 1}} exit={{y: 10, opacity: 0}} className="mb-3 flex items-center justify-between bg-cyan-500/5 border border-cyan-500/10 p-3 rounded-xl backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <Reply size={14} className="text-cyan-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/60">
                      Target: {replyTarget.text?.slice(0, 30)}...
                    </span>
                  </div>
                  <button onClick={() => setReplyTarget(null)} className="text-foreground/40 hover:text-rose-500 transition-colors"><X size={14} /></button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative flex items-end gap-3 max-w-5xl mx-auto">
              <div className="flex items-center gap-1.5 mb-1">
                <label className="cursor-pointer p-2.5 rounded-xl bg-foreground/[0.03] border border-border/20 hover:border-cyan-500/40 hover:text-cyan-500 transition-all text-foreground/40">
                  <Paperclip size={18} />
                  <input type="file" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setAttachment(file);
                    if (file.type.startsWith("image/") || file.type.startsWith("audio/")) setAttachmentPreview(URL.createObjectURL(file));
                  }} />
                </label>
                
                <button
                  onMouseDown={startRecording} onMouseUp={stopRecording}
                  onTouchStart={startRecording} onTouchEnd={stopRecording}
                  className={`p-2.5 rounded-xl transition-all border ${isRecording ? "bg-rose-500 text-white animate-pulse border-rose-400" : "bg-foreground/[0.03] border-border/20 text-foreground/40 hover:text-cyan-500"}`}
                >
                  {isRecording ? <span className="text-[10px] font-black">{recordTime}s</span> : <Mic size={18} />}
                </button>
              </div>

              <div className="flex-1 relative">
                {attachmentPreview && (
                  <div className="absolute bottom-full left-0 mb-3 p-2 bg-foreground/10 backdrop-blur-md rounded-xl border border-border/40">
                    <button onClick={() => {setAttachment(null); setAttachmentPreview(null)}} className="absolute -top-2 -right-2 p-1 bg-rose-500 text-white rounded-full shadow-lg"><X size={10}/></button>
                    {attachment?.type?.startsWith("audio/") ? <audio src={attachmentPreview} controls className="h-8 w-32" /> : <img src={attachmentPreview} className="h-20 w-20 object-cover rounded-lg" alt="preview" />}
                  </div>
                )}
                <textarea
                  className="w-full bg-foreground/[0.03] border border-border/20 rounded-2xl px-5 py-3.5 text-sm focus:outline-none focus:border-cyan-500/50 transition-all resize-none max-h-32 placeholder:text-foreground/20"
                  placeholder="ENCRYPTED TRANSMISSION..."
                  rows="1"
                  value={text}
                  onChange={handleTyping}
                  onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }}}
                />
              </div>

              <button 
                onClick={sendMessage}
                className="mb-1 p-3.5 rounded-2xl bg-cyan-600 text-white hover:bg-cyan-500 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center bg-background opacity-20 grayscale">
          <div className="w-24 h-24 border-2 border-dashed border-cyan-500/30 rounded-full flex items-center justify-center animate-[spin_10s_linear_infinite]">
             <div className="w-16 h-16 border-2 border-dashed border-cyan-500/30 rounded-full flex items-center justify-center animate-[spin_5s_linear_infinite_reverse]">
                <User size={32} className="text-cyan-500" />
             </div>
          </div>
          <p className="mt-8 text-[11px] font-black uppercase tracking-[0.5em]">Select a user to connect</p>
        </div>
      )}

      {/* MODALS & OVERLAYS */}
      <AnimatePresence>
        {selectedMessageId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm" onClick={() => setSelectedMessageId(null)}>
            <motion.div initial={{scale: 0.9, opacity: 0}} animate={{scale: 1, opacity: 1}} exit={{scale: 0.9, opacity: 0}} className="w-full max-w-xs bg-foreground/[0.05] border border-border/40 rounded-3xl p-6 backdrop-blur-xl shadow-2xl space-y-2" onClick={e => e.stopPropagation()}>
               <div className="flex justify-around mb-4 border-b border-border/20 pb-4">
                  {["❤️", "😂", "👍", "🔥", "😢", "😮"].map(emo => (
                    <button key={emo} onClick={() => handleReact(selectedMessageId, emo)} className="text-2xl hover:scale-125 transition-transform">{emo}</button>
                  ))}
               </div>
               <button onClick={() => handleReply(messages.find(m => m._id === selectedMessageId))} className="flex items-center gap-3 w-full p-3 hover:bg-cyan-500/10 rounded-xl text-[11px] font-black uppercase tracking-widest text-cyan-400 transition-colors"><Reply size={16}/> Reply to packet</button>
               {messages.find(m => m._id === selectedMessageId)?.sender === user._id && (
                 <>
                  <button onClick={() => handleEdit(messages.find(m => m._id === selectedMessageId))} className="flex items-center gap-3 w-full p-3 hover:bg-cyan-500/10 rounded-xl text-[11px] font-black uppercase tracking-widest text-cyan-400 transition-colors"><Edit3 size={16}/> Edit metadata</button>
                  <button onClick={() => handleDelete(messages.find(m => m._id === selectedMessageId))} className="flex items-center gap-3 w-full p-3 hover:bg-rose-500/10 rounded-xl text-[11px] font-black uppercase tracking-widest text-rose-500 transition-colors"><Trash2 size={16}/> Purge node</button>
                 </>
               )}
               <button onClick={() => setSelectedMessageId(null)} className="w-full pt-4 text-[9px] font-black uppercase tracking-widest opacity-30">Close System Menu</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <MentorProfileModal open={showMentorModal} loading={mentorLoading} profile={mentorProfile} fullName={mentorProfile?.fullName || activePartnerName} onClose={() => setShowMentorModal(false)} />
      <StudentProfileModal open={showStudentModal} loading={studentLoading} profile={studentProfile} onClose={() => setShowStudentModal(false)} />
      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}