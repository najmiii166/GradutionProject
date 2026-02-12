import { Building2 } from "lucide-react";

export default function PartnersSection() {
  const universities = ["SNU", "Simad", "Jamhuriya", "Hormuud", "Mogadishu", "UNISO"];

  return (
    <section className="py-20 bg-background" aria-labelledby="partners-heading">
      <div className="mx-auto max-w-7xl px-8 text-center">
        <p
          id="partners-heading"
          className="text-[10px] uppercase tracking-[0.3em] text-foreground mb-12 font-bold"
        >
          In partnership with leading institutions
        </p>
        <div className="flex flex-wrap justify-center gap-x-16 gap-y-10 opacity-30">
          {universities.map((u) => (
            <div
              key={u}
              className="flex items-center gap-2 text-sm font-bold tracking-tighter text-foreground"
            >
              <Building2 className="w-4 h-4" aria-hidden="true" />
              <span>{u}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
