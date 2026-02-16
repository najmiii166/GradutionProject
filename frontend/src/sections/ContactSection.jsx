import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, MapPin, Clock, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "../api/axios";

export default function ContactSection() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    priority: "low",
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

    if (name.length < 2 || name.length > 60) e.name = "Name must be 2–60 characters.";
    if (!/^([^\s@]+)@([^\s@]+)\.[^\s@]+$/.test(email)) e.email = "Enter a valid email address.";
    if (!form.subject) e.subject = "Please select a subject.";
    if (message.length < 10 || message.length > 2000) e.message = "Message must be 10–2000 characters.";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;
    if (form.website) return;

    setSending(true);
    setStatus({ success: false, message: "" });

    try {
      const { data } = await api.post("/contact", form);
      setStatus({ success: !!data.success, message: data.message || "Sent!" });
      if (data.success) {
        setForm({
          name: "", email: "", subject: "", message: "",
          priority: "low", website: "",
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
    <section id="contact" className="relative py-24 md:py-32 overflow-hidden bg-background border-t border-border">
      {/* Background Accents */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 right-0 h-[500px] w-[500px] bg-cyan-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] bg-blue-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Side: Info & Branding */}
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-5 space-y-12"
          >
            {/* Branding - Smaller Text */}
            <div className="space-y-4">
              <p className="text-cyan-500 text-[10px] tracking-[0.4em] uppercase font-bold">
                Support Hub
              </p>
              <h2 className="text-xl md:text-2xl font-medium tracking-tight text-muted-foreground leading-relaxed max-w-sm">
                Our team is here to help you get the most out of MentorLink.
              </h2>
            </div>

            {/* Contact Info Items - Moved Up */}
            <div className="space-y-10">
              <ContactInfoItem 
                icon={<Mail className="w-5 h-5" />} 
                label="Email" 
                value="support@mentorlink.so" 
                link="mailto:support@mentorlink.so"
              />
              <ContactInfoItem 
                icon={<MapPin className="w-5 h-5" />} 
                label="Location" 
                value="Somalia" 
              />
              <ContactInfoItem 
                icon={<Clock className="w-5 h-5" />} 
                label="Support Hours" 
                value="Sat – Thu, 9:00 – 17:00 EAT" 
              />
            </div>
          </motion.div>

          {/* Right Side: Form Card */}
          <motion.div
            className="lg:col-span-7"
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <form 
              onSubmit={handleSubmit}
              className="bg-card/40 backdrop-blur-xl border border-border/50 p-8 md:p-10 rounded-[2.5rem] shadow-2xl space-y-6"
              noValidate
            >
              <div className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange("name")}
                    placeholder="Enter your full name"
                    className="w-full bg-background/50 border border-border/50 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all placeholder:text-muted-foreground/30"
                  />
                  {errors.name && <p className="text-rose-500 text-[10px] font-bold uppercase ml-1">{errors.name}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
                  <input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange("email")}
                    placeholder="you@example.com"
                    className="w-full bg-background/50 border border-border/50 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all placeholder:text-muted-foreground/30"
                  />
                  {errors.email && <p className="text-rose-500 text-[10px] font-bold uppercase ml-1">{errors.email}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="subject" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Subject</label>
                  <select
                    id="subject"
                    value={form.subject}
                    onChange={handleChange("subject")}
                    className="w-full bg-background/50 border border-border/50 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Select the nature of your request</option>
                    <option value="Technical">Technical Support</option>
                    <option value="Mentorship">Mentorship Inquiry</option>
                    <option value="Partnership">Partnership & Collaboration</option>
                    <option value="General">General Inquiry</option>
                  </select>
                  {errors.subject && <p className="text-rose-500 text-[10px] font-bold uppercase ml-1">{errors.subject}</p>}
                </div>

                <div className="space-y-2">
                  <label htmlFor="message" className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Message</label>
                  <textarea
                    id="message"
                    rows={4}
                    value={form.message}
                    onChange={handleChange("message")}
                    placeholder="Tell us how we can help..."
                    className="w-full bg-background/50 border border-border/50 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40 transition-all resize-none placeholder:text-muted-foreground/30"
                  />
                  {errors.message && <p className="text-rose-500 text-[10px] font-bold uppercase ml-1">{errors.message}</p>}
                </div>
              </div>

              <input type="text" value={form.website} onChange={handleChange("website")} className="hidden" tabIndex={-1} />

              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                disabled={sending}
                className="w-full py-5 rounded-2xl bg-cyan-500 text-black font-bold text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-cyan-400 transition-colors disabled:opacity-50 shadow-lg shadow-cyan-500/20"
              >
                {sending ? "Processing..." : (
                  <>
                    Send Message
                    <Send className="w-4 h-4" />
                  </>
                )}
              </motion.button>

              <AnimatePresence mode="wait">
                {status.message && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`flex items-center gap-3 p-4 rounded-xl text-xs font-semibold tracking-tight border ${
                      status.success 
                        ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" 
                        : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                    }`}
                  >
                    {status.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    {status.message}
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function ContactInfoItem({ icon, label, value, link }) {
  return (
    <div className="group relative flex flex-col gap-2 pl-6">
      <div className="absolute left-0 top-0 h-full w-[2px] bg-border/60 group-hover:bg-cyan-500 transition-colors duration-500" />
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/5 text-cyan-500 group-hover:bg-cyan-500 group-hover:text-black transition-all duration-500">
        {icon}
      </div>
      <div className="space-y-0.5">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">{label}</p>
        {link ? (
          <a href={link} className="text-base lg:text-lg font-semibold text-foreground hover:text-cyan-500 transition-colors tracking-tight block">
            {value}
          </a>
        ) : (
          <p className="text-base lg:text-lg font-semibold text-foreground tracking-tight">{value}</p>
        )}
      </div>
    </div>
  );
}