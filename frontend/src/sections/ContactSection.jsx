import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, MapPin, Clock } from "lucide-react";
import { api } from "../api/axios";

const PRIORITIES = [
  { value: "low", label: "Low – general question" },
  { value: "medium", label: "Medium – important but not urgent" },
  { value: "high", label: "High – time‑sensitive issue" },
];

const CATEGORIES = [
  { value: "product", label: "Product feedback" },
  { value: "technical", label: "Technical issue" },
  { value: "account", label: "Account & access" },
  { value: "partnership", label: "Partnership & collaboration" },
];

export default function ContactSection() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    priority: "low",
    category: "product",
    website: "", // honeypot
  });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState({ success: false, message: "" });
  const [sending, setSending] = useState(false);

  const validate = () => {
    const e = {};
    const name = form.name.trim();
    const email = form.email.trim();
    const subject = form.subject.trim();
    const message = form.message.trim();
    const priority = form.priority;

    if (name.length < 2 || name.length > 60) e.name = "Name must be 2–60 characters.";
    if (!/^([^\s@]+)@([^\s@]+)\.[^\s@]+$/.test(email)) e.email = "Enter a valid email address.";
    if (subject.length < 3 || subject.length > 100) e.subject = "Subject must be 3–100 characters.";
    if (message.length < 10 || message.length > 2000) e.message = "Message must be 10–2000 characters.";
    if (!["low", "medium", "high"].includes(priority)) e.priority = "Select a valid priority.";
    if (!CATEGORIES.some((c) => c.value === form.category)) e.category = "Select a valid category.";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    // honeypot check – silently ignore bot submissions
    if (form.website) {
      return;
    }

    setSending(true);
    setStatus({ success: false, message: "" });

    try {
      const { data } = await api.post("/contact", form);
      setStatus({ success: !!data.success, message: data.message || "" });
      if (data.success) {
        setForm({
          name: "",
          email: "",
          subject: "",
          message: "",
          priority: "low",
          category: "product",
          website: "",
        });
        setErrors({});
      }
    } catch (error) {
      const message = error?.response?.data?.message || "Failed to send. Please try again.";
      setStatus({ success: false, message });
    } finally {
      setSending(false);
    }
  };

  return (
    <section
      id="contact"
      className="relative py-24 md:py-28 border-t border-border bg-background scroll-mt-32"
      aria-labelledby="contact-heading"
    >
      <div className="absolute inset-0 -z-10">
        <div className="absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-cyan-500/15 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[480px] w-[520px] rounded-full bg-blue-600/15 blur-[140px]" />
      </div>

      <div className="mx-auto max-w-6xl px-6 md:px-10 grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1.1fr)] items-start">
        {/* Left: Contact info */}
        <div className="space-y-6">
          <header className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-cyan-500/70 dark:text-cyan-400/80 font-semibold">
              Contact
            </p>
            <h2
              id="contact-heading"
              className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight text-foreground"
            >
              Let&apos;s get you the right support
            </h2>
            <p className="text-sm md:text-base text-foreground/70 dark:text-slate-300 max-w-md">
              Whether you&apos;re a student, mentor, or university partner, our team is here to help you get the most
              out of MentorLink.
            </p>
          </header>

          <div className="space-y-4 rounded-3xl border border-border/60 bg-card/90 dark:border-white/10 dark:bg-white/5 backdrop-blur-md p-5 md:p-6 shadow-[0_1px_3px_0_rgba(15,23,42,0.08)]">
            <ContactInfoRow
              icon={<Mail className="w-4 h-4 text-cyan-400" aria-hidden="true" />}
              label="Email"
              value={
                <a href="mailto:support@mentorlink.so" className="text-cyan-400 hover:text-cyan-300">
                  support@mentorlink.so
                </a>
              }
              helper="We aim to reply within 24–48 hours on working days."
            />
            <ContactInfoRow
              icon={<MapPin className="w-4 h-4 text-cyan-400" aria-hidden="true" />}
              label="Location"
              value="Somalia (remote-first team)"
              helper="Serving students and mentors across Somali universities and beyond."
            />
            <ContactInfoRow
              icon={<Clock className="w-4 h-4 text-cyan-400" aria-hidden="true" />}
              label="Support hours"
              value="Saturday – Thursday, 9:00–17:00 EAT"
              helper="Messages outside these hours will be handled on the next business day."
            />
          </div>
        </div>

        {/* Right: Contact form */}
        <div>
          <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-3xl border border-border/60 bg-card/90 dark:border-white/10 dark:bg-white/5 backdrop-blur-md p-6 md:p-7 shadow-[0_1px_3px_0_rgba(15,23,42,0.08)]"
            noValidate
          >
            <div>
              <label htmlFor="name" className="text-sm font-medium text-foreground">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange("name")}
                className="mt-1 w-full rounded-xl border border-border bg-foreground/3 px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
                placeholder="Your full name"
                autoComplete="name"
                aria-invalid={Boolean(errors.name) || undefined}
                aria-describedby={errors.name ? "name-error" : undefined}
              />
              {errors.name && (
                <p id="name-error" className="text-[12px] text-rose-500 mt-1">
                  {errors.name}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange("email")}
                className="mt-1 w-full rounded-xl border border-border bg-foreground/3 px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={Boolean(errors.email) || undefined}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <p id="email-error" className="text-[12px] text-rose-500 mt-1">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label htmlFor="subject" className="text-sm font-medium text-foreground">
                  Subject
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange("subject")}
                  className="mt-1 w-full rounded-xl border border-border bg-foreground/3 px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
                  aria-invalid={Boolean(errors.subject) || undefined}
                  aria-describedby={errors.subject ? "subject-error" : undefined}
                >
                  <option value="">Select a subject</option>
                  <option value="Technical">Technical</option>
                  <option value="Mentorship">Mentorship</option>
                  <option value="Partnership">Partnership</option>
                </select>
                {errors.subject && (
                  <p id="subject-error" className="text-[12px] text-rose-500 mt-1">
                    {errors.subject}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="category" className="text-sm font-medium text-foreground">
                  Category
                </label>
                <select
                  id="category"
                  name="category"
                  value={form.category}
                  onChange={handleChange("category")}
                  className="mt-1 w-full rounded-xl border border-border bg-foreground/3 px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors"
                  aria-invalid={Boolean(errors.category) || undefined}
                  aria-describedby={errors.category ? "category-error" : undefined}
                >
                  {CATEGORIES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {errors.category && (
                  <p id="category-error" className="text-[12px] text-rose-500 mt-1">
                    {errors.category}
                  </p>
                )}
              </div>

              {/* Honeypot field */}
              <input
                type="text"
                name="website"
                value={form.website}
                onChange={handleChange("website")}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <div>
              <label htmlFor="message" className="text-sm font-medium text-foreground">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={form.message}
                onChange={handleChange("message")}
                className="mt-1 w-full rounded-2xl border border-border bg-foreground/3 px-3 py-2 text-sm text-foreground placeholder:text-foreground/40 outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors min-h-[140px] resize-vertical"
                placeholder="Please describe your request or issue"
                aria-invalid={Boolean(errors.message) || undefined}
                aria-describedby={errors.message ? "message-error" : undefined}
              />
              {errors.message && (
                <p id="message-error" className="text-[12px] text-rose-500 mt-1">
                  {errors.message}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between pt-2">
              <button
                type="submit"
                disabled={sending}
                className="inline-flex items-center justify-center rounded-full bg-cyan-500 px-5 py-2 text-sm font-semibold text-slate-950 shadow-sm hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                {sending ? "Sending..." : "Send message"}
              </button>

              <p className="text-[11px] text-muted-foreground">We aim to respond within 1–2 business days.</p>
            </div>

            <AnimatePresence mode="wait">
              {status.message && (
                <motion.p
                  key={status.message + String(status.success)}
                  initial={{ opacity: 0, y: 8, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className={`mt-3 text-[12px] inline-flex items-center gap-2 rounded-full px-3 py-1.5 border ${{
                    true: "border-emerald-400/40 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300",
                    false: "border-rose-400/40 bg-rose-500/5 text-rose-700 dark:text-rose-300",
                  }[status.success]}`}
                  role="status"
                  aria-live="polite"
                >
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" />
                  <span>{status.message}</span>
                </motion.p>
              )}
            </AnimatePresence>
          </form>
        </div>
      </div>
    </section>
  );
}

function ContactInfoRow({ icon, label, value, helper }) {
  return (
    <div className="flex gap-3">
      <div className="mt-1 flex h-8 w-8 items-center justify-center rounded-full bg-foreground/5 text-foreground dark:bg-slate-900/70 dark:border border-white/10">
        {icon}
      </div>
      <div className="space-y-0.5">
        <div className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/50 dark:text-slate-400">{label}</div>
        <div className="text-sm text-foreground dark:text-slate-100">{value}</div>
        {helper && <p className="text-[11px] text-foreground/50 dark:text-slate-400">{helper}</p>}
      </div>
    </div>
  );
}
