import { Shield, Zap, Users } from "lucide-react";
import { motion } from "framer-motion";

export default function WhyMentorLinkSection() {
  return (
    <section
      id="why"
      className="relative py-20 md:py-24 border-t border-border bg-background scroll-mt-32"
      aria-labelledby="why-heading"
    >
      {/* soft background accents */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-24 right-0 h-64 w-64 bg-cyan-500/20 blur-[110px]" />
        <div className="absolute bottom-0 left-0 h-72 w-72 bg-violet-500/20 blur-[110px]" />
      </div>

      <div className="mx-auto max-w-6xl px-6 md:px-10 space-y-10 md:space-y-12">
        <div className="max-w-2xl space-y-3">
          <p className="text-xs tracking-[0.3em] uppercase text-cyan-500/70 dark:text-cyan-300/80 font-semibold">
            Why MentorLink
          </p>
          <h2
            id="why-heading"
            className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground"
          >
            Designed for serious students and mentors who want progress, not noise.
          </h2>
        </div>

        {/* Bento grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 lg:gap-7">
          {/* Large verification card */}
          <BentoCard
            className="md:col-span-2 md:row-span-2"
            icon={<Shield className="w-5 h-5 text-cyan-500" aria-hidden="true" />}
            label="Verification"
            title="Only trusted, vetted mentors"
            lines={[
              "Accounts are reviewed by admins before they go live.",
              "Profiles show real expertise, not generic titles.",
            ]}
          />

          {/* Fast matching */}
          <BentoCard
            icon={<Zap className="w-5 h-5 text-violet-500" aria-hidden="true" />}
            label="Speed"
            title="From request to session in minutes"
            lines={[
              "Match by subject, level, and availability.",
              "Join directly via integrated session links.",
            ]}
          />

          {/* Community card, a bit wider */}
          <BentoCard
            className="md:col-span-2"
            icon={<Users className="w-5 h-5 text-cyan-500" aria-hidden="true" />}
            label="Community"
            title="Built around Somali universities"
            lines={[
              "Students and mentors come from real campuses.",
              "Sessions focus on your actual courses and goals.",
            ]}
          />
        </div>
      </div>
    </section>
  );
}

function BentoCard({ icon, label, title, lines, className = "" }) {
  const handleMouseMove = (event) => {
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    el.style.setProperty("--mx", `${x}px`);
    el.style.setProperty("--my", `${y}px`);
  };

  return (
    <motion.article
      whileHover={{ scale: 1.01 }}
      onMouseMove={handleMouseMove}
      className={`relative rounded-3xl border border-border/70 bg-card/70 dark:border-white/10 dark:bg-white/5 text-foreground backdrop-blur-md p-5 md:p-6 lg:p-7 text-left overflow-hidden group transition-colors ${className}`}
    >
      {/* Mouse-tracking border glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
        style={{
          padding: "1px",
          background:
            "radial-gradient(220px circle at var(--mx) var(--my), rgba(6,182,212,0.55), rgba(139,92,246,0.28) 35%, transparent 70%)",
          WebkitMask:
            "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
        }}
      />

      {/* soft inner sheen */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{
          background:
            "radial-gradient(140% 120% at 0% 0%, rgba(34,211,238,0.12), transparent 55%), radial-gradient(140% 120% at 100% 100%, rgba(139,92,246,0.10), transparent 55%)",
        }}
      />

      <div className="relative z-10 space-y-3">
        <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full border border-border/70 bg-background/60 dark:border-white/10 dark:bg-white/5">
          {icon}
          <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
            {label}
          </span>
        </div>
        <div className="space-y-2">
          <h3 className="text-base md:text-lg font-semibold text-foreground">{title}</h3>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      </div>
    </motion.article>
  );
}
