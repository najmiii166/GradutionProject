import { useState } from "react";
import { api, setAuthToken } from "../api/axios";
import Brand from "../components/Brand";
import Card from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";
import Toast from "../components/Toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      localStorage.setItem("status", data.status);
      setAuthToken(data.token);
      setToast("Logged in successfully ✨");
    } catch (err) {
      setToast(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center justify-center p-6">
        <div className="w-full max-w-md">
          <Brand className="mb-6" />
          <Card>
            <h1 className="mb-1 text-2xl font-bold">Welcome back 👋</h1>
            <p className="mb-6 text-sm text-gray-600">
              Sign in to continue to MentorLink.
            </p>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Button type="submit" loading={loading}>
                Login
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-gray-600">
              New here?{" "}
              <a href="/register/student" className="text-blue-600 underline">
                Register as Student
              </a>{" "}
              or{" "}
              <a href="/register/mentor" className="text-blue-600 underline">
                Mentor
              </a>
            </p>
          </Card>
        </div>
      </div>
      <Toast
        message={toast}
        onClose={() => setToast(null)}
        type={toast?.includes("successfully") ? "success" : "error"}
      />
    </div>
  );
}
