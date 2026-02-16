/// WhyMentorLinkSection.jsx
import { Shield, Zap, Users } from "lucide-react";
import { motion } from "framer-motion";

export default function WhyMentorLinkSection() {
  return (
    <section
      id="why"
      className="relative py-20 border-t border-border bg-background scroll-mt-24"
    >
      {/* Soft background accents */}
      <div className="absolute inset-0 -z-10 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-[10%] h-[400px] w-[400px] bg-cyan-500/5 blur-[120px]" />
        <div className="absolute bottom-0 left-[10%] h-[400px] w-[400px] bg-violet-500/5 blur-[120px]" />
      </div>

      <div className="mx-auto max-w-7xl px-8">
        <div className="max-w-3xl mb-12">
          <p className="text-[11px] tracking-[0.3em] uppercase text-cyan-500 font-bold mb-3">
            Why MentorLink 
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground leading-[1.2]">
            Designed for serious students and mentors <br className="hidden md:block" />
            who want <span className="text-muted/60 font-medium">progress.</span>
          </h2>
        </div>

        {/* Organized Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-6 md:grid-rows-2 gap-4 lg:gap-5 h-auto md:h-[500px]">
          
          {/* Main Card: Verification (Takes up left 3/6 and full height) */}
          <BentoCard
            className="md:col-span-3 md:row-span-2"
            icon={<Shield className="w-5 h-5 text-cyan-500" />}
            label="Verification"
            title="Only trusted, vetted mentors"
            description="Every profile is manually reviewed by our team to ensure real-world expertise and academic integrity before going live."
            highlight="Manual Admin Review"
          />

          {/* Top Right: Fast Matching (Takes up right 3/6 and top half) */}
          <BentoCard
            className="md:col-span-3 md:row-span-1"
            icon={<Zap className="w-5 h-5 text-violet-500" />}
            label="Speed"
            title="Request to session in minutes"
            description="Our AI-powered matching pairs you with the right mentor based on your specific subject and university level."
          />

          {/* Bottom Right: Community (Takes up right 3/6 and bottom half) */}
          <BentoCard
            className="md:col-span-3 md:row-span-1"
            icon={<Users className="w-5 h-5 text-cyan-500" />}
            label="Community"
            title="Built around Somali universities"
            description="Focused 1:1 sessions tailored to your actual campus curriculum and career goals in the local market."
          />
        </div>
      </div>
    </section>
  );
}

function BentoCard({ icon, label, title, description, highlight, className = "" }) {
  const handleMouseMove = (event) => {
    const el = event.currentTarget;
    const rect = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    el.style.setProperty("--my", `${event.clientY - rect.top}px`);
  };

  return (
    <motion.article
      onMouseMove={handleMouseMove}
      className={`relative group rounded-[2rem] border border-border/50 bg-card/40 backdrop-blur-sm p-8 overflow-hidden transition-all duration-300 hover:border-cyan-500/30 ${className}`}
    >
      {/* Mouse Glow Effect */}
      <div
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: "radial-gradient(400px circle at var(--mx) var(--my), rgba(6,182,212,0.08), transparent 80%)",
        }}
      />

      <div className="relative z-10 h-full flex flex-col justify-between">
        <div>
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-foreground/5 text-foreground mb-6">
            {icon}
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-muted mb-2 font-bold">{label}</p>
          <h3 className="text-xl font-bold text-foreground mb-3">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-[280px]">
            {description}
          </p>
        </div>

        {highlight && (
          <div className="mt-6 flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-cyan-500 animate-pulse" />
            <span className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider">{highlight}</span>
          </div>
        )}
      </div>
    </motion.article>
  );
}