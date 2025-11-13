// src/pages/MentorRegister.jsx
import { useState } from "react";
import { api } from "../api/axios";
import Brand from "../components/Brand";
import Card from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";
import Toast from "../components/Toast";

// Same rules as express-validator's isStrongPassword (minLength: 8)
const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export default function MentorRegister() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    institution: "",
    faculty: "",
    department: "",
    yearsOfExperience: "",
    bio: "",
    expertiseAreas: "",
    university: "",
  });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const update = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();

    // Frontend checks to match backend validator expectations
    const required = [
      "fullName",
      "email",
      "password",
      "institution",
      "faculty",
      "department",
    ];
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

    setLoading(true);
    try {
      const payload = {
        ...form,
        yearsOfExperience: Number(form.yearsOfExperience || 0),
        expertiseAreas: form.expertiseAreas
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean), // array of strings; backend expects an array
      };

      const { data } = await api.post("/auth/register/mentor", payload);
      console.log("Mentor register response:", data);

      setToast("Mentor registered! Await admin verification.");
      setForm({
        fullName: "",
        email: "",
        password: "",
        institution: "",
        faculty: "",
        department: "",
        yearsOfExperience: "",
        bio: "",
        expertiseAreas: "",
        university: "",
      });
    } catch (err) {
      const res = err.response?.data;
      console.log("Mentor register error:", res);

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
            <h1 className="mb-1 text-2xl font-bold">Mentor Registration 🧑‍🏫</h1>
            <p className="mb-6 text-sm text-gray-600">
              Share your expertise and help students grow.
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
                label="Institution"
                name="institution"
                value={form.institution}
                onChange={update}
                required
              />
              <Input
                label="Faculty"
                name="faculty"
                value={form.faculty}
                onChange={update}
                required
              />
              <Input
                label="Department"
                name="department"
                value={form.department}
                onChange={update}
                required
              />
              <Input
                label="Years of Experience"
                type="number"
                min="0"
                name="yearsOfExperience"
                value={form.yearsOfExperience}
                onChange={update}
              />
              <Input
                label="Short Bio"
                name="bio"
                value={form.bio}
                onChange={update}
              />
              <Input
                label="Expertise Areas (comma separated)"
                name="expertiseAreas"
                value={form.expertiseAreas}
                onChange={update}
              />
              <Input
                label="University (optional)"
                name="university"
                value={form.university}
                onChange={update}
              />
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
        type={
          toast && toast.toLowerCase().includes("registered")
            ? "success"
            : "info"
        }
      />
    </div>
  );
}
