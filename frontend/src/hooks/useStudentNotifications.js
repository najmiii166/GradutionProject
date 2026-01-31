import { useEffect, useRef, useState } from "react";
import { api } from "../api/axios";

export default function useStudentNotifications(setRequests) {
  const [notifications, setNotifications] = useState([]);
  const prevRequestsRef = useRef([]);

  useEffect(() => {
    const handler = (e) => {
      try {
        const payload = e.detail;
        if (!payload || !payload.type) return;

        if (
          payload.type !== "request:accepted" &&
          payload.type !== "request:rejected"
        ) {
          return;
        }

        const req = payload.request || {};
        const normalized = {
          type: payload.type,
          request: {
            _id: req._id,
            status: req.status,
            mentorName:
              req.mentorName || req.mentorId?.user?.fullName || "Mentor",
            startTime: req.startTime,
            endTime: req.endTime,
            requestedAt: req.requestedAt,
          },
          createdAt: Date.parse(req.updatedAt || req.requestedAt) || undefined,
        };

        setNotifications((prev) => {
          const id = normalized.request._id;
          const type = normalized.type;

          if (
            id &&
            prev.some(
              (n) =>
                n.type === type &&
                n.request &&
                n.request._id &&
                String(n.request._id) === String(id)
            )
          ) {
            return prev;
          }

          return [normalized, ...prev];
        });
      } catch (err) {
        console.error("socket notification handler error (student hook):", err);
      }
    };

    window.addEventListener("socket:notification", handler);

    const poll = async () => {
      try {
        const { data } = await api.get("/requests/student");
        const list = data || [];

        // Let caller keep request state in sync
        if (typeof setRequests === "function") setRequests(list);

        list.forEach((newReq) => {
          const oldReq = prevRequestsRef.current.find((r) => r._id === newReq._id);

          if (!oldReq) {
            const alreadyStatus = newReq.status;
            if (alreadyStatus === "upcoming" || alreadyStatus === "rejected") {
              const type = alreadyStatus === "upcoming" ? "request:accepted" : "request:rejected";
              setNotifications((prev) => {
                const id = newReq._id;
                if (
                  id &&
                  prev.some(
                    (n) =>
                      n.type === type &&
                      n.request &&
                      n.request._id &&
                      String(n.request._id) === String(id)
                  )
                ) {
                  return prev;
                }

                return [
                  {
                    type,
                    request: {
                      _id: newReq._id,
                      status: newReq.status,
                      mentorName: newReq.mentorId?.user?.fullName || "Mentor",
                      startTime: newReq.startTime,
                      endTime: newReq.endTime,
                      requestedAt: newReq.requestedAt,
                    },
                    createdAt: Date.parse(newReq.updatedAt || newReq.requestedAt) || undefined,
                  },
                  ...prev,
                ];
              });
            }

            return;
          }

          const oldStatus = oldReq.status;
          const newStatus = newReq.status;
          if (oldStatus === newStatus) return;

          if (oldStatus === "pending" && newStatus === "upcoming") {
            setNotifications((prev) => {
              const id = newReq._id;
              if (
                id &&
                prev.some(
                  (n) =>
                    n.type === "request:accepted" &&
                    n.request &&
                    n.request._id &&
                    String(n.request._id) === String(id)
                )
              ) {
                return prev;
              }

              return [
                {
                  type: "request:accepted",
                  request: {
                    _id: newReq._id,
                    status: newReq.status,
                    mentorName: newReq.mentorId?.user?.fullName || "Mentor",
                    startTime: newReq.startTime,
                    endTime: newReq.endTime,
                    requestedAt: newReq.requestedAt,
                  },
                  createdAt: Date.parse(newReq.updatedAt || newReq.requestedAt) || undefined,
                },
                ...prev,
              ];
            });
          }

          if (oldStatus === "pending" && newStatus === "rejected") {
            setNotifications((prev) => {
              const id = newReq._id;
              if (
                id &&
                prev.some(
                  (n) =>
                    n.type === "request:rejected" &&
                    n.request &&
                    n.request._id &&
                    String(n.request._id) === String(id)
                )
              ) {
                return prev;
              }

              return [
                {
                  type: "request:rejected",
                  request: {
                    _id: newReq._id,
                    status: newReq.status,
                    mentorName: newReq.mentorId?.user?.fullName || "Mentor",
                    requestedAt: newReq.requestedAt,
                  },
                  createdAt: Date.parse(newReq.updatedAt || newReq.requestedAt) || undefined,
                },
                ...prev,
              ];
            });
          }
        });

        prevRequestsRef.current = list;
      } catch (err) {
        console.error("Polling error (student hook):", err);
      }
    };

    poll();
    const interval = setInterval(poll, 15000);

    return () => {
      window.removeEventListener("socket:notification", handler);
      clearInterval(interval);
    };
  }, [setRequests]);

  return [notifications, setNotifications];
}
