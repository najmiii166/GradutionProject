/// sections/HeroSection.jsx
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { ShieldCheck, Video, Sparkles } from "lucide-react";
import Button from "../components/Button";

export default function HeroSection({ onOpenJoin }) {
  const heroImageSrc = "/images/landing-hero.png";
  const [index, setIndex] = useState(0);
  const words = ["Ambition", "Success", "Growth", "Vision"];

  // Cycle words every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <section id="home" className="relative overflow-hidden bg-transparent text-foreground pt-12 pb-24">
      {/* Dynamic Background Art */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        {/* Shiny, node-less grid in the top right corner */}
        <div 
          className="absolute top-0 right-0 w-80 h-80 md:w-[30rem] md:h-[30rem] pointer-events-none" 
          style={{ 
            backgroundImage: `
              linear-gradient(to right, rgba(6, 182, 212, 0.4) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(139, 92, 246, 0.4) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
            maskImage: "radial-gradient(circle at top right, black 15%, transparent 65%)",
            WebkitMaskImage: "radial-gradient(circle at top right, black 15%, transparent 65%)"
          }}
        />
        {/* Subtle glow specifically behind the grid to make the colors pop more */}
        <div className="absolute -top-[5%] -right-[5%] h-[300px] w-[300px] rounded-full bg-cyan-400/20 blur-[80px] pointer-events-none" />
        
        <div className="absolute -top-[10%] -left-[10%] h-[600px] w-[600px] rounded-full bg-cyan-500/10 blur-[140px] animate-pulse" />
        <div className="absolute top-[20%] left-[60%] h-[500px] w-[500px] rounded-full bg-violet-500/10 blur-[140px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-8 pt-12 pb-16 md:pt-16 md:pb-20">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <motion.div variants={container} initial="hidden" animate="show">
            {/* Minimalist Badge */}
            <motion.div variants={item} className="inline-flex items-center gap-2 rounded-full border border-border bg-card/50 px-4 py-1.5 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground/70">
                Somali's First Mentor Network
              </span>
            </motion.div>

            {/* Main Heading with Word Flip */}
            <motion.h1 variants={item} className="mt-8 text-5xl font-bold tracking-tight sm:text-7xl leading-[1.1]">
              Expertise <br /> 
              <span className="text-foreground/90">meets </span>
              <div className="inline-block relative h-[1.2em] align-top overflow-hidden">
                <AnimatePresence mode="wait">
                  {/* Sweep to mimic handoff */}
                  <motion.span
                    key={`sweep-${index}`}
                    initial={{ width: 0, opacity: 0.6 }}
                    animate={{ width: "105%", opacity: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45, ease: [0.25, 0.8, 0.4, 1] }}
                    className="pointer-events-none absolute left-0 top-1/2 h-[1.05em] -translate-y-1/2 bg-gradient-to-r from-cyan-500/25 via-cyan-400/15 to-transparent rounded-full"
                  />
                  <motion.span
                    key={words[index]}
                    initial={{ y: 12, opacity: 0, filter: "blur(6px)" }}
                    animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
                    exit={{ y: -12, opacity: 0, filter: "blur(6px)" }}
                    transition={{ duration: 0.45, ease: [0.25, 0.8, 0.4, 1] }}
                    className="relative z-10 block bg-gradient-to-r from-cyan-500 via-cyan-400 to-violet-600 bg-clip-text text-transparent"
                  >
                    {words[index]}
                  </motion.span>
                </AnimatePresence>
              </div>
              <span className="text-cyan-500 ml-1">.</span>
            </motion.h1>

            <motion.p variants={item} className="mt-6 max-w-lg text-lg md:text-xl leading-relaxed text-muted font-medium">
Bridging the gap between ambitious Somali students and experienced mentors.         </motion.p>

            <motion.div variants={item} className="mt-8 flex flex-wrap gap-3">
              <Button
                onClick={onOpenJoin}
                className="bg-foreground text-background hover:scale-105 px-6 py-3.5 rounded-xl shadow-xl transition-all duration-300 font-semibold text-sm"
              >
                Get Started
              </Button>
              <a href="#why" className="inline-flex">
                <Button
                  variant="outline"
                  className="px-6 py-3.5 rounded-xl border-border hover:bg-card hover:border-foreground/20 transition-all font-semibold text-sm"
                >
                  Learn more
                </Button>
              </a>
            </motion.div>

          </motion.div>

          {/* Clean Glass Mockup */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative lg:-mt-6"
          >
            <div className="relative z-10 rounded-[3rem] border border-border/50 bg-card/30 p-3 backdrop-blur-2xl shadow-2xl">
              <div className="overflow-hidden rounded-[2.5rem] bg-background relative group">
                <img 
                  src={heroImageSrc} 
                  alt="MentorLink Dashboard" 
                  className="w-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                />
              </div>

              {/* Floating Stickers Overlapping the Image Edge */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.8, type: "spring", stiffness: 300, damping: 20 }}
                className="absolute top-6 -left-5 md:top-10 md:-left-8 z-20 rounded-2xl border border-border/40 bg-card/95 backdrop-blur-xl px-3 py-2 flex items-center gap-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.2)]"
              >
                <div className="flex bg-blue-500/10 text-blue-500 rounded-xl p-1.5">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-foreground leading-tight">Verified</span>
                  <span className="text-[11px] text-muted-foreground font-medium">Trusted Mentors</span>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.8, x: -20 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ delay: 1, type: "spring", stiffness: 300, damping: 20 }}
                className="absolute -bottom-5 right-6 md:-bottom-6 md:right-12 z-20 rounded-2xl border border-border/40 bg-card/95 backdrop-blur-xl px-3 py-2 flex items-center gap-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.2)]"
              >
                <div className="flex bg-cyan-500/10 text-cyan-500 rounded-xl p-1.5">
                  <Video className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-foreground leading-tight">Live 1:1</span>
                  <span className="text-[11px] text-muted-foreground font-medium">Google Meet</span>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.8, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 1.2, type: "spring", stiffness: 300, damping: 20 }}
                className="absolute top-[45%] -right-5 md:-right-10 -translate-y-1/2 z-20 rounded-2xl border border-border/40 bg-card/95 backdrop-blur-xl px-3 py-2 flex items-center gap-2.5 shadow-[0_16px_40px_rgba(0,0,0,0.2)]"
              >
                <div className="flex bg-violet-500/10 text-violet-500 rounded-xl p-1.5">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-foreground leading-tight">Matched</span>
                  <span className="text-[11px] text-muted-foreground font-medium">Precise pairing</span>
                </div>
              </motion.div>
            </div>
            {/* Glow Behind Image */}
            <div className="absolute -inset-4 -z-10 bg-gradient-to-br from-cyan-500/10 to-violet-500/10 blur-3xl rounded-[4rem]" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}