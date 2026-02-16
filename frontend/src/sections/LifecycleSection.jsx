import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import { ClipboardList, Search, Video, MessageCircle } from "lucide-react";

export default function LifecycleSection() {
  // Container variants for a staggered entrance
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.2 },
    },
  };

  return (
    <section
      id="how"
      className="relative py-24 md:py-32 border-t border-border bg-background scroll-mt-32 overflow-hidden"
      aria-labelledby="lifecycle-heading"
    >
      {/* Subtle Grid Background - Works in Light & Dark */}
      <div className="absolute inset-0 -z-10 opacity-[0.03] dark:opacity-[0.05] [mask-image:radial-gradient(ellipse_at_center,white,transparent)]">
        <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="mx-auto max-w-7xl px-8 md:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-500 mb-4">
            How MentorLink works
          </p>
          <h2
            id="lifecycle-heading"
            className="text-4xl md:text-5xl font-bold tracking-tight text-foreground"
          >
            From sign-up to real outcomes
          </h2>
          <p className="mt-6 text-base md:text-lg text-muted leading-relaxed">
            Students get guidance, mentors share expertise, and admins see progress. 
            MentorLink handles profiles, matching, scheduling, and follow-ups so 
            everyone stays aligned.
          </p>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
        >
          <LifecycleStep
            step="01"
            icon={<ClipboardList className="w-5 h-5 text-cyan-500" />}
            title="Create your profile"
            desc="Students and mentors onboard with verified university or professional details, availability, and focus areas."
            color="cyan"
          />
          <LifecycleStep
            step="02"
            icon={<Search className="w-5 h-5 text-emerald-500" />}
            title="Match & choose"
            desc="Matches happen by focus/expertise areas. Students either pick an open slot or request recommendations by sharing the days they prefer."
            color="emerald"
          />
          <LifecycleStep
            step="03"
            icon={<Video className="w-5 h-5 text-violet-500" />}
            title="Meet, track, follow up"
            desc="Join secure video sessions, capture notes, and schedule follow-ups so progress compounds for students and mentors alike."
            color="violet"
          />
          <LifecycleStep
            step="04"
            icon={<MessageCircle className="w-5 h-5 text-amber-500" />}
            title="Chat & support"
            desc="Use in-app chat for quick clarifications between sessions so students stay unblocked and mentors stay aligned."
            color="amber"
          />
        </motion.div>
      </div>
    </section>
  );
}

function LifecycleStep({ step, icon, title, desc, color }) {
  // Mouse tracking for the spotlight effect
  let mouseX = useMotionValue(0);
  let mouseY = useMotionValue(0);

  function onMouseMove({ currentTarget, clientX, clientY }) {
    let { left, top } = currentTarget.getBoundingClientRect();
    mouseX.set(clientX - left);
    mouseY.set(clientY - top);
  }

  return (
    <motion.article
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
      }}
      onMouseMove={onMouseMove}
      className="group relative rounded-[2rem] border border-border/50 bg-card/40 backdrop-blur-md p-8
                 transition-all duration-500 hover:-translate-y-2 hover:border-cyan-500/30 overflow-hidden"
    >
      {/* Dynamic Spotlight Background */}
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-[2rem] opacity-0 transition duration-300 group-hover:opacity-100"
        style={{
          background: useMotionTemplate`
            radial-gradient(
              450px circle at ${mouseX}px ${mouseY}px,
              rgba(6, 182, 212, 0.07),
              transparent 80%
            )
          `,
        }}
      />

      {/* Large transparent step indicator */}
      <div className="pointer-events-none absolute -top-2 right-6 text-7xl font-bold tracking-tighter text-foreground/[0.03] select-none transition-colors group-hover:text-cyan-500/10">
        {step}
      </div>

      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-foreground/5 border border-border/50 group-hover:scale-110 group-hover:border-cyan-500/30 transition-all duration-300">
          {icon}
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
             <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted/60">
              Step {step}
            </span>
            <div className="h-px w-8 bg-border group-hover:w-12 group-hover:bg-cyan-500/30 transition-all duration-500" />
          </div>
          <h3 className="text-xl font-bold text-foreground tracking-tight">{title}</h3>
          <p className="text-sm text-muted leading-relaxed">{desc}</p>
        </div>
      </div>
    </motion.article>
  );
}