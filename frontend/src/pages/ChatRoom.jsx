// frontend/src/pages/ChatRoom.jsx
import { useParams } from "react-router-dom";
import { useState, useEffect, useRef, useContext } from "react";
import { api, setAuthToken } from "../api/axios";
import SocketContext from "../Contexts/SocketContext";
// import CallModal from "../components/CallModal";
import Avatar from "../components/Avatar";

export default function ChatRoom() {
  const { id } = useParams();
  const token = localStorage.getItem("token");
  if (token) setAuthToken(token);

  const socket = useContext(SocketContext);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");

  // Temporarily disable calling features
  // const [modalState, setModalState] = useState(null); 
  // const [callPartner, setCallPartner] = useState("");
  // const peerConnection = useRef(null);
  // const localStream = useRef(null);

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  /* -------------------- LOAD MESSAGES -------------------- */
  useEffect(() => {
    (async () => {
      const { data } = await api.get(`/chat/${id}/messages`);
      setMessages(data);
    })();
  }, [id]);

  /* -------------------- SOCKET EVENTS --------------------- */
  useEffect(() => {
    if (!socket) return;

    // Only join the conversation for messaging. Calling features are disabled temporarily.
    socket.emit("join_conversation", { conversationId: id });

    return () => {
      // leave room when component unmounts
      socket.emit("leave_conversation", { conversationId: id });
    };
  }, [socket, id]);

  /* -------------------- SEND MESSAGE -------------------- */
  const sendMessage = async () => {
    if (!text.trim()) return;
    await api.post(`/chat/${id}/messages`, { text });
    setText("");
  };

  /* -------------------- CALLING -------------------- */

  // Calling-related functions temporarily disabled
  // const startCall = () => { ... }
  // const acceptCall = () => { ... }
  // const declineCall = () => { ... }
  // const endCall = () => { ... }

  /* -------------------- WEBRTC LOGIC -------------------- */
  // beginWebRTC disabled for now
  // const beginWebRTC = async () => { ... }

  /* -------------------- UI -------------------- */
  return (
    <div className="h-screen bg-slate-900 text-white flex flex-col">

      {/* HEADER */}
      <div className="p-4 bg-slate-800 border-b border-slate-700 flex items-center gap-3">
        <Avatar name="User" size={40} />
        <h2 className="text-lg">Chat</h2>

        {/* Calling temporarily disabled
        <button
          className="ml-auto bg-green-600 px-3 py-1 rounded"
          onClick={startCall}
        >
          Call 📞
        </button>
        */}
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((m) => (
          <div key={m._id}>
            <p>{m.text}</p>
          </div>
        ))}
      </div>

      {/* INPUT */}
      <div className="p-4 bg-slate-800 border-t border-slate-700 flex gap-2">
        <input
          className="flex-1 bg-slate-700 px-3 py-2 rounded"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button className="bg-sky-500 px-4 py-2 rounded" onClick={sendMessage}>
          Send
        </button>
      </div>

      {/* CALL POPUP (disabled) */}
      {/* {modalState && (
        <CallModal
          state={modalState}
          fromUser={callPartner}
          onAccept={acceptCall}
          onDecline={declineCall}
          onEnd={endCall}
        />
      )} */}
    </div>
  );
}
