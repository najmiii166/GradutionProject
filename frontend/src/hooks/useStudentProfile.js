// src/hooks/useStudentProfile.js
import { useState } from "react";
import { api } from "../api/axios";

export default function useStudentProfile(setToast) {
  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [studentProfile, setStudentProfile] = useState(null);
  const [loadingStudentProfile, setLoadingStudentProfile] = useState(false);

  const openStudentProfile = async (studentId) => {
    // Basic ID validation
    if (!studentId) return;

    setStudentModalOpen(true);
    setStudentProfile(null);
    setLoadingStudentProfile(true);

    try {
      const { data } = await api.get(`/mentor/students/${studentId}`);
      
      /**
       * IMPORTANT: 
       * If your API returns { student: { faculty: '...' } }, 
       * we ensure the profile object contains the flat faculty key the Modal expects.
       */
      const profileData = data?.student || data; 
      setStudentProfile(profileData || null);
    } catch (error) {
      console.error("Profile Fetch Error:", error);
      setToast && setToast("Failed to load student dossier.");
    } finally {
      setLoadingStudentProfile(false);
    }
  };

  const closeStudentProfile = () => setStudentModalOpen(false);

  return {
    studentModalOpen,
    openStudentProfile,
    closeStudentProfile,
    studentProfile,
    loadingStudentProfile,
    setStudentProfile,
  };
}