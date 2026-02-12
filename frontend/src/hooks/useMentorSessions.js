import { useEffect, useState } from "react";
import { api } from "../api/axios";

export default function useMentorSessions(setToast) {
  const [upcomingSessions, setUpcomingSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [syncingSessions, setSyncingSessions] = useState(false);

  const fetchUpcomingSessions = async (background = false) => {
    if (background) {
      setSyncingSessions(true);
    } else {
      setLoadingSessions(true);
    }
    try {
      const { data } = await api.get("/requests/mentor/upcoming");
      setUpcomingSessions(data || []);
    } catch {
      setToast && setToast("Failed to load sessions.");
    } finally {
      if (background) {
        setSyncingSessions(false);
      } else {
        setLoadingSessions(false);
      }
    }
  };

  useEffect(() => {
    fetchUpcomingSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { upcomingSessions, loadingSessions, syncingSessions, fetchUpcomingSessions, setUpcomingSessions };
}
