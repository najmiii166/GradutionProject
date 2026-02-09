import { useEffect, useState } from "react";
import { api } from "../api/axios";

export default function useMentorProfile(setToast) {
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [editingAvailability, setEditingAvailability] = useState([]);
  const [savingAvailability, setSavingAvailability] = useState(false);

  const saveAvailability = async () => {
    setSavingAvailability(true);
    try {
      const sorted = [...editingAvailability].sort((a, b) => a.day.localeCompare(b.day));

      const { data } = await api.put("/mentor/availability", {
        availability: sorted,
      });

      setProfile((prev) => ({ ...(prev || {}), availability: data?.availability || sorted }));
      return { success: true };
    } catch (err) {
      setToast && setToast("Failed to update availability.");
      return { success: false, error: err };
    } finally {
      setSavingAvailability(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const { data } = await api.get("/auth/me");
        if (!mounted) return;

        setProfile(data.profile || null);
        if (data.fullName) localStorage.setItem("fullName", data.fullName);

        if (data.profile?.availability) {
          setEditingAvailability(data.profile.availability);
        }
      } catch {
        setToast && setToast("Failed to load profile.");
      } finally {
        if (mounted) setLoadingProfile(false);
      }
    })();

    return () => (mounted = false);
  }, [setToast]);

  return {
    profile,
    setProfile,
    loadingProfile,
    editingAvailability,
    setEditingAvailability,
    saveAvailability,
    savingAvailability,
  };
}
