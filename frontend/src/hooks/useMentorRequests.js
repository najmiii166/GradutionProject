import { useEffect, useState } from "react";
import { api } from "../api/axios";

export default function useMentorRequests(setToast) {
  const [requests, setRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [syncingRequests, setSyncingRequests] = useState(false);

  const fetchRequests = async (background = false) => {
    if (background) {
      setSyncingRequests(true);
    } else {
      setLoadingRequests(true);
    }
    try {
      const { data } = await api.get("/requests/mentor");
      setRequests(data || []);
    } catch {
      setToast && setToast("Failed to load mentorship requests.");
    } finally {
      if (background) {
        setSyncingRequests(false);
      } else {
        setLoadingRequests(false);
      }
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return { requests, setRequests, loadingRequests, syncingRequests, fetchRequests, handleRequestAction };
}
