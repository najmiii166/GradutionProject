import { motion } from "framer-motion";
import { 
  Trophy, 
  Eye, 
  Heart, 
  ArrowRight, 
  Search, 
  ShieldCheck, 
  Clock, 
  Zap 
} from "lucide-react";

export default function AboutSection() {
  return (
    <section
      id="about"
      className="relative bg-background text-foreground overflow-hidden border-t border-border scroll-mt-32 pb-24"
      aria-labelledby="about-heading"
    >
      {/* Refined Background Accents */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-[-10%] h-[600px] w-[600px] bg-cyan-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-[-5%] h-[500px] w-[500px] bg-blue-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="mx-auto max-w-7xl px-6 md:px-10">
        {/* Header - High Contrast Hook */}
        <header className="pt-20 md:pt-28 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl"
          >
            <p className="text-cyan-500 text-[10px] font-bold uppercase tracking-[0.4em] mb-4">
              About MentorLink
            </p>
            <h2 id="about-heading" className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              Built for Somali students <br />
              <span className="text-muted/50">who want serious mentorship.</span>
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl">
              MentorLink quietly bridges the gap between university classrooms and industry, 
              connecting Somali students to verified professionals.
            </p>
          </motion.div>
        </header>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-12 gap-12 mb-32">
          {/* Who We Serve - Large Story Card */}
          <motion.div 
            className="lg:col-span-7 bg-card/40 border border-border/50 rounded-[2.5rem] p-8 md:p-12 backdrop-blur-md relative overflow-hidden group"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
             <div className="relative z-10 space-y-6">
                <h3 className="text-2xl font-bold tracking-tight">Who we serve</h3>
                <div className="space-y-4 text-muted-foreground leading-relaxed text-base md:text-lg">
                  <p>
                    Somali students are ambitious and capable, but access to relevant, localised industry guidance is often fragmented or missing.
                  </p>
                  <p className="text-foreground/80 font-medium">
                    MentorLink creates a trusted space where students can ask specific questions and learn directly from experts who understand both the global market and the Somali context.
                  </p>
                </div>
                <div className="pt-4 flex items-center gap-2 text-cyan-500 font-bold text-sm uppercase tracking-wider">
                  <span>Empowering the next generation</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
             </div>
             {/* Subtle background detail */}
             <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl group-hover:bg-cyan-500/10 transition-colors duration-500" />
          </motion.div>

          {/* Vision & Mission - Vertical Stack */}
          <div className="lg:col-span-5 space-y-6">
            <InfoCard
              icon={<Eye className="w-5 h-5 text-cyan-500" />}
              label="Vision"
              title="A trusted path into industry"
              body="A future where talent is not limited by geography, networks, or noise — but accelerated by precise, human mentorship."
            />
            <InfoCard
              icon={<Trophy className="w-5 h-5 text-blue-500" />}
              label="Mission"
              title="Expertise at the right moment"
              body="We design workflows, tools, and guardrails that make 1:1 mentorship easy to request, dependable to deliver, and measurable."
            />
          </div>
        </div>

        {/* Core Values Section */}
        <div className="space-y-16">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-border/50 pb-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-cyan-500">
                <Heart className="w-6 h-6 animate-pulse" />
                <span className="text-sm font-bold uppercase tracking-[0.3em]">Core Values</span>
              </div>
              <h3 className="text-3xl font-bold tracking-tight">How we drive impact.</h3>
            </div>
          </div>

          {/* Value Pillars */}
          <div className="grid gap-12 md:grid-cols-4">
            <CoreValueItem
              title="Student-first clarity"
              body="Every interaction should remove confusion. We focus on practical, next-step guidance over generic motivation."
              icon={<Search className="w-7 h-7" />}
              delay={0.1}
            />
            <CoreValueItem
              title="Verified trust"
              body="Mentors are reviewed and universities are visible so that students can show up with confidence."
              icon={<ShieldCheck className="w-7 h-7" />}
              delay={0.2}
            />
            <CoreValueItem
              title="Respect for time"
              body="Sessions are structured and documented — respecting the schedules of busy students and professionals."
              icon={<Clock className="w-7 h-7" />}
              delay={0.3}
            />
            <CoreValueItem
              title="Compounding impact"
              body="Insight from one conversation should make the next decision easier through notes and long-term tracking."
              icon={<Zap className="w-7 h-7" />}
              delay={0.4}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function InfoCard({ icon, label, title, body }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="p-8 rounded-[2.5rem] border border-border/50 bg-card/30 backdrop-blur-md transition-all duration-300 hover:border-cyan-500/30"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-background border border-border/50">{icon}</div>
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-500/80">{label}</span>
      </div>
      <h3 className="text-xl font-bold mb-3">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
    </motion.div>
  );
}

function CoreValueItem({ title, body, icon, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6 }}
      className="group relative flex flex-col gap-6 pl-6"
    >
      {/* Decorative Vertical Pillar Line */}
      <div className="absolute left-0 top-0 h-full w-[2px] bg-border group-hover:bg-cyan-500 transition-colors duration-500" />
      
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/5 text-cyan-500 group-hover:bg-cyan-500 group-hover:text-background transition-all duration-500 shadow-sm">
        {icon}
      </div>

      <div className="space-y-3">
        <h3 className="text-lg font-bold text-foreground tracking-tight group-hover:text-cyan-500 transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {body}
        </p>
      </div>
    </motion.div>
  );
}