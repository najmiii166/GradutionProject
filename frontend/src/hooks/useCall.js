import { useEffect, useRef, useState } from "react";

export default function useCall(socket, user) {
  const [incomingCall, setIncomingCall] = useState(null);
  const [inCall, setInCall] = useState(false);
  const [callStatus, setCallStatus] = useState(null); // calling | ringing | connected

  const peerRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const localStreamRef = useRef(null);
  const targetIdRef = useRef(null);

  // ------------------------
  // START CALL
  // ------------------------
  async function startCall(targetId) {
    targetIdRef.current = targetId;
    setCallStatus("calling");

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: false,
    });

    localStreamRef.current = stream;

    const pc = createPeer(targetId);
    peerRef.current = pc;

    stream.getTracks().forEach((t) => pc.addTrack(t, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("call:offer", {
      fromId: user._id,
      fromName: user.fullName,
      targetId,
      offer,
    });
  }

  // ------------------------
  // ACCEPT CALL
  // ------------------------
  async function acceptCall() {
    const { fromId, offer } = incomingCall;

    targetIdRef.current = fromId;

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

    socket.emit("call:answer", { targetId: fromId, answer });

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

    if (targetIdRef.current) {
      socket.emit("call:end", { targetId: targetIdRef.current });
    }
  }

  // ------------------------
  // SOCKET EVENTS
  // ------------------------
  useEffect(() => {
    if (!socket) return;

    socket.on("call:incoming", ({ fromId, fromName, offer }) => {
      setIncomingCall({ fromId, fromName, offer });
    });

    socket.on("call:ringing", () => {
      setCallStatus("ringing");
    });

    socket.on("call:accepted", () => {
      setCallStatus("connected");
      setInCall(true);
    });

    socket.on("call:answer", async ({ answer }) => {
      await peerRef.current?.setRemoteDescription(answer);
    });

    socket.on("call:ice-candidate", ({ candidate }) => {
      peerRef.current?.addIceCandidate(candidate);
    });

    socket.on("call:rejected", () => endCall());
    socket.on("call:ended", () => endCall());

    return () => {
      socket.off("call:incoming");
      socket.off("call:ringing");
      socket.off("call:accepted");
      socket.off("call:answer");
      socket.off("call:ice-candidate");
      socket.off("call:rejected");
      socket.off("call:ended");
    };
  }, []);

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
