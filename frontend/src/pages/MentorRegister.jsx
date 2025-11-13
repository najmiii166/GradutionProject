// src/pages/MentorRegister.jsx
import { useState } from "react";
import { api } from "../api/axios";
import Brand from "../components/Brand";
import Card from "../components/Card";
import Input from "../components/Input";
import Button from "../components/Button";
import Toast from "../components/Toast";

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
    setLoading(true);
    try {
      const payload = {
        ...form,
        yearsOfExperience: Number(form.yearsOfExperience || 0),
        expertiseAreas: form.expertiseAreas
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };
      await api.post("/auth/register/mentor", payload);
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
      setToast(err.response?.data?.message || "Registration failed");
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
              <Input label="Full Name" name="fullName" value={form.fullName} onChange={update} required />
              <Input label="Email" type="email" name="email" value={form.email} onChange={update} required />
              <Input label="Password" type="password" name="password" value={form.password} onChange={update} required />
              <Input label="Institution" name="institution" value={form.institution} onChange={update} required />
              <Input label="Faculty" name="faculty" value={form.faculty} onChange={update} required />
              <Input label="Department" name="department" value={form.department} onChange={update} required />
              <Input label="Years of Experience" type="number" min="0" name="yearsOfExperience" value={form.yearsOfExperience} onChange={update} />
              <Input label="Short Bio" name="bio" value={form.bio} onChange={update} />
              <Input label="Expertise Areas (comma separated)" name="expertiseAreas" value={form.expertiseAreas} onChange={update} />
              <Input label="University (optional)" name="university" value={form.university} onChange={update} />
              <Button type="submit" loading={loading}>Create account</Button>
            </form>
            <p className="mt-4 text-center text-sm text-gray-600">
              Already have an account?{" "}
              <a href="/login" className="text-blue-600 underline">Login</a>
            </p>
          </Card>
        </div>
      </div>
      <Toast
        message={toast}
        onClose={() => setToast(null)}
        type={toast?.toLowerCase().includes("registered") ? "success" : "info"}
      />
    </div>
  );
}