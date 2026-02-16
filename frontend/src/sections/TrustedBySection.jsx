import { useEffect, useRef, useState } from "react";
import { motion, useAnimation, useInView, useMotionValue, useSpring } from "framer-motion";

const LOGOS = [
  "University of Somalia",
  "SIMAD University",
  "Benadir University",
  "Jamhuriya University",
  "Mogadishu University",
  "Somali National University",
];

const stats = [
  { label: "Mentors", value: 50, suffix: "+" },
  { label: "Students", value: 100, suffix: "+" },
  { label: "Universities", value: 10, suffix: "+" },
];

function AnimatedNumber({ value, suffix = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 50, damping: 20 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => setDisplay(Math.floor(latest)));
    return () => unsubscribe();
  }, [spring]);

  useEffect(() => {
    if (inView) motionValue.set(value);
  }, [inView, motionValue, value]);

  return <span ref={ref} className="tabular-nums">{display}{suffix}</span>;
}

function TrustedBySection() {
  const controls = useAnimation();
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView) controls.start("visible");
  }, [controls, inView]);

  return (
    <section ref={ref} className="relative py-16 border-y border-border/50 bg-background/50 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-full w-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.03),transparent_70%)]" />
      </div>

      <div className="mx-auto max-w-7xl px-8">
        {/* Header Logic */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-500 mb-3">Trusted by higher </p>
            <h2 className="text-3xl font-bold tracking-tight text-foreground">Somali Institutions.</h2>
          </div>
          <p className="max-w-xs text-sm text-muted leading-relaxed">
            Connecting students from top-tier campuses with established professionals.
          </p>
        </div>

        {/* The "Infinite Circle" Horizontal Marquee */}
        <div className="relative mb-16 flex overflow-hidden py-4 before:absolute before:left-0 before:top-0 before:z-10 before:h-full before:w-20 before:bg-gradient-to-r before:from-background before:to-transparent after:absolute after:right-0 after:top-0 after:z-10 after:h-full after:w-20 after:bg-gradient-to-l after:after:from-background after:to-transparent">
          <motion.div
            className="flex flex-nowrap gap-12"
            animate={{ x: [0, -1000] }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "linear",
            }}
          >
            {/* We double/triple the logos to ensure the loop is seamless */}
            {[...LOGOS, ...LOGOS, ...LOGOS].map((logo, i) => (
              <div key={i} className="flex items-center gap-3 shrink-0 opacity-60 hover:opacity-100 transition-opacity cursor-default">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-card border border-border text-[10px] font-bold text-cyan-500 shadow-sm">
                  {logo.split(" ").map(w => w[0]).join("")}
                </div>
                <span className="text-sm font-semibold tracking-wide text-foreground uppercase italic">{logo}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              initial="hidden"
              animate={controls}
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0 }
              }}
              className="group relative overflow-hidden rounded-[2rem] border border-border/50 bg-card/30 p-8 backdrop-blur-sm transition-all hover:border-cyan-500/30"
            >
              <div className="relative z-10">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted mb-2">{stat.label}</p>
                <div className="text-4xl font-bold tracking-tighter text-foreground">
                  <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                </div>
              </div>
              {/* Subtle background icon/pattern */}
              <div className="absolute -bottom-4 -right-4 text-cyan-500/5 transition-transform group-hover:scale-110 group-hover:-rotate-12">
                 <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TrustedBySection;