import { motion } from "framer-motion";
import Button from "../components/Button";

export default function HeroSection({ onOpenJoin }) {
  const heroImageSrc = "/images/landing-hero.png";

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: [0.21, 0.8, 0.32, 1] },
    },
  };

  return (
    <section
      id="home"
      className="relative overflow-hidden bg-slate-50 dark:bg-slate-950 scroll-mt-32"
      aria-labelledby="hero-heading"
    >
      {/* Subtle animated mesh gradient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          aria-hidden="true"
          animate={{ x: [0, 40, 0], y: [0, 25, 0], scale: [1, 1.08, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full bg-cyan-500/8 dark:bg-cyan-500/30 blur-[120px]"
        />
        <motion.div
          aria-hidden="true"
          animate={{ x: [0, -35, 0], y: [0, -30, 0], scale: [1.05, 1, 1.05] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -bottom-48 -right-40 h-[620px] w-[620px] rounded-full bg-violet-500/7 dark:bg-violet-500/26 blur-[140px]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-70 dark:hidden"
          style={{
            backgroundImage:
              "radial-gradient(90% 60% at 20% 25%, rgba(34,211,238,0.12), transparent 58%), radial-gradient(80% 65% at 80% 70%, rgba(139,92,246,0.10), transparent 60%)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-60 hidden dark:block"
          style={{
            backgroundImage:
              "radial-gradient(90% 60% at 20% 25%, rgba(34,211,238,0.20), transparent 55%), radial-gradient(80% 65% at 80% 70%, rgba(139,92,246,0.18), transparent 58%)",
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 dark:hidden bg-[radial-gradient(circle_at_50%_50%,rgba(248,250,252,0)_0%,rgba(248,250,252,0.55)_70%,rgba(248,250,252,1)_100%)]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 dark:hidden bg-[linear-gradient(to_bottom,rgba(255,255,255,0.65),rgba(255,255,255,0))]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 hidden dark:block bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(2,6,23,0.85)_72%,rgba(2,6,23,1)_100%)]"
        />
      </div>

      <div className="relative mx-auto max-w-7xl px-8 pt-20 pb-16 md:pt-28 md:pb-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-10%" }}
            className="max-w-3xl"
          >
            <motion.p
              variants={item}
              className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400/80"
            >
              MentorLink
            </motion.p>

            <motion.h1
              variants={item}
              id="hero-heading"
              className="mt-4 text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground dark:text-white"
            >
              <span className="text-foreground/95 dark:text-white/95">Unlock Your </span>
              <span className="bg-linear-to-r from-cyan-500 via-cyan-400 to-violet-500 bg-clip-text text-transparent">
                Potential
              </span>
              <span className="text-foreground/95 dark:text-white/95"> with </span>
              <span className="text-foreground/90 dark:text-white/90">Somali’s </span>
              <span className="bg-linear-to-r from-violet-500 via-violet-400 to-cyan-500 bg-clip-text text-transparent">
                Elite Mentors
              </span>
            </motion.h1>

            <motion.p
              variants={item}
              className="mt-5 max-w-2xl text-sm sm:text-base text-muted-foreground leading-relaxed"
            >
              Get matched with verified mentors, book focused 1:1 sessions, and build momentum — from coursework to
              career.
            </motion.p>

            <motion.div variants={item} className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center">
              <Button
                onClick={onOpenJoin}
                className="bg-cyan-500 text-slate-950 hover:bg-cyan-400 ring-1 ring-cyan-500/30 shadow-[0_0_28px_rgba(6,182,212,0.35)] hover:shadow-[0_0_36px_rgba(6,182,212,0.48)]"
              >
                Get Started
              </Button>

              <a href="/mentors" className="inline-flex">
                <Button
                  variant="outline"
                  className="dark:border-white/15 dark:text-white/90 dark:hover:bg-white/5 dark:hover:text-white"
                >
                  Explore Mentors
                </Button>
              </a>
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-10%" }}
            transition={{ duration: 0.7, ease: [0.21, 0.8, 0.32, 1], delay: 0.05 }}
            className="relative"
            aria-label="MentorLink preview"
          >
            <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/70 dark:border-white/15 dark:bg-white/10 backdrop-blur-md p-5 sm:p-6 shadow-[0_20px_80px_rgba(0,0,0,0.18)] dark:shadow-[0_20px_80px_rgba(0,0,0,0.55)]">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-80"
              >
                <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-cyan-500/12 dark:bg-cyan-500/30 blur-[110px]" />
                <div className="absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-violet-500/10 dark:bg-violet-500/30 blur-[120px]" />
                <div className="absolute inset-0 bg-linear-to-br from-white/10 via-transparent to-white/0" />
              </div>

              <div className="relative">
                <div className="aspect-4/3 overflow-hidden rounded-2xl border border-border/70 bg-background/60 dark:border-white/15 dark:bg-slate-950/35">
                  <img
                    src={heroImageSrc}
                    alt="Student having a 1:1 mentoring video call"
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] text-foreground/70 dark:text-white/80">
                  <div className="rounded-full border border-border/70 bg-card/70 dark:border-white/15 dark:bg-white/10 px-3 py-1 text-center">Verified</div>
                  <div className="rounded-full border border-border/70 bg-card/70 dark:border-white/15 dark:bg-white/10 px-3 py-1 text-center">Fast match</div>
                  <div className="rounded-full border border-border/70 bg-card/70 dark:border-white/15 dark:bg-white/10 px-3 py-1 text-center">Live 1:1</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
