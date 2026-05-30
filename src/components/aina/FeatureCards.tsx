import { Link } from "@tanstack/react-router";
import { MapPin, TrendingUp, Newspaper, ArrowRight } from "lucide-react";

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
    <section
      aria-label="Explora informació pública"
      className="mx-auto w-full max-w-5xl px-4 sm:px-6"
    >
      <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
        {CARDS.map(({ to, title, desc, Icon }) => (
          <Link
            key={to}
            to={to}
            className="group border-primary/15 hover:border-primary/40 focus-visible:ring-primary relative flex min-h-[160px] flex-col justify-between overflow-hidden rounded-2xl border bg-white p-5 text-left shadow-[0_8px_24px_-12px_oklch(0.62_0.13_235/0.25)] ring-1 ring-black/[0.02] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-16px_oklch(0.62_0.13_235/0.45)] focus:outline-none focus-visible:ring-2 dark:border-border dark:bg-card"
          >
            <span
              aria-hidden
              className="bg-primary/10 group-hover:bg-primary/20 pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full blur-2xl transition-opacity duration-300"
            />
            <span className="bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground relative inline-flex h-12 w-12 items-center justify-center rounded-xl transition-colors">
              <Icon className="h-6 w-6" aria-hidden="true" />
            </span>
            <span className="relative mt-4 block">
              <span className="text-foreground block text-lg leading-tight font-bold">{title}</span>
              <span className="text-muted-foreground mt-1.5 block text-sm leading-snug">{desc}</span>
            </span>
            <span className="text-primary relative mt-4 inline-flex items-center gap-1 text-xs font-semibold opacity-80 transition-all group-hover:gap-2 group-hover:opacity-100">
              Explora
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
