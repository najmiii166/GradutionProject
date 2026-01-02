import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing";
import Login from "./pages/Login";

import StudentRegister from "./pages/StudentRegister";
import MentorRegister from "./pages/MentorRegister";

import AdminDashboard from "./pages/AdminDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import MentorDashboard from "./pages/MentorDashboard";
import MentorSessions from "./pages/MentorSessions";
import MentorStudents from "./pages/MentorStudents";
import Support from "./pages/Support";
import AdminTickets from "./pages/AdminTickets";

import AllMentors from "./pages/AllMentors";

import ChatScreen from "./pages/ChatScreen";
import ReportsList from "./pages/ReportsList";
import ReportGenerate from "./pages/ReportGenerate";
import ReportHome from "./pages/ReportsList";
// import ReportGenerate from "./pages/ReportGenerate";
import ReportView from "./pages/ReportView";

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
          <Route path="/admin/tickets" element={<AdminTickets />} />
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/mentor/dashboard" element={<MentorDashboard />} />
          <Route path="/mentor/sessions" element={<MentorSessions />} />
          <Route path="/mentor/students" element={<MentorStudents />} />
          <Route path="/support" element={<Support />} />

          {/* Mentor list */}
          <Route path="/mentors" element={<AllMentors />} />

          {/* ⭐ CHAT */}
          <Route path="/chat" element={<ChatScreen />} />
          <Route path="/chat/:id" element={<ChatScreen />} />

          {/* Reports */}
          <Route path="/reports" element={<ReportHome />} />
          <Route path="/reports/generate" element={<ReportGenerate />} />
          <Route path="/reports/:id" element={<ReportView />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </SocketProvider>
    </BrowserRouter>
  );
}
