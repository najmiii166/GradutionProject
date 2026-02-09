import { useEffect, useRef, useState } from "react";

export default function useMentorNotifications() {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [externalOpenRequest, setExternalOpenRequest] = useState(null);

  const notifBtnRef = useRef(null);
  const notifRef = useRef(null);

  // close notifications on outside click or Escape
  useEffect(() => {
    if (!showNotifications) return;

    const handleClickOutside = (e) => {
      if (
        notifRef.current &&
        !notifRef.current.contains(e.target) &&
        notifBtnRef.current &&
        !notifBtnRef.current.contains(e.target)
      ) {
        setShowNotifications(false);
      }
    };

    const handleKey = (e) => {
      if (e.key === "Escape") setShowNotifications(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, [showNotifications]);

  // Listen for socket notifications forwarded via DOM event
  useEffect(() => {
    const handler = (e) => {
      try {
        const payload = e.detail;
        if (!payload) return;

        // Normalize and dedupe request:created notifications
        if (payload.type === "request:created") {
          const r = payload.request || {};
          const normalized = {
            type: "request:created",
            request: {
              _id: r._id,
              studentId: r.studentId,
              studentName: r.studentName,
              requestedAt: r.requestedAt,
              slot: r.slot,
            },
          };

          setNotifications((prev) => {
            const id = normalized.request._id;
            if (
              id &&
              prev.some(
                (n) =>
                  n.type === "request:created" &&
                  n.request &&
                  n.request._id &&
                  String(n.request._id) === String(id)
              )
            ) {
              return prev;
            }

            return [normalized, ...prev];
          });

          return;
        }

        // Fallback: push other notifications (dedupe if possible)
        setNotifications((prev) => {
          const id = payload.request?._id || payload.message?.id;
          if (
            id &&
            prev.some((n) =>
              (n.request && n.request._id && String(n.request._id) === String(id)) ||
              (n.message && n.message.id && n.message.id === id)
            )
          ) {
            return prev;
          }

          return [payload, ...prev];
        });
      } catch (err) {
        // keep parity with original behavior (console.error)
        console.error("socket notification handler error:", err);
      }
    };
    window.addEventListener("socket:notification", handler);
    return () => window.removeEventListener("socket:notification", handler);
  }, []);

  return {
    showNotifications,
    setShowNotifications,
    notifications,
    setNotifications,
    notifBtnRef,
    notifRef,
    externalOpenRequest,
    setExternalOpenRequest,
  };
}
