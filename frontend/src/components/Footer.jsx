import Brand from "./Brand";

export default function Footer() {
  return (
    <footer className="py-12 border-t border-border bg-background" aria-label="Footer">
      <div className="mx-auto max-w-7xl px-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <Brand className="opacity-60 grayscale hover:grayscale-0 transition-all" />
        <div className="flex flex-wrap gap-6 text-[10px] tracking-widest text-foreground uppercase justify-center">
          <span>Secure</span>
          <span>Verified</span>
          <span>Academic</span>
          <a href="#contact" className="hover:opacity-80 transition-colors">
            Contact
          </a>
        </div>
        <p className="text-[10px] text-foreground uppercase tracking-widest">
          © {new Date().getFullYear()} MentorLink Network
        </p>
      </div>
    </footer>
  );
}

