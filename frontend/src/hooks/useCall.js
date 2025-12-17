import { useEffect, useRef, useState } from "react";

export default function useCall(socket, user, partnerId, conversationId) {
  const [incomingCall, setIncomingCall] = useState(null);
  const [inCall, setInCall] = useState(false);
  const [callStatus, setCallStatus] = useState(null); // calling | ringing | connected

  const peerRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const localStreamRef = useRef(null);

  // ------------------------
  // START CALL
  // ------------------------
  async function startCall() {
    setCallStatus("calling");
    if (!partnerId || !conversationId) return;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });

    localStreamRef.current = stream;

    const pc = createPeer(partnerId);
    peerRef.current = pc;

    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("call:start", { targetId: partnerId, offer, conversationId });
  }

  // ------------------------
  // ACCEPT CALL
  // ------------------------
  async function acceptCall() {
    const { fromId, offer } = incomingCall;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });

    localStreamRef.current = stream;

    const pc = createPeer(fromId);
    peerRef.current = pc;

    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    await pc.setRemoteDescription(offer);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit("call:accept", { targetId: fromId, answer });

    setIncomingCall(null);
    setCallStatus("connected");
    setInCall(true);
  }

  function rejectCall() {
    if (!incomingCall) return;
    socket.emit("call:reject", { targetId: incomingCall.fromId });
    setIncomingCall(null);
    setCallStatus(null);
  }

  // ------------------------
  // CREATE PEER
  // ------------------------
  function createPeer(targetId) {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("call:ice-candidate", {
          targetId,
          candidate: e.candidate,
        });
      }
    };

    pc.ontrack = (e) => {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = e.streams[0];
      }
    };

    return pc;
  }

  // ------------------------
  // END CALL
  // ------------------------
  function endCall() {
    peerRef.current?.close();
    peerRef.current = null;

    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;

    if (remoteAudioRef.current) remoteAudioRef.current.srcObject = null;

    setIncomingCall(null);
    setInCall(false);
    setCallStatus(null);

    if (partnerId) socket.emit("call:end", { targetId: partnerId });
  }

  // ------------------------
  // SOCKET EVENTS
  // ------------------------
  useEffect(() => {
    if (!socket) return;

    const handleIncoming = ({ fromId, offer }) => {
      setIncomingCall({ fromId, offer });
    };
    const handleRinging = () => setCallStatus("ringing");
    const handlePartnerOffline = () => setCallStatus("offline"); // Partner is offline
    const handleAccepted = async ({ answer }) => {
      await peerRef.current?.setRemoteDescription(answer);
      setCallStatus("connected");
      setInCall(true);
    };
    const handleIceCandidate = ({ candidate }) => {
      peerRef.current?.addIceCandidate(candidate);
    };
    const handleRejected = () => endCall();
    const handleEnded = () => endCall();

    socket.on("call:incoming", handleIncoming); // Receiver gets this
    socket.on("call:ringing", handleRinging);
    socket.on("call:partner-offline", handlePartnerOffline);
    socket.on("call:accepted", handleAccepted);
    socket.on("call:ice-candidate", handleIceCandidate);
    socket.on("call:rejected", handleRejected);
    socket.on("call:ended", handleEnded);

    return () => {
      socket.off("call:incoming", handleIncoming);
      socket.off("call:ringing", handleRinging);
      socket.off("call:partner-offline", handlePartnerOffline);
      socket.off("call:accepted", handleAccepted);
      socket.off("call:ice-candidate", handleIceCandidate);
      socket.off("call:rejected", handleRejected);
      socket.off("call:ended", handleEnded);
    };
  }, [socket, partnerId, conversationId]);

  return {
    incomingCall,
    inCall,
    callStatus,
    setCallStatus,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    remoteAudioRef,
  };
}
