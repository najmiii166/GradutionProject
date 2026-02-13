import { useState, useEffect, useRef } from "react";
import { motion, useAnimation, useInView, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  Search,
  ClipboardList,
  MessageSquare,
  Video,
  CheckCircle,
  Star,
  Building2,
  ChevronDown,
  BellRing,
  FileText,
  Clock
} from "lucide-react";
import Brand from "../components/Brand";
import ThemeToggle from "../components/ThemeToggle";

export default function Landing() {
  const [showModal, setShowModal] = useState(false);
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  
  // Subtle parallax for the hero section
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  return (
    <div ref={containerRef} className="relative min-h-screen bg-background text-foreground selection:bg-cyan-500/30">
  {/* ==== MINIMALIST BACKGROUND ART ==== */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        
        {/* 1. Animated Floating Orbs - Increased Opacity */}
        <motion.div 
          animate={{ 
            scale: [1, 1.1, 1],
            x: [0, 30, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-[-5%] left-[-5%] w-[500px] h-[500px] bg-cyan-500/[0.12] dark:bg-cyan-500/[0.15] blur-[100px] rounded-full" 
        />
        
        <motion.div 
          animate={{ 
            scale: [1.1, 1, 1.1],
            x: [0, -30, 0],
            y: [0, -40, 0],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-[5%] right-[-5%] w-[600px] h-[600px] bg-violet-500/[0.12] dark:bg-violet-500/[0.15] blur-[100px] rounded-full" 
        />

        {/* 2. Grid Overlay - Using a visible gray instead of currentColor */}
        <div 
          className="absolute inset-0 opacity-[0.1] dark:opacity-[0.2]" 
          style={{ 
            backgroundImage: `linear-gradient(to right, #888 1px, transparent 1px), linear-gradient(to bottom, #888 1px, transparent 1px)`,
            backgroundSize: '60px 60px' 
          }} 
        />

        {/* 3. Topographical Lines - Made thicker (strokeWidth 1) and dark-gray */}
        <svg className="absolute inset-0 w-full h-full opacity-20 dark:opacity-30" xmlns="http://www.w3.org/2000/svg">
          <motion.path
            animate={{ 
              d: [
                "M 0 300 Q 400 150 800 350 T 1600 250",
                "M 0 350 Q 450 200 850 400 T 1650 300",
                "M 0 300 Q 400 150 800 350 T 1600 250"
              ] 
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            stroke="#888" 
            strokeWidth="1"
            fill="transparent"
          />
        </svg>
        
        {/* 4. Radial Mask - Darkens the edges to focus on content */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,var(--background)_85%)]" />
      </div>
      {/* ==== NAVIGATION ==== */}
      <header className="fixed top-0 w-full z-50 backdrop-blur-md border-b border-border">
        <div className="mx-auto max-w-7xl px-8 py-5 flex items-center justify-between">
          <Brand className="text-foreground opacity-90" />
          <nav className="flex items-center gap-4 text-[13px] font-medium tracking-wide">
            <ThemeToggle />
            <a href="/login" className="text-foreground hover:opacity-90 transition-colors">Sign In</a>
            <button 
              onClick={() => setShowModal(true)}
              className="px-6 py-2 bg-foreground text-background rounded-full hover:opacity-95 transition-all duration-300 font-semibold"
            >
              Join
            </button>
          </nav>
        </div>
      </header>

      {/* ==== HERO SECTION: STORYTELLING ==== */}
      <motion.section 
        style={{ opacity: heroOpacity, scale: heroScale }}
        className="relative h-screen flex flex-col items-center justify-center px-6 text-center"
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-6"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] uppercase tracking-widest font-bold">
            <ShieldCheck className="w-3 h-3" /> Admin Verified Network
          </div>
          
          <h1 className="text-5xl md:text-7xl font-light tracking-tight text-foreground max-w-4xl leading-[1.1]">
            Expertise meets <br />
            <span className="italic font-serif text-cyan-400">Ambition.</span>
          </h1>

          <p className="text-foreground text-lg md:text-xl max-w-2xl mx-auto font-light leading-relaxed">
            MentorLink is a private ecosystem where academic excellence is fostered through 
            structured 1:1 sessions, verified expertise, and intentional matching.
          </p>

          {/* ==== REFINED HERO BUTTONS ==== */}
<div className="pt-12 flex flex-col sm:flex-row items-center justify-center gap-6">
  <motion.button
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    onClick={() => setShowModal(true)}
    className="group relative px-10 py-4 bg-foreground text-background rounded-full font-bold text-sm tracking-tight transition-all duration-300 hover:shadow-lg"
  >
    <span className="relative z-10 flex items-center gap-2">
      Get Started <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
    </span>
  </motion.button>

  <motion.a
    href="#how"
    whileHover={{ opacity: 1 }}
    className="text-foreground text-sm font-medium tracking-tight opacity-70 transition-all border-b border-transparent hover:border-border pb-1"
  >
    Learn More
  </motion.a>
</div>
        </motion.div>

        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-10 opacity-20"
        >
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </motion.section>

      {/* ==== THE FULL LIFECYCLE: DETAILED JOURNEY ==== */}
      <section id="how" className="relative py-32 border-t border-border bg-background">
        <div className="mx-auto max-w-6xl px-8">
          <div className="grid lg:grid-cols-3 gap-16">
            <div className="lg:sticky lg:top-32 h-fit space-y-4">
              <h2 className="text-4xl font-light text-foreground leading-tight">The Mentorship <br />Lifecycle</h2>
              <p className="text-foreground leading-relaxed">
                We've built a structured path to ensure every session is productive, 
                secure, and tailored to your specific academic needs.
              </p>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <LifecycleStep 
                icon={<ShieldCheck className="text-emerald-400" />}
                title="Verified Registration"
                desc="Both students and mentors register with their specific fields. Every profile is manually vetted by our Admin team before the dashboard is unlocked."
              />
              <LifecycleStep 
                icon={<Search className="text-cyan-400" />}
                title="Matching & Availability"
                desc="Students instantly see mentors that match their study area. Browse real-time availability slots that fit your university schedule."
              />
              <LifecycleStep 
                icon={<ClipboardList className="text-violet-400" />}
                title="Tailored Request"
                desc="Students fill out a mentor-specific questionnaire during the request. This ensures the mentor understands your goals before the first chat."
              />
              <LifecycleStep 
                icon={<MessageSquare className="text-blue-400" />}
                title="Smart Notifications"
                desc="Mentors receive instant alerts for new requests. Students are notified the moment a request is accepted or rejected."
              />
              <LifecycleStep 
                icon={<Video className="text-rose-400" />}
                title="Google Meet Integration"
                desc="Once accepted, mentors add a session link. Join your live 1:1 meeting directly from the dashboard at the scheduled time."
              />
              <LifecycleStep 
                icon={<FileText className="text-orange-400" />}
                title="Reports & Feedback"
                desc="After the session expires, both parties submit ticket reports and feedback. Mentors can track performance via visual reports."
              />
            </div>
          </div>
        </div>
      </section>

     {/* === STATS / INFO SECTION === */}
<section className="py-24 border-t border-border bg-background/50">
  <div className="mx-auto max-w-7xl px-8 grid md:grid-cols-3 gap-12 text-center">
    <div className="space-y-2">
      <h4 className="text-3xl font-light text-foreground">Verified</h4>
      <p className="text-sm text-foreground/50 uppercase tracking-widest">Only trusted university members</p>
    </div>
    <div className="space-y-2">
      <h4 className="text-3xl font-light text-foreground">Live 1:1</h4>
      <p className="text-sm text-foreground/50 uppercase tracking-widest">Seamless Google Meet sessions</p>
    </div>
    <div className="space-y-2">
      <h4 className="text-3xl font-light text-foreground">Matched</h4>
      <p className="text-sm text-foreground/50 uppercase tracking-widest">Precision area-based pairing</p>
    </div>
  </div>
</section>

      {/* === PARTNERS === */}
      <PartnersSection />

      {/* === FOOTER === */}
      <footer className="py-12 border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <Brand className="opacity-50 grayscale hover:grayscale-0 transition-all" />
          <div className="flex gap-8 text-[10px] tracking-widest text-foreground uppercase">
            <span>Secure</span>
            <span>Verified</span>
            <span>Academic</span>
          </div>
          <p className="text-[10px] text-foreground uppercase tracking-widest">
            © {new Date().getFullYear()} MentorLink Network
          </p>
        </div>
      </footer>

      {showModal && <GetStartedModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

function LifecycleStep({ icon, title, desc }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-10%" });

  return (
    <motion.div 
      ref={ref}
      initial={{ opacity: 0, x: 20 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.8 }}
      className="group bg-card border border-border p-8 rounded-[2rem] hover:opacity-95 transition-all"
    >
      <div className="flex gap-6 items-start">
        <div className="p-3 bg-card rounded-2xl border border-border group-hover:border-cyan-500/50 transition-colors">
          {icon}
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-foreground">{title}</h3>
          <p className="text-sm text-foreground leading-relaxed">{desc}</p>
        </div>
      </div>
    </motion.div>
  );
}

function PartnersSection() {
  const universities = ["SNU", "Simad", "Jamhuriya", "Hormuud", "Mogadishu", "UNISO"];
  return (
    <section className="py-20 bg-background">
      <div className="mx-auto max-w-7xl px-8 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-foreground mb-12 font-bold">In partnership with leading institutions</p>
        <div className="flex flex-wrap justify-center gap-x-16 gap-y-10 opacity-30">
          {universities.map((u, i) => (
            <div key={i} className="flex items-center gap-2 text-sm font-bold tracking-tighter text-foreground">
              <Building2 className="w-4 h-4" /> {u}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GetStartedModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-md p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-card border border-border rounded-[2.5rem] p-12 text-center shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-violet-500" />
        <h2 className="text-3xl font-light text-foreground mb-2">Join MentorLink</h2>
        <p className="text-foreground text-sm mb-10 font-light leading-relaxed">Select your role to begin. Your profile will be submitted to admins for verification.</p>
        <div className="space-y-4">
          <button onClick={() => (window.location.href = "/register/student")} className="w-full py-4 rounded-2xl bg-foreground text-background font-bold hover:opacity-95 transition-all">Student Registration</button>
          <button onClick={() => (window.location.href = "/register/mentor")} className="w-full py-4 rounded-2xl bg-card border border-border text-foreground font-bold hover:opacity-95 transition-all">Mentor Registration</button>
        </div>
        <button onClick={onClose} className="mt-8 text-[10px] text-foreground uppercase tracking-[0.2em] hover:opacity-90 transition">Return</button>
      </motion.div>
    </div>
  );
}