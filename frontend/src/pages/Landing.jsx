import { useState } from "react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import GetStartedModal from "../components/GetStartedModal";
import HeroSection from "../sections/HeroSection";
import LifecycleSection from "../sections/LifecycleSection";
import AboutSection from "../sections/AboutSection";
import ContactSection from "../sections/ContactSection";
import PartnersSection from "../sections/PartnersSection";
import WhyMentorLinkSection from "../sections/WhyMentorLinkSection";
import TrustedBySection from "../sections/TrustedBySection";
export default function Landing() {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="relative min-h-screen bg-background text-foreground selection:bg-cyan-500/50">
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
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_50%,transparent_0%,var(--background)_85%)]" />
      </div>
      <Navbar onOpenJoin={() => setShowModal(true)} />

      <main className="relative z-10 pt-24">
        <HeroSection onOpenJoin={() => setShowModal(true)} />
        <WhyMentorLinkSection />
        <TrustedBySection />
        <LifecycleSection />

        {/* === ABOUT SUMMARY === */}
        <AboutSection />

        {/* === STATS / INFO SECTION === */}
        <section className="py-24 border-t border-border bg-background/50">
          <div className="mx-auto max-w-7xl px-8 grid md:grid-cols-3 gap-12 text-center">
            <div className="space-y-2">
              <h4 className="text-3xl font-light text-foreground">Verified</h4>
              <p className="text-sm text-foreground/60 uppercase tracking-widest">
                Only trusted university members
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-3xl font-light text-foreground">Live 1:1</h4>
              <p className="text-sm text-foreground/60 uppercase tracking-widest">
                Seamless Google Meet sessions
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="text-3xl font-light text-foreground">Matched</h4>
              <p className="text-sm text-foreground/60 uppercase tracking-widest">
                Precision area-based pairing
              </p>
            </div>
          </div>
        </section>

        {/* === CONTACT / SUPPORT === */}
        <ContactSection />

        {/* === PARTNERS === */}
        <PartnersSection />
      </main>

      <Footer />

      {showModal && <GetStartedModal onClose={() => setShowModal(false)} />}
    </div>
  );
}