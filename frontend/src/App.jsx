import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";

import StudentRegister from "./pages/StudentRegister";
import MentorRegister from "./pages/MentorRegister";

import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import MentorDashboard from "./pages/MentorDashboard";

import AllMentors from "./pages/AllMentors";

import ChatScreen from "./pages/ChatScreen";

// ⭐ ADD THIS
import { SocketProvider } from "./Contexts/SocketContext";

export default function App() {
  return (
    <BrowserRouter>
      <SocketProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />

          {/* Register */}
          <Route path="/register/student" element={<StudentRegister />} />
          <Route path="/register/mentor" element={<MentorRegister />} />

          {/* Dashboards */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/mentor/dashboard" element={<MentorDashboard />} />

          {/* Mentor list */}
          <Route path="/mentors" element={<AllMentors />} />

          {/* ⭐ CHAT */}
          <Route path="/chat" element={<ChatScreen />} />
          <Route path="/chat/:id" element={<ChatScreen />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </SocketProvider>
    </BrowserRouter>
  );
}
