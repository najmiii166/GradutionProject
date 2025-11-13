import { useState } from "react";
import { api } from "../api/axios";
import Brand from "../components/Brand";
import Card from "../components/Card";
import Input from "../components/Input";
import Select from "../components/Select";
import Button from "../components/Button";
import FileDrop from "../components/FileDrop";
import Toast from "../components/Toast";

const majors = [
  "Computer Science",
  "Engineering",
  "Business",
  "Medicine",
  "Agriculture",
  "Law",
  "Arts",
].map((m) => ({ value: m, label: m }));

// same strong rules express-validator uses by default
const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default function StudentRegister() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    university: "",
    major: "",
    semester: "",
  });
  const [idFile, setIdFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();

    // Client-side checks that match backend expectations
    if (!idFile) {
      setToast("Please attach your Student ID card image.");
      return;
    }

    const required = ["fullName", "email", "password", "university", "major", "semester"];
    const missing = required.find((k) => !String(form[k] || "").trim());
    if (missing) {
      setToast(`Please fill the required field: ${missing}`);
      return;
    }

    if (!strongPasswordRegex.test(form.password)) {
      setToast(
        "Password must be at least 8 characters and include upper, lower, number, and symbol."
      );
      return;
    }

    const data = new FormData();
    Object.entries(form).forEach(([k, v]) => data.append(k, v));
    data.append("idCard", idFile);

    setLoading(true);
    try {
      await api.post("/auth/register/student", data);
      setToast("Registered! Await admin verification.");

      setForm({
        fullName: "",
        email: "",
        password: "",
        university: "",
        major: "",
        semester: "",
      });
      setIdFile(null);
    } catch (err) {
      const res = err.response?.data;
      console.log("Register error:", res);
      const msg =
        res?.message ||
        (res?.errors &&
          res.errors.map((e) => `${e.path || e.param}: ${e.msg}`).join(", ")) ||
        "Registration failed";
      setToast(msg);
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
            <h1 className="mb-1 text-2xl font-bold">Student Registration 🎓</h1>
            <p className="mb-6 text-sm text-gray-600">
              Create your account to request mentorship.
            </p>
            <form className="space-y-4" onSubmit={submit}>
              <Input
                label="Full Name"
                name="fullName"
                value={form.fullName}
                onChange={update}
                required
              />
              <Input
                label="Email"
                type="email"
                name="email"
                value={form.email}
                onChange={update}
                required
              />
              <Input
                label="Password"
                type="password"
                name="password"
                value={form.password}
                onChange={update}
                required
                hint="At least 8 chars, with upper, lower, number, and symbol."
              />
              <Input
                label="University"
                name="university"
                value={form.university}
                onChange={update}
                required
              />
              <Select
                label="Major"
                name="major"
                value={form.major}
                onChange={update}
                options={majors}
              />
              <Input
                label="Semester"
                name="semester"
                value={form.semester}
                onChange={update}
                placeholder="e.g., 1 or Fall 2025"
                required
              />
              <FileDrop label="Student ID Card" onFile={setIdFile} />
              {idFile && (
                <p className="text-xs text-gray-500">
                  Selected file: {idFile.name}
                </p>
              )}
              <Button type="submit" loading={loading}>
                Create account
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <a href="/login" className="text-blue-600 underline">
                Login
              </a>
            </p>
          </Card>
        </div>
      </div>
      <Toast
        message={toast}
        onClose={() => setToast(null)}
        type={toast?.includes("Registered") ? "success" : "info"}
      />
    </div>
  );
}
