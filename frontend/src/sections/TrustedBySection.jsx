import { useEffect } from "react";
import { motion, useAnimation, useInView, useMotionValue, useSpring } from "framer-motion";
import { useRef, useState } from "react";

const LOGOS = [
  "University of Somalia",
  "SIMAD University",
  "Benadir University",
  "Jamhuriya University",
  "Mogadishu University",
  "Somali National University",
];

const stats = [
  { label: "Mentors", value: 500, suffix: "+" },
  { label: "Students", value: 2000, suffix: "+" },
  { label: "Universities", value: 15, suffix: "+" },
];

function AnimatedNumber({ value, suffix = "" }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, { stiffness: 100, damping: 20 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const unsubscribe = spring.on("change", (latest) => {
      setDisplay(Math.floor(latest));
    });
    return () => unsubscribe();
  }, [spring]);

  useEffect(() => {
    if (inView) {
      // Trigger the spring to animate from its current value to the target
      motionValue.set(value);
    }
  }, [inView, motionValue, value]);

  return (
    <span ref={ref} className="tabular-nums">
      {display}
      {suffix}
    </span>
  );
}

function TrustedBySection() {
  const sectionRef = useRef(null);
  const controls = useAnimation();
  const inView = useInView(sectionRef, { once: true, margin: "-120px" });

  useEffect(() => {
    if (inView) {
      controls.start("visible");
    }
  }, [controls, inView]);

  return (
    <section
      id="trusted"
      ref={sectionRef}
      className="relative bg-background/60 border-y border-border/60 py-12 sm:py-16 scroll-mt-32"
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-emerald-500/5" />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-500">
              Trusted by Somali campuses
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Social proof your mentorship program
            </h2>
          </div>
          <p className="max-w-md text-sm text-muted-foreground">
            Universities across Somalia rely on MentorLink to connect committed
            students with verified mentors — with real outcomes you can measure.
          </p>
        </div>

        {/* Logos marquee */}
        <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/60 px-4 py-3">
          <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent" />

          <div className="flex gap-8 animate-[marquee_28s_linear_infinite] whitespace-nowrap">
            {[...LOGOS, ...LOGOS].map((logo, index) => (
              <div
                key={index}
                className="flex items-center gap-2 text-sm font-medium text-muted-foreground/90"
              >
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border/60 bg-background/80 text-[10px] font-semibold uppercase tracking-wide">
                  {logo
                    .split(" ")
                    .map((word) => word[0])
                    .join("")}
                </span>
                <span className="text-xs sm:text-sm">{logo}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Impact stats */}
        <motion.div
          className="grid gap-4 rounded-2xl border border-border/70 bg-card/60 p-4 sm:grid-cols-3 sm:gap-6 sm:p-6"
          initial="hidden"
          animate={controls}
          variants={{
            hidden: { opacity: 0, y: 16 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { staggerChildren: 0.1 },
            },
          }}
        >
          {stats.map((stat) => (
            <motion.div
              key={stat.label}
              className="flex flex-col items-start gap-1 rounded-xl bg-background/40 p-3 sm:p-4"
              variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
            >
              <div className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {stat.label}
              </div>
              <div className="text-2xl font-semibold leading-snug text-foreground sm:text-3xl">
                <AnimatedNumber value={stat.value} suffix={stat.suffix} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {stat.label === "Mentors" && "Experienced professionals across tech, business, medicine, and more."}
                {stat.label === "Students" && "From first-year undergrads to graduating seniors planning next steps."}
                {stat.label === "Universities" && "Partner institutions across Somalia and the diaspora."}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

export default TrustedBySection;
