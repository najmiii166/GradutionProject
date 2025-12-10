import { useState, useEffect, useRef } from "react";
import { motion, useAnimation, useInView } from "framer-motion";
import {
  CalendarClock,
  ShieldCheck,
  BarChart3,
  Sparkles,
  ArrowRight,
  Star,
  Building2,
  CheckCircle2,
  UserCheck,
  Link2,
} from "lucide-react";
import Brand from "../components/Brand";
import Button from "../components/Button";

export default function Landing() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="relative min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* ==== Animated background with depth ==== */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          className="absolute -top-32 -left-32 h-[400px] w-[400px] bg-sky-500/25 blur-[160px] rounded-full"
          animate={{ y: [0, 40, 0] }}
          transition={{ repeat: Infinity, duration: 10, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-64 right-0 h-[500px] w-[500px] bg-violet-500/20 blur-[200px] rounded-full"
          animate={{ y: [0, -40, 0] }}
          transition={{ repeat: Infinity, duration: 12, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] [background-size:44px_44px]" />
      </div>

      {/* ==== HEADER ==== */}
      <header className="relative z-20">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 py-6 flex items-center justify-between">
          <Brand className="text-white" />
          <nav className="flex items-center gap-5 text-sm">
            <a
              href="/login"
              className="text-slate-300 hover:text-cyan-400 transition"
            >
              Login
            </a>
            <motion.button
              whileHover={{ scale: 1.05 }}
              onClick={() => setShowModal(true)}
              className="rounded-full bg-gradient-to-r from-cyan-600 to-violet-600 px-5 py-1.5 text-sm font-semibold shadow-md hover:shadow-[0_0_20px_rgba(56,189,248,0.4)] transition"
            >
              Get started
            </motion.button>
          </nav>
        </div>
      </header>

      {/* ==== HERO ==== */}
      <section className="relative flex flex-col items-center justify-center text-center px-6 pt-24 pb-28 sm:px-8">
        {/* Background gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-sky-900/40 via-slate-950/60 to-slate-950 -z-10" />

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center rounded-full bg-slate-900/70 px-4 py-1 text-xs font-medium text-slate-200 ring-1 ring-slate-700/80 backdrop-blur-sm"
        >
          🎓 Empowering Universities, Students & Mentors
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mt-6 max-w-3xl"
        >
          The future of{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-blue-400 bg-clip-text text-transparent">
            mentorship & learning
          </span>{" "}
          is here.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-slate-300 text-base sm:text-lg mt-6 max-w-xl leading-relaxed"
        >
          MentorLink connects students with verified mentors for structured 1:1
          sessions, growth tracking, and academic excellence within a trusted
          ecosystem.
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center gap-4 mt-10"
        >
          <button
            onClick={() => setShowModal(true)}
            className="group relative overflow-hidden rounded-full bg-gradient-to-r from-cyan-500 via-violet-500 to-blue-500 px-8 py-3 text-sm sm:text-base font-semibold text-white shadow-lg hover:scale-[1.03] transition-all duration-300"
          >
            <span className="relative z-10 flex items-center gap-2">
              Get started <ArrowRight className="w-4 h-4" />
            </span>
            <span className="absolute inset-0 bg-gradient-to-r from-sky-400 via-cyan-400 to-violet-500 opacity-0 group-hover:opacity-30 blur-xl transition-opacity" />
          </button>

          <a
            href="#why"
            className="rounded-full border border-slate-700 px-8 py-3 text-sm sm:text-base font-medium text-slate-300 hover:border-cyan-400 hover:text-cyan-300 transition"
          >
            Learn more
          </a>
        </motion.div>
      </section>

      {/* === WHY SECTION === */}
      <FeatureSection />

      {/* === HOW IT WORKS === */}
      <AnimatedWaveSection />

      {/* === TESTIMONIALS === */}
      <TestimonialsSection />

      {/* === PARTNERS === */}
      <PartnersSection />

      {/* === FOOTER === */}
      <footer className="border-t border-slate-800/80 bg-slate-950/95 text-slate-400 text-xs">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 py-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p>© {new Date().getFullYear()} MentorLink. All rights reserved.</p>
          <p>Empowering mentorship through innovation.</p>
        </div>
      </footer>

      {showModal && <GetStartedModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

/* === WHY SECTION === */
function FeatureSection() {
  const features = [
    {
      icon: <Sparkles className="w-5 h-5 text-cyan-400" />,
      title: "Smart Matching",
      text: "AI-assisted pairing between students and mentors by interests and study fields.",
    },
    {
      icon: <CalendarClock className="w-5 h-5 text-violet-400" />,
      title: "Scheduling Freedom",
      text: "Mentors set availability, students pick slots—no overlaps, no confusion.",
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-emerald-400" />,
      title: "Verified Network",
      text: "Every user is verified by their university or admin before joining.",
    },
    {
      icon: <BarChart3 className="w-5 h-5 text-blue-400" />,
      title: "Growth Insights",
      text: "Track sessions, progress, and mentorship performance visually.",
    },
  ];

  return (
    <section id="why" className="border-t border-slate-800/70 bg-slate-950/70 py-20">
      <div className="mx-auto max-w-7xl px-6 sm:px-8">
        <h2 className="text-2xl font-bold text-white mb-3">Why MentorLink</h2>
        <p className="text-slate-400 mb-10">
          The complete mentorship ecosystem
        </p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.05 }}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-md hover:border-cyan-500/40 transition"
            >
              <div className="flex items-center gap-3 mb-2">
                {f.icon}
                <h3 className="text-sm font-semibold">{f.title}</h3>
              </div>
              <p className="text-xs text-slate-400">{f.text}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* === HOW IT WORKS - Animated Wave === */
function AnimatedWaveSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-20% 0px" });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) controls.start("visible");
  }, [isInView]);

  const steps = [
    {
      icon: <UserCheck className="w-6 h-6 text-cyan-400" />,
      title: "Register",
      text: "Create your student or mentor account with verified university credentials.",
    },
    {
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-400" />,
      title: "Get Verified",
      text: "Admins authenticate IDs and profiles before allowing connections.",
    },
    {
      icon: <Link2 className="w-6 h-6 text-violet-400" />,
      title: "Connect & Learn",
      text: "Request sessions, get matched, and start growing with your mentor.",
    },
  ];

  const waveVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.3, duration: 0.7, ease: "easeOut" },
    }),
  };

  return (
    <section
      ref={ref}
      id="how"
      className="border-t border-slate-800 bg-slate-950 py-24 overflow-hidden"
    >
      <div className="mx-auto max-w-5xl px-6 sm:px-8 text-center">
        <h2 className="text-3xl font-bold mb-12 text-white">How It Works</h2>
        <div className="relative flex flex-col items-center space-y-20">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              custom={i}
              initial="hidden"
              animate={controls}
              variants={waveVariants}
              className="flex flex-col items-center text-center relative"
            >
              <div className="rounded-full bg-slate-900/80 border border-slate-700 p-4 shadow-lg mb-4">
                {step.icon}
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">
                {step.title}
              </h3>
              <p className="text-sm text-slate-400 max-w-sm">{step.text}</p>

              {i < steps.length - 1 && (
                <motion.div
                  initial={{ scaleY: 0 }}
                  animate={isInView ? { scaleY: 1 } : { scaleY: 0 }}
                  transition={{ delay: 0.4 + i * 0.3, duration: 0.6 }}
                  className="absolute top-full w-[2px] h-20 bg-gradient-to-b from-cyan-400/40 to-violet-400/40"
                />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* === TESTIMONIALS === */
function TestimonialsSection() {
  const testimonials = [
    {
      name: "Amira N.",
      text: "MentorLink helped me connect with a senior researcher in my field — game changer!",
      role: "Graduate Student, Cairo University",
    },
    {
      name: "Dr. Evans L.",
      text: "As a mentor, the scheduling and communication tools save me hours every week.",
      role: "Professor, University of Nairobi",
    },
    {
      name: "Tariq A.",
      text: "My sessions boosted my thesis progress and confidence massively.",
      role: "Mentee, Addis Ababa University",
    },
  ];

  return (
    <section className="border-t border-slate-800/70 bg-slate-950/80 py-20">
      <div className="mx-auto max-w-6xl px-6 sm:px-8 text-center">
        <h2 className="text-2xl font-bold text-white mb-2">What Our Users Say</h2>
        <p className="text-slate-400 mb-10 text-sm">
          Trusted by mentors and students across universities.
        </p>
        <div className="grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.03 }}
              className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-md hover:border-cyan-500/30"
            >
              <Star className="w-5 h-5 text-cyan-400 mx-auto mb-3" />
              <p className="text-sm text-slate-300 mb-3 italic">“{t.text}”</p>
              <p className="text-sm font-semibold text-white">{t.name}</p>
              <p className="text-xs text-slate-400">{t.role}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* === PARTNERS === */
function PartnersSection() {
  const universities = [
    "SNU",
    "Simada",
    "Jamhuriya",
    "Hormuud",
    "Mogadishu",
    "UNISO",
  ];
  return (
    <section className="border-t border-slate-800/70 bg-slate-950/70 py-14">
      <div className="mx-auto max-w-6xl px-6 sm:px-8 text-center">
        <h2 className="text-2xl font-semibold mb-6 text-white">
          Partner Universities
        </h2>
        <div className="flex flex-wrap justify-center gap-6 text-slate-400 text-sm">
          {universities.map((u, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.1 }}
              className="flex items-center gap-2"
            >
              <Building2 className="w-4 h-4 text-cyan-400" /> {u}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* === Modal === */
function GetStartedModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-sky-600/10 via-violet-500/10 to-blue-500/10 blur-2xl" />
        <div className="relative z-10 text-center space-y-4">
          <h2 className="text-lg font-semibold bg-gradient-to-r from-cyan-400 via-violet-400 to-blue-400 bg-clip-text text-transparent">
            Get Started with MentorLink
          </h2>
          <p className="text-sm text-slate-400">
            Choose how you’d like to join and start your journey.
          </p>
          <div className="flex flex-col gap-3">
            <motion.button
              whileHover={{ scale: 1.04 }}
              onClick={() => (window.location.href = "/register/student")}
              className="w-full rounded-full bg-gradient-to-r from-sky-500 to-violet-500 px-5 py-2.5 font-semibold text-white shadow-md hover:shadow-[0_0_20px_rgba(56,189,248,0.4)] transition"
            >
              Continue as Student
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.04 }}
              onClick={() => (window.location.href = "/register/mentor")}
              className="w-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-2.5 font-semibold text-white shadow-md hover:shadow-[0_0_20px_rgba(52,211,153,0.4)] transition"
            >
              Continue as Mentor
            </motion.button>
          </div>
          <button
            onClick={onClose}
            className="mt-4 text-xs text-slate-400 hover:text-slate-200 transition"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
}
