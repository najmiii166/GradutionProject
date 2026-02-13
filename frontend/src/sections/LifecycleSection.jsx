import { motion } from "framer-motion";
import { ClipboardList, Search, Video } from "lucide-react";

export default function LifecycleSection() {
  return (
    <section
      id="how"
      className="relative py-24 md:py-28 border-t border-border bg-background scroll-mt-32"
      aria-labelledby="lifecycle-heading"
    >
      <div className="mx-auto max-w-6xl px-6 md:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400/80 mb-3">
            How MentorLink works
          </p>
          <h2
            id="lifecycle-heading"
            className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-foreground"
          >
            From signup to your first 1:1
          </h2>
          <p className="mt-4 text-sm md:text-base text-muted-foreground">
            A simple three-step flow that takes you from creating your profile to booking focused sessions with the
            right mentor for your journey.
          </p>
        </motion.div>

        <div className="grid gap-5 md:gap-6 md:grid-cols-3">
          <LifecycleStep
            step="01"
            icon={<ClipboardList className="w-5 h-5 text-cyan-400" aria-hidden="true" />}
            title="Register"
            desc="Create your MentorLink profile, verify your university email, and securely upload your student ID."
          />
          <LifecycleStep
            step="02"
            icon={<Search className="w-5 h-5 text-emerald-400" aria-hidden="true" />}
            title="Find"
            desc="Use smart filters to discover mentors by field, experience, language, and availability — then shortlist your favourites."
          />
          <LifecycleStep
            step="03"
            icon={<Video className="w-5 h-5 text-violet-400" aria-hidden="true" />}
            title="Connect"
            desc="Book 1‑on‑1 sessions, join via secure video links, and keep growing your academic and career confidence."
          />
        </div>
      </div>
    </section>
  );
}

function LifecycleStep({ step, icon, title, desc }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.55 }}
      className="group relative overflow-hidden rounded-3xl border border-border bg-card/70 backdrop-blur-sm p-5 sm:p-6
                 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] hover:border-cyan-500/80"
    >
      {/* Large transparent step indicator */}
      <div className="pointer-events-none absolute -top-2 right-4 text-5xl sm:text-6xl font-semibold tracking-tight text-foreground/5 select-none">
        {step}
      </div>

      <div className="relative z-[1] flex flex-col gap-4">
        <div className="inline-flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-border/80 bg-background/60 group-hover:border-cyan-500/80 transition-colors">
            {icon}
          </div>
          <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-muted-foreground/90">
            Step {step}
          </span>
        </div>

        <div className="space-y-2">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">{title}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{desc}</p>
        </div>
      </div>
    </motion.article>
  );
}
