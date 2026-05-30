import { Link } from "@tanstack/react-router";
import { MapPin, TrendingUp, Newspaper } from "lucide-react";

const CARDS = [
  {
    to: "/aprop-meu",
    title: "Què passa a prop meu?",
    desc: "Projectes, obres i avisos del teu municipi.",
    Icon: MapPin,
  },
  {
    to: "/temes-populars",
    title: "Temes populars",
    desc: "Els assumptes més consultats aquesta setmana.",
    Icon: TrendingUp,
  },
  {
    to: "/potser-thas-perdut",
    title: "Potser t'has perdut això",
    desc: "Publicacions destacades de l'administració.",
    Icon: Newspaper,
  },
] as const;

export function FeatureCards() {
  return (
    <section aria-label="Explora informació pública" className="mx-auto w-full max-w-5xl px-4 sm:px-6">
      <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
        {CARDS.map(({ to, title, desc, Icon }) => (
          <Link
            key={to}
            to={to}
            className="group relative flex min-h-[160px] cursor-pointer flex-col justify-between overflow-hidden rounded-2xl border border-primary/15 bg-white p-5 text-left shadow-[0_8px_24px_-12px_oklch(0.62_0.13_235/0.25)] ring-1 ring-black/[0.02] transition-all duration-300 hover:-translate-y-1 hover:scale-[1.015] hover:border-primary/40 hover:shadow-[0_20px_44px_-16px_oklch(0.62_0.13_235/0.5)] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:bg-card dark:border-border"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl transition-opacity duration-300 group-hover:bg-primary/20"
            />
            <span className="relative flex flex-col items-center text-center">
              <span className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <span className="block text-lg font-bold leading-tight tracking-tight text-foreground">{title}</span>
              <span className="mt-2 block text-sm leading-relaxed text-muted-foreground">{desc}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
