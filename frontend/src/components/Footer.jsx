import Brand from "./Brand";

export default function Footer() {
  return (
    <footer className="relative py-14 border-t border-border/40 bg-background/50 backdrop-blur-md overflow-hidden" aria-label="Footer">
      {/* Subtle bottom-edge glow */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/10 to-transparent" />
      
      <div className="relative mx-auto max-w-7xl px-8 flex flex-col md:flex-row justify-between items-center gap-8">
        
        {/* Brand: Now with a soft glow hover */}
        <div className="group">
          <Brand className="opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 ease-in-out cursor-default" />
        </div>

        {/* Links: Refined tracking and interactive dots */}
        <div className="flex flex-wrap gap-8 text-[10px] tracking-[0.3em] font-bold text-muted-foreground uppercase justify-center">
          <span className="hover:text-cyan-500 transition-colors cursor-default">Secure</span>
          <span className="hover:text-cyan-500 transition-colors cursor-default">Verified</span>
          <span className="hover:text-cyan-500 transition-colors cursor-default">Academic</span>
          <a 
            href="#contact" 
            className="text-foreground hover:text-cyan-400 transition-all duration-300 flex items-center gap-2"
          >
            <span className="w-1 h-1 rounded-full bg-cyan-500 animate-pulse" />
            Contact
          </a>
        </div>

        {/* Copyright: Subtle and professional */}
        <p className="text-[9px] text-muted-foreground uppercase tracking-[0.25em] font-medium">
          © {new Date().getFullYear()} <span className="text-foreground/60">MentorLink Network</span>
        </p>
      </div>
    </footer>
  );
}