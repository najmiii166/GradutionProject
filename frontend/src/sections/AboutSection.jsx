import { motion } from "framer-motion";
import { Trophy, Eye, Heart } from "lucide-react";

export default function AboutSection() {
  return (
    <section
      id="about"
      className="relative bg-background text-foreground overflow-hidden border-t border-border scroll-mt-32"
      aria-labelledby="about-heading"
    >
      {/* Background accents */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute -top-24 -left-24 h-[520px] w-[520px] bg-cyan-500/15 blur-[140px] rounded-full" />
        <div className="absolute top-60 -right-16 h-[480px] w-[480px] bg-blue-600/15 blur-[140px] rounded-full" />
        <div className="absolute bottom-0 left-1/4 h-[300px] w-[700px] bg-linear-to-r from-cyan-500/10 via-transparent to-blue-500/10 blur-[100px]" />
      </div>

      <header className="max-w-6xl mx-auto px-6 md:px-10 pt-20 md:pt-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}
          className="max-w-3xl"
        >
          <p className="text-cyan-400/80 text-xs tracking-[0.3em] uppercase font-semibold mb-4">
            About MentorLink
          </p>
          <h2
            id="about-heading"
            className="text-2xl sm:text-3xl md:text-4xl leading-tight font-semibold tracking-tight"
          >
            Built for Somali students who want serious mentorship
          </h2>
          <p className="mt-4 max-w-2xl text-sm md:text-base text-foreground/80">
            MentorLink quietly bridges the gap between university classrooms and industry — connecting Somali students
            to verified professionals who can help them make confident, informed decisions about their studies and
            careers.
          </p>
        </motion.div>
      </header>

      <section className="mx-auto max-w-6xl px-6 md:px-10 py-16 md:py-20 space-y-12">
        {/* Vision & Mission */}
        <div className="grid gap-8 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] items-start">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.6 }}
            className="space-y-4 text-sm md:text-base text-foreground/80"
          >
            <h3 className="text-lg font-semibold tracking-tight text-foreground">Who we serve</h3>
            <p>
              Somali students are ambitious and capable, but access to relevant, localised industry guidance is often
              fragmented or missing. MentorLink creates a trusted space where students can ask specific questions,
              sanity‑check decisions, and learn directly from experts who understand both the global market and the
              Somali context.
            </p>
            <p>
              For mentors, MentorLink offers a structured way to give back — with clear requests, defined sessions, and
              impact that is visible in each student&apos;s journey.
            </p>
          </motion.div>

          <div className="space-y-4">
            <InfoCard
              icon={<Eye className="w-4 h-4 text-cyan-400" aria-hidden="true" />}
              label="Vision"
              title="Every Somali student has a trusted path into industry."
              body="A future where talent is not limited by geography, networks, or noise — but accelerated by precise, human mentorship."
            />
            <InfoCard
              icon={<Trophy className="w-4 h-4 text-cyan-400" aria-hidden="true" />}
              label="Mission"
              title="Connect students with the right expert at the right moment."
              body="We design workflows, tools, and guardrails that make 1:1 mentorship easy to request, dependable to deliver, and measurable for institutions."
            />
          </div>
        </div>

        {/* Core values – Bento grid */}
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-between gap-4 flex-wrap"
          >
            <div className="flex items-center gap-2 text-sm font-semibold tracking-[0.18em] uppercase text-cyan-400/90">
              <Heart className="w-4 h-4" aria-hidden="true" />
              <span>Core values</span>
            </div>
            <p className="max-w-md text-xs md:text-sm text-muted-foreground">
              Principles that shape how we design MentorLink, select mentors, and support students on every session.
            </p>
          </motion.div>

          <div className="grid gap-4 md:grid-cols-3 auto-rows-fr">
            <CoreValueCard
              title="Student-first clarity"
              body="Every interaction should remove confusion, not add more. We focus on practical, next-step guidance over generic motivation."
              className="md:col-span-2"
            />
            <CoreValueCard
              title="Verified trust"
              body="Mentors are reviewed, universities are visible, and expectations are clear so that students can show up with confidence."
            />
            <CoreValueCard
              title="Respect for time"
              body="Sessions are structured, timeboxed, and documented — respecting the schedules of busy students and professionals."
            />
            <CoreValueCard
              title="Compounding impact"
              body="Insight from one conversation should make the next decision easier. We encourage notes, reports, and long‑term tracking."
              className="md:col-span-2"
            />
          </div>
        </div>
      </section>
    </section>
  );
}

function InfoCard({ icon, label, title, body }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-2xl border border-border/70 bg-card/70 dark:border-white/10 dark:bg-white/5 backdrop-blur-md p-4 sm:p-5"
    >
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <h3 className="mt-2 text-sm sm:text-base font-semibold tracking-tight text-foreground">{title}</h3>
      <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">{body}</p>
    </motion.article>
  );
}

function CoreValueCard({ title, body, className = "" }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 0.55 }}
      className={`group relative overflow-hidden rounded-2xl border border-border/70 bg-card/70 dark:border-white/10 dark:bg-white/5 backdrop-blur-md p-4 sm:p-5 ${className}`}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" 
           style={{
             background:
               "radial-gradient(600px 260px at 0% 0%, rgba(34,211,238,0.16), transparent 65%)",
           }}
      />
      <div className="relative z-10 space-y-2">
        <h3 className="text-sm sm:text-base font-semibold tracking-tight text-foreground">{title}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">{body}</p>
      </div>
    </motion.article>
  );
}
