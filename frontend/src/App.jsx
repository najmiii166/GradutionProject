import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import StudentRegister from "./pages/StudentRegister";
import MentorRegister from "./pages/MentorRegister";


export default function App() {
return (
<BrowserRouter>
<Routes>
<Route path="/" element={<Navigate to="/login" />} />
<Route path="/login" element={<Login />} />
<Route path="/register/student" element={<StudentRegister />} />
<Route path="/register/mentor" element={<MentorRegister />} />
</Routes>
</BrowserRouter>
);
}