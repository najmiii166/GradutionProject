// frontend/src/hooks/useCall.js

import { useEffect, useRef, useState } from "react";

export default function useCall(socket, user) {
  const [incomingCall, setIncomingCall] = useState(null);
  const [inCall, setInCall] = useState(false);

  const peerRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);

  const targetIdRef = useRef(null);

  // --------------------------
  // START A CALL
  // --------------------------
  async function startCall(targetId, targetName) {
    targetIdRef.current = targetId;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    localStreamRef.current = stream;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    const pc = createPeerConnection(targetId);
    peerRef.current = pc;

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("call:offer", {
      fromId: user._id,
      fromName: user.fullName,
      targetId,
      offer,
    });

    setInCall(true);
  }

  // --------------------------
  // HANDLE INCOMING CALL
  // --------------------------
  useEffect(() => {
    if (!socket) return;

    socket.on("call:incoming", ({ fromId, fromName, offer }) => {
      setIncomingCall({ fromId, fromName, offer });
    });

    socket.on("call:answer", async ({ answer }) => {
      await peerRef.current.setRemoteDescription(answer);
    });

    socket.on("call:ice-candidate", ({ candidate }) => {
      peerRef.current?.addIceCandidate(candidate);
    });

    socket.on("call:rejected", () => {
      endCall();
      alert("Call rejected");
    });

    socket.on("call:ended", () => {
      endCall();
    });

    return () => {
      socket.off("call:incoming");
      socket.off("call:answer");
      socket.off("call:ice-candidate");
      socket.off("call:rejected");
      socket.off("call:ended");
    };
  }, [socket]);

  // --------------------------
  // ACCEPT CALL
  // --------------------------
  async function acceptCall() {
    const { fromId, offer } = incomingCall;
    targetIdRef.current = fromId;

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });

    localStreamRef.current = stream;
    if (localVideoRef.current)
      localVideoRef.current.srcObject = stream;

    const pc = createPeerConnection(fromId);
    peerRef.current = pc;

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    await pc.setRemoteDescription(offer);
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit("call:answer", {
      targetId: fromId,
      answer,
    });

    setIncomingCall(null);
    setInCall(true);
  }

  function rejectCall() {
    socket.emit("call:reject", { targetId: incomingCall.fromId });
    setIncomingCall(null);
  }

  // --------------------------
  // HANDLE CONNECTION
  // --------------------------
  function createPeerConnection(targetId) {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: ["stun:stun.l.google.com:19302"] }],
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
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = e.streams[0];
      }
    };

    return pc;
  }

  // --------------------------
  // END CALL
  // --------------------------
  function endCall() {
    peerRef.current?.close();
    peerRef.current = null;

    localStreamRef.current?.getTracks().forEach((t) => t.stop());

    localStreamRef.current = null;
    remoteVideoRef.current && (remoteVideoRef.current.srcObject = null);

    setInCall(false);
    setIncomingCall(null);

    if (targetIdRef.current) {
      socket.emit("call:end", { targetId: targetIdRef.current });
    }
  }

  return {
    incomingCall,
    inCall,
    startCall,
    acceptCall,
    rejectCall,
    endCall,
    localVideoRef,
    remoteVideoRef,
  };
}
