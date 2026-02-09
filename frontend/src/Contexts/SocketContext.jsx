// frontend/src/Contexts/SocketContext.jsx
import React, { createContext, useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { createSocket } from "../socket";

export const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  // Lazy init from storage to be persistent
  const [unreadCounts, setUnreadCounts] = useState(() => {
    try {
      const saved = localStorage.getItem("unreadCounts");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [activeId, setActiveId] = useState(null); 
  const activeIdRef = useRef(activeId);
  const navigate = useNavigate();
  // We need to listen to storage changes if we want to react to token changes from other tabs,
  // or just re-read it.
  const token = localStorage.getItem("token");

  // Keep ref synced
  useEffect(() => { activeIdRef.current = activeId; }, [activeId]);

  // Sync unreadCounts to localStorage
  useEffect(() => {
    localStorage.setItem("unreadCounts", JSON.stringify(unreadCounts));
  }, [unreadCounts]);

  // Derived total count
  const unreadCount = useMemo(() => {
    return Object.values(unreadCounts).reduce((acc, count) => acc + (count || 0), 0);
  }, [unreadCounts]);

  const markAsRead = useCallback((convId) => {
    setUnreadCounts((prev) => ({ ...prev, [convId]: 0 }));
  }, []);

  // Main Socket Effect
  useEffect(() => {
    const startToken = localStorage.getItem("token");
    
    // Hard Reset if no token
    if (!startToken) {
      setUnreadCounts({});
      setSocket(null);
      return;
    }

    const s = createSocket(startToken);
    if (!s) return;

    setSocket(s);

    s.on("connect", () => {
      console.log("Socket Connected:", s.id);

      // Identity Handshake with fallback retry if userId is missing
      const sendSetup = () => {
        try {
          const userStr = localStorage.getItem("user");
          if (!userStr) {
            console.warn("Socket setup: user not found in localStorage");
            return false;
          }

          const u = JSON.parse(userStr);
          const userId = u && (u._id || u.id);

          if (!userId) {
            console.warn("Socket setup: userId missing on user object", u);
            return false;
          }

          console.log("Socket setup: emitting setup for userId", userId);
          s.emit("setup", userId);
          return true;
        } catch (e) {
          console.error("Socket setup error:", e);
          return false;
        }
      };

      // Try immediately; if it fails, try once more shortly after
      if (!sendSetup()) {
        setTimeout(() => {
          if (!sendSetup()) {
            console.warn("Socket setup: failed to obtain userId after retry");
          }
        }, 500);
      }
    });

    s.on("connect_error", (err) =>
      console.error("Socket Error:", err?.message || err)
    );

    s.on("new_message", (msg) => {
      console.log("--- SOCKET DATA RECEIVED ---", msg);

      const convId = msg.conversationId || msg.chatId; 
      if (activeIdRef.current === convId) return;

      setUnreadCounts((prev) => ({
        ...prev,
        [convId]: (prev[convId] || 0) + 1,
      }));
    });

    s.on("conversation:created", (convo) => {
      try {
        if (convo && convo._id) {
          navigate(`/chat/${convo._id}`);
        }
      } catch (e) {
        console.error("conversation:created handler error:", e);
      }
    });

    s.on("notification", (payload) => {
      console.log("Socket notification received:", payload);

      // If this is a chat message notification, increment unread for that conversation
      try {
        if (payload && payload.type === "chat:new_message") {
          const convId =
            payload.conversationId ||
            payload.message?.conversation ||
            payload.message?.conversationId;

          if (!convId) {
            console.warn("notification: chat:new_message missing conversationId", payload);
          } else {
            // Skip if this conversation is currently open
            if (String(activeIdRef.current) !== String(convId)) {
              setUnreadCounts((prev) => ({
                ...prev,
                [convId]: (prev[convId] || 0) + 1,
              }));
            }
          }
        }
      } catch (e) {
        console.error("Failed to process chat notification:", e);
      }

      // Still fan out as a DOM event for any listeners
      try {
        window.dispatchEvent(
          new CustomEvent("socket:notification", { detail: payload })
        );
      } catch (e) {
        console.error("Failed to dispatch socket:notification event:", e);
      }
    });

    return () => {
      // Listener Cleanup
      try {
        s.removeAllListeners();
        s.disconnect();
      } catch {}
      setSocket(null);
    };
  }, [token]); // Dependency: token from localStorage (read in render)

  const value = useMemo(() => ({
    socket,
    unreadCounts,
    unreadCount,
    markAsRead,
    setActiveId
  }), [socket, unreadCounts, unreadCount, markAsRead]);

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export default SocketContext;
