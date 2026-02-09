import { useEffect, useState } from "react";
import { api } from "../api/axios";

export default function useMentorRequests(setToast) {
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get("/requests/mentor");
        if (mounted) setRequests(data || []);
      } catch {
        setToast && setToast("Failed to load mentorship requests.");
      } finally {
        if (mounted) setLoadingRequests(false);
      }
    })();
    return () => (mounted = false);
  }, [setToast]);

  const handleRequestAction = async (reqId, action, { setNotifications, fetchUpcomingSessions } = {}) => {
    try {
      await api.patch(`/requests/mentor/${reqId}`, { action });

      setRequests((prev) => prev.filter((r) => r._id !== reqId));

      if (setNotifications) {
        setNotifications((prev) => prev.filter((n) => !(n.request && String(n.request._id) === String(reqId))));
      }

      if (action === "accept") {
        setToast && setToast("Request accepted ✓");
        if (fetchUpcomingSessions) fetchUpcomingSessions();
      } else {
        setToast && setToast("Request rejected ✕");
      }
    } catch {
      setToast && setToast("Action failed.");
    }
  };

  return { requests, setRequests, loadingRequests, handleRequestAction };
}
