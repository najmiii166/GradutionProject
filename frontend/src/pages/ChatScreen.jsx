// ------------------------------------------------------
// ChatScreen.jsx — MentorLink Theme (Dark + Blue Professional)
// ------------------------------------------------------

import { useEffect, useRef, useState, useContext } from "react";
import { api, setAuthToken } from "../api/axios";
import { useNavigate, useParams } from "react-router-dom";
import { SocketContext } from "../Contexts/SocketContext";

import Spinner from "../components/Spinner";
import Toast from "../components/Toast";
import Avatar from "../components/Avatar";

import useCall from "../hooks/useCall";
import CallModal from "../components/CallModal";
import CallWindow from "../components/CallWindow";

import MentorProfileModal from "../components/mentor/MentorProfileModal";
import StudentProfileModal from "../components/mentor/StudentProfileModal";



export default function ChatScreen() {
  const navigate = useNavigate();
  const { id: routeConversationId } = useParams();

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!token) navigate("/login");
  setAuthToken(token);

  const socket = useContext(SocketContext);






    

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

 
 

  const mediaRecorderRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const recordingStartRef = useRef(0);
  const currentStreamRef = useRef(null);

  const apiBase = (api?.defaults?.baseURL || "").replace(/\/$/, "");
  const serverOrigin = apiBase.replace(/\/api$/i, "");




  // -----------------------------------------
  // CALL HOOK (temporarily disabled)
  // -----------------------------------------
  // Initialize call hook with the current partner and conversation
  const {
    incomingCall,
    inCall,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    remoteAudioRef,
    callStatus,
    setCallStatus,
  } = useCall(socket, user, activePartnerId, activeConversationId);

  // CALL DURATION TIMER
  const [callDuration, setCallDuration] = useState(0);
  const callTimerRef = useRef(null);

  useEffect(() => {
    if (callStatus === "connected" && inCall) {
      callTimerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
      setCallDuration(0);
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [callStatus, inCall]);

  // -----------------------------------------
  // LOAD CONVERSATIONS
  // -----------------------------------------
  useEffect(() => {
    const load = async () => {
      setLoadingConvos(true);
      try {
        const url = role === "student" ? "/chat/student" : "/chat/mentor";
        const { data } = await api.get(url);

        // Filter out invalid conversations without participant display names
        const convos = (data || []).filter(
          (c) => (c.studentName && String(c.studentName).trim() !== "") || (c.mentorName && String(c.mentorName).trim() !== "")
        );
        setConversations(convos);

        if (routeConversationId) {
          const exists = convos.some((c) => String(c._id) === String(routeConversationId));
          if (exists) {
            setActiveConversationId(routeConversationId);
          } else {
            // convo not present in list (maybe just created). Fetch participants and resolve partner name/id
            try {
              const { data: parts } = await api.get(`/chat/${routeConversationId}/participants`);
              const partnerId = role === "student" ? parts.mentor : parts.student;
              if (partnerId) {
                setActiveConversationId(routeConversationId);
                setActivePartnerId(partnerId);

                // fetch partner profile to show name
                if (role === "student") {
                  const { data: mentor } = await api.get(`/mentor/mentors/${partnerId}`);
                  setActivePartnerName(mentor?.fullName || "");
                } else {
                  const { data: student } = await api.get(`/mentor/students/${partnerId}`);
                  setActivePartnerName(student?.fullName || "");
                }
              }
            } catch (err) {
              console.error("Failed to resolve conversation participant for route id:", err);
            }
          }
        }
      } catch {
        setToast("Failed to load conversations");
      } finally {
        setLoadingConvos(false);
      }
    };
    load();
  }, [routeConversationId]);

  // -----------------------------------------
  // LOAD MESSAGES
  // -----------------------------------------
  useEffect(() => {
    if (!activeConversationId) return;

    const conv = conversations.find((c) => c._id === activeConversationId);
    if (conv) {
      setActivePartnerName(
        role === "student" ? conv.mentorName : conv.studentName
      );

      setActivePartnerId(
        role === "student"
          ? conv.mentorId || conv.mentor?._id || conv.mentorProfile?._id
          : conv.studentId || conv.student?._id || conv.studentProfile?._id
      );
    }

    const loadMsgs = async () => {
      setLoadingMsgs(true);
      try {
        const { data } = await api.get(`/chat/${activeConversationId}/messages`);
        setMessages(data || []);

        const last = data[data.length - 1];
        if (last && last.sender !== user._id) {
          socket.emit("seen", {
            conversationId: activeConversationId,
            messageId: last._id,
          });
        }
      } catch {
        setToast("Failed to load messages");
      } finally {
        setLoadingMsgs(false);
      }
    };

    loadMsgs();
  }, [activeConversationId]);

  // -----------------------------------------
  // SOCKET EVENTS
  // -----------------------------------------
  useEffect(() => {
    if (!socket || !activeConversationId) return;

    // --- Presence: Announce online status and listen for partner's status ---
    if (user._id) {
      socket.emit("user_online", user._id);
      socket.emit("get_user_status", activePartnerId); // Ask for partner's status on convo switch
    }

    socket.emit("join_conversation", { conversationId: activeConversationId });

    socket.on("new_message", (msg) => {
      // This logic needs to check against the *current* active conversation ID inside the state updater
      // to avoid issues with stale closures.
      setMessages((prevMessages) => {
        if (String(msg.conversationId) === String(activeConversationId)) {
          if (prevMessages.some((m) => String(m._id) === String(msg._id))) return prevMessages;
          return [...prevMessages, msg];
        }
        return prevMessages;
      });      if (msg.sender !== user._id && String(msg.conversationId) === String(activeConversationId)) {
        socket.emit("seen", {
          conversationId: activeConversationId,
          messageId: msg._id,
        });
      }
    });

    socket.on("typing", (data) => {
      if (
        data.conversationId === activeConversationId &&
        data.userId !== user._id
      ) {
        setTheirTyping(true);
        setTimeout(() => setTheirTyping(false), 1500);
      }
    });

    socket.on("seen", (data) => {
      setSeenData((prev) => ({ ...prev, [data.messageId]: true }));
    });

    socket.on("user_status", (data) => {
      if (String(data.userId) === String(activePartnerId)) {
        setTheirStatus(data.status);
      }
    });

    socket.on("message:updated", (msg) => {
      setMessages((prev) =>
        prev.map((m) =>
          String(m._id) === String(msg._id) ? { ...m, ...msg } : m
        )
      );
    });

    socket.on("message:deleted", (msg) => {
      setMessages((prev) =>
        prev.map((m) =>
          String(m._id) === String(msg._id)
            ? { ...m, deleted: true, text: "" }
            : m
        )
      );
    });

    socket.on("message:react", (msg) => {
      setMessages((prev) =>
        prev.map((m) =>
          String(m._id) === String(msg._id)
            ? { ...m, reactions: msg.reactions }
            : m
        )
      );
    });

    return () => {
      socket.off("new_message");
      socket.off("typing");
      socket.off("seen");
      socket.off("user_status");
      socket.off("message:updated");
      socket.off("message:deleted");
      socket.off("message:react");
    };
  }, [socket, activeConversationId, activePartnerId]);

  // -----------------------------------------
  // SEND MESSAGE
  // -----------------------------------------
  const sendMessage = async () => {
  if (!text.trim() && !attachment) return;

  try {
    let form = new FormData();

    if (attachment) {
      const fileToSend = attachment.file || attachment;
      form.append("file", fileToSend);

      const duration = attachment.duration || fileToSend.duration;
      if (duration) form.append("duration", duration);
    }

    if (text.trim()) form.append("text", text);

    const { data } = await api.post(
      `/chat/${activeConversationId}/messages`,
      form,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    //---------------------------------------------------
    // ⭐ FIX: instantly add message to screen
    //---------------------------------------------------
    setMessages(prev => [...prev, data]);

    //---------------------------------------------------
    // reset
    //---------------------------------------------------
    setText("");
    setAttachment(null);
    if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
    setAttachmentPreview(null);

  } catch (err) {
    console.error(err);
    setToast("Failed to send message");
  }
};


  // -----------------------------------------
  // TYPING
  // -----------------------------------------
  const handleTyping = (e) => {
    setText(e.target.value);
    // Guard socket in case the context/provider is not set yet
    if (socket && typeof socket.emit === "function" && activeConversationId) {
      try {
        socket.emit("typing", {
          conversationId: activeConversationId,
          userId: user._id,
        });
      } catch (err) {
        console.warn("Socket emit typing failed:", err);
      }
    }
  };

  
// ------------------------------------------------------
// CLEAN + STABLE VOICE RECORDER ENGINE
// ------------------------------------------------------
const [isRecording, setIsRecording] = useState(false);
const [recordTime, setRecordTime] = useState(0);
const [attachment, setAttachment] = useState(null);
const [attachmentPreview, setAttachmentPreview] = useState(null);

const recorderRef = useRef(null);
const streamRef = useRef(null);
const timerRef = useRef(null);
const chunksRef = useRef([]);

// Start Recording (press down)
async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
    recorderRef.current = recorder;

    chunksRef.current = [];
    setRecordTime(0);
    setIsRecording(true);

    // Timer
    const start = Date.now();
    timerRef.current = setInterval(() => {
      setRecordTime(Math.floor((Date.now() - start) / 1000));
    }, 250);

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };

    recorder.onstop = () => {
      clearInterval(timerRef.current);
      timerRef.current = null;

      const blob = new Blob(chunksRef.current, { type: "audio/webm" });
      const file = new File([blob], `voice-${Date.now()}.webm`, {
        type: "audio/webm",
      });

      const duration = recordTime;
      const url = URL.createObjectURL(blob);

      setAttachment({ file, duration });
      setAttachmentPreview(url);

      // Cleanup
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };

    recorder.start();
  } catch (err) {
    console.error("Recording failed:", err);
    setToast("Microphone access denied");
  }
}

// Stop Recording (release button)
function stopRecording() {
  try {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
  } catch (err) {
    console.error("Stop record error", err);
  }
  setIsRecording(false);
}



  // -----------------------------------------
  // ACTION MENU
  // -----------------------------------------
  const handleEdit = (m) => {
    const newText = prompt("Edit message:", m.text);
    if (newText != null && newText !== m.text) {
      socket.emit("message:edit", { messageId: m._id, text: newText });
    }
    setSelectedMessageId(null);
  };

  const handleDelete = (m) => {
    if (confirm("Delete for everyone?")) {
      socket.emit("message:delete", { messageId: m._id });
    }
    setSelectedMessageId(null);
  };

  const handleReply = (m) => {
    setReplyTarget(m);
    setSelectedMessageId(null);
  };

  const handleReact = (id, emoji) => {
    socket.emit("message:react", { messageId: id, emoji });
    setShowEmojiFor(null);
    setSelectedMessageId(null);
  };

  // -----------------------------------------
  // FILTERED CHAT LIST
  // -----------------------------------------
  const filtered = conversations.filter((c) => {
    const name = role === "student" ? c.mentorName : c.studentName;
    // guard against missing name
    return (name || "").toLowerCase().includes((query || "").toLowerCase());
  });

  // -----------------------------------------
  // RENDER
  // -----------------------------------------
  return (
    <div className="flex h-screen bg-[#0B1220] text-white">

      {/* -------------------- SIDEBAR -------------------- */}
      <div className="hidden md:flex flex-col w-72 bg-[#0F1A2A] border-r border-[#1E2A3A] p-4 shadow-xl">
        <h2 className="text-lg font-semibold mb-3">Chats</h2>

        <input
          className="w-full px-3 py-2 rounded bg-[#0B1220] border border-[#1E2A3A] text-sm mb-3 text-slate-300"
          placeholder="Search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <div className="flex-1 overflow-y-auto pr-1">
          {loadingConvos ? (
            <Spinner />
          ) : filtered.length === 0 ? (
            <p className="text-slate-400">No conversations</p>
          ) : (
            filtered.map((c) => {
              const name =
                role === "student" ? c.mentorName : c.studentName;
              const active = activeConversationId === c._id;

              return (
                <button
                  key={c._id}
                  onClick={() => setActiveConversationId(c._id)}
                  className={`flex w-full gap-3 p-2 rounded-lg text-left mb-2 transition ${
                    active
                      ? "bg-[#297da4] text-white"
                      : "bg-[#0F1A2A] hover:bg-[#1E2A3A]"
                  }`}
                >
                  <Avatar name={name} size={40} />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{name}</p>
                    <p className="text-xs opacity-75 truncate">{c.lastMessage}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* -------------------- CHAT PANEL -------------------- */}
      {activeConversationId ? (
        <div className="flex flex-col flex-1">

          {/* HEADER */}
          <div className="p-4 bg-[#0F1A2A] border-b border-[#1E2A3A] shadow-md flex items-center gap-3">
            <button
              className="flex items-center gap-3"
              onClick={async () => {
                try {
                  let partnerId = activePartnerId;

                  // If we don't already know the partner id, fetch participants for this conversation
                  if (!partnerId && activeConversationId) {
                    const { data: parts } = await api.get(`/chat/${activeConversationId}/participants`);
                    // parts = { mentor: string, student: string }
                    partnerId = role === "student" ? parts.mentor : parts.student;
                    // store for later convenience
                    if (partnerId) setActivePartnerId(partnerId);
                  }

                  if (!partnerId) {
                    setToast("Could not determine conversation partner");
                    return;
                  }

                    if (role === "student") {
                      setShowMentorModal(true);
                      setMentorLoading(true);
                      setMentorProfile(null);
                      const { data } = await api.get(`/mentor/mentors/${partnerId}`);
                      setMentorProfile(data || null);
                    } else {
                      setShowStudentModal(true);
                      setStudentLoading(true);
                      setStudentProfile(null);
                      const { data } = await api.get(`/mentor/students/${partnerId}`);
                      setStudentProfile(data || null);
                    }
                } catch (err) {
                  // handle auth error specifically
                  if (err?.response?.status === 401) {
                    setToast("Fadlan gal (login) si aad u aragto profile-ka");
                    navigate("/login");
                  } else {
                    setToast("Failed to load profile");
                  }
                } finally {
                  setMentorLoading(false);
                  setStudentLoading(false);
                }
              }}
            >
              <Avatar name={activePartnerName} size={40} />

              <div>
                <p className="font-semibold">{activePartnerName}</p>
                <p className="text-xs text-slate-400">
                  {theirTyping
                    ? "Typing…"
                    : theirStatus === "online"
                    ? "Online"
                    : "Offline"}
                </p>
              </div>
            </button>

            <button
              onClick={startCall}
              className="ml-auto px-4 py-2 bg-[#0EA5E9] hover:bg-[#0284C7] rounded shadow text-white"
            >
              📞 Voice Call
            </button>



            {/* Calling temporarily disabled
            <button
              onClick={() => call.startCall()}
              className="ml-auto px-3 py-2 rounded bg-[#0EA5E9] hover:bg-[#0284C7] text-sm shadow"
            >
              Call
            </button>
            */}
          </div>

          {/* MESSAGE LIST */}
          <div
            ref={messagesRef}
            className="flex-1 overflow-y-auto px-4 pt-4 pb-24 space-y-3"
          >
            {loadingMsgs ? (
              <Spinner />
            ) : messages.length === 0 ? (
              <p className="text-slate-400 text-center mt-10">
                No messages yet
              </p>
            ) : (
              messages.map((m) => {
                const isMe =
                  String(m.sender?._id || m.sender) === String(user._id);

                return (
                  <div
                    key={m._id}
                    className={`flex ${
                      isMe ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      ref={(el) => (messageRefs.current[m._id] = el)}
                      className={`relative max-w-[75%] rounded-2xl px-3 py-2 shadow-lg transition ${
                        isMe
                          ? "bg-[#0EA5E9] text-white"
                          : "bg-[#1E2A3A] text-slate-200"
                      } ${
                        m.type === "missed-call"
                          ? "bg-red-900/50 border border-red-700/60"
                          : ""
                      } ${
                        highlightedMessageId === m._id
                          ? "ring-2 ring-blue-500"
                          : ""
                      }`}
                      onClick={() => setSelectedMessageId(m._id)}
                    >

                      {/* REPLY PREVIEW */}
                      {m.replyTo && (
                        <div className="border-l-4 border-blue-400 pl-2 mb-1 text-xs opacity-75">
                          {m.replyTo.text?.slice(0, 40) || "Attachment"}
                        </div>
                      )}

                      {/* IMAGE / FILE */}
                      {m.fileUrl && (
  <div className="mb-2">
    {/* IMAGE */}
    {m.type === "image" && (
      <img
        src={`${serverOrigin}${m.fileUrl}`}
        className="rounded-lg max-w-[240px] shadow-md"
      />
    )}

    {/* AUDIO */}
    {m.type === "audio" && (
      <audio
        controls
        src={`${serverOrigin}${m.fileUrl}`}
        className="rounded-md w-48"
      ></audio>
    )}

    {/* FILE (PDF, ZIP, DOCX, etc) */}
    {m.type === "file" && (
      <a
        href={`${serverOrigin}${m.fileUrl}`}
        download={m.fileName}
        className="flex items-center gap-2 bg-black/25 p-2 rounded text-sm hover:bg-black/40"
      >
        📄 {m.fileName || "Download File"}
      </a>
    )}
  </div>
)}


                      {/* TEXT */}
                      {!m.deleted ? (
                        <p className="text-sm whitespace-pre-wrap">
                          {m.text}
                          {m.edited && (
                            <span className="ml-1 text-[10px] opacity-60">
                              (edited)
                            </span>
                          )}
                        </p>
                      ) : (
                        <p className="italic text-slate-400 text-sm">
                          Message deleted
                        </p>
                      )}

                      {/* TIME */}
                      <p className="text-[10px] opacity-70 text-right mt-1">
                        {new Date(m.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>

                      {/* REACTIONS */}
                      {m.reactions?.length > 0 && (
                        <div className="mt-1 flex gap-1">
                          {m.reactions.map((r, i) => (
                            <span key={i}>{r.emoji}</span>
                          ))}
                        </div>
                      )}

                      {/* EMOJI BAR */}
                      {showEmojiFor === m._id && (
                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#0F1A2A] px-3 py-1 rounded-full flex gap-2 border border-[#1E2A3A] shadow-lg">
                          {["❤️", "😂", "👍", "🔥", "😢", "😮"].map((emo) => (
                            <span
                              key={emo}
                              onClick={() => handleReact(m._id, emo)}
                              className="cursor-pointer text-lg"
                            >
                              {emo}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* ACTION MENU */}
                      {selectedMessageId === m._id && (
                        <div className="absolute top-full right-0 mt-2 bg-[#0F1A2A] border border-[#1E2A3A] px-3 py-2 rounded-lg shadow-2xl text-sm">
                          {!m.deleted && (
                            <>
                              <button
                                className="py-1 text-left w-full"
                                onClick={() => setShowEmojiFor(m._id)}
                              >
                                React ❤️
                              </button>

                              <button
                                className="py-1 text-left w-full"
                                onClick={() => handleReply(m)}
                              >
                                Reply ↩
                              </button>

                              {isMe && (
                                <>
                                  <button
                                    className="py-1 text-left w-full"
                                    onClick={() => handleEdit(m)}
                                  >
                                    Edit ✏️
                                  </button>

                                  <button
                                    className="py-1 text-left w-full text-red-400"
                                    onClick={() => handleDelete(m)}
                                  >
                                    Delete 🗑
                                  </button>
                                </>
                              )}
                            </>
                          )}

                          <button
                            className="py-1 opacity-60 text-left w-full"
                            onClick={() => setSelectedMessageId(null)}
                          >
                            Close
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}

            {theirTyping && (
              <p className="text-slate-400 text-sm">Typing…</p>
            )}
          </div>

          {/* -------------------- INPUT AREA -------------------- */}
          <div className="p-4 bg-[#0F1A2A] border-t border-[#1E2A3A] flex flex-col gap-2">

            {/* REPLY BANNER */}
            {replyTarget && (
              <div className="flex items-center justify-between bg-[#1E2A3A] p-2 rounded">
                <span className="text-xs opacity-80">
                  Replying to: {replyTarget.text?.slice(0, 40)}
                </span>
                <button
                  className="text-xs"
                  onClick={() => setReplyTarget(null)}
                >
                  ✖
                </button>
              </div>
            )}

            {/* INPUT ROW */}
            <div className="flex items-center gap-2">
              <label className="cursor-pointer w-10 h-10 rounded bg-[#1E2A3A] flex items-center justify-center">
                📎
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    setAttachment(file);

                    // show preview for images and audio
                    if (file.type.startsWith("image/") || file.type.startsWith("audio/")) {
                      setAttachmentPreview(URL.createObjectURL(file));
                    } else {
                      setAttachmentPreview(null);
                    }
                  }}
                />
              </label>

              {/* Attachment preview: image or audio */}
              {attachmentPreview && (
                attachment && (attachment.file || attachment).type?.startsWith("audio/") ? (
                  <audio src={attachmentPreview} controls className="h-10" />
                ) : (
                  <img src={attachmentPreview} className="h-10 rounded" />
                )
              )}

              {/* Record button - press & hold to record */}
             <button
  title="Hold to record voice"
  onMouseDown={(e) => { e.preventDefault(); startRecording(); }}
  onMouseUp={(e) => { e.preventDefault(); stopRecording(); }}
  onMouseLeave={() => { if (isRecording) stopRecording(); }}

  onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
  onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}

  className={`w-10 h-10 rounded flex items-center justify-center ${
    isRecording ? "bg-red-600" : "bg-[#1E2A3A]"
  }`}
>
  {isRecording ? (
    <span className="text-xs">● {recordTime}s</span>
  ) : (
    "🎤"
  )}
</button>



              <input
                className="flex-1 px-3 py-2 rounded bg-[#0B1220] border border-[#1E2A3A] text-sm"
                placeholder="Message..."
                value={text}
                onChange={handleTyping}
              />

              <button
                onClick={sendMessage}
                className="px-4 py-2 rounded bg-[#0EA5E9] hover:bg-[#0284C7] shadow"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center text-slate-400">
          Select a conversation
        </div>
      )}

            <MentorProfileModal
              open={showMentorModal}
              loading={mentorLoading}
              profile={mentorProfile}
              fullName={mentorProfile?.fullName || activePartnerName}
              onClose={() => setShowMentorModal(false)}
            />

            <StudentProfileModal
              open={showStudentModal}
              loading={studentLoading}
              profile={studentProfile}
              onClose={() => setShowStudentModal(false)}
            />

            <Toast message={toast} onClose={() => setToast(null)} />

      {/* INCOMING CALL MODAL */}
{incomingCall && (
  <CallModal
    incoming={true}
    name={activePartnerName} // We know the name from the active chat
    onAccept={acceptCall}
    onReject={rejectCall}
  />
)}

{/* OUTGOING CALL MODAL */}
{!incomingCall && !inCall && callStatus && (
  <CallModal
    incoming={false}
    name={activePartnerName}
    status={callStatus}
    onReject={() => {
      endCall();
    }}
  />
)}


{/* ACTIVE CALL WINDOW */}
{inCall && (
  <CallWindow
    visible={true}
    remoteAudioRef={remoteAudioRef}
    duration={callDuration}  // FIXED
    onEnd={endCall}
  />
)}

    </div>
  );
}
