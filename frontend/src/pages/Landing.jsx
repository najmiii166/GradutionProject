import { useState, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import GetStartedModal from "../components/GetStartedModal";
import FloatingThemeToggle from "../components/FloatingThemeToggle";
import HeroSection from "../sections/HeroSection";
import LifecycleSection from "../sections/LifecycleSection";
import AboutSection from "../sections/AboutSection";
import ContactSection from "../sections/ContactSection";
import WhyMentorLinkSection from "../sections/WhyMentorLinkSection";
import TrustedBySection from "../sections/TrustedBySection";

export default function Landing() {
  const [showModal, setShowModal] = useState(false);
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  return (
    <div ref={containerRef} className="relative min-h-screen bg-background text-foreground selection:bg-cyan-500/30">
      {/* Subtle background art to give depth */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -left-10 top-10 h-80 w-80 bg-cyan-500/10 blur-3xl" />
        <div className="absolute right-0 bottom-10 h-96 w-96 bg-violet-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,var(--background)_80%)]" />
      </div>

      <Navbar onOpenJoin={() => setShowModal(true)} />
      <FloatingThemeToggle />

      <main className="relative z-10 pt-24">
        <motion.div style={{ opacity: heroOpacity, scale: heroScale }}>
          <HeroSection onOpenJoin={() => setShowModal(true)} />
        </motion.div>

        <WhyMentorLinkSection />
        <TrustedBySection />
        <LifecycleSection />
        <AboutSection />

        <ContactSection />
      </main>

      <Footer />

      {showModal && <GetStartedModal onClose={() => setShowModal(false)} />}
    </div>
  );
}

