import nearby from "@/assets/card-nearby.jpg";
import trending from "@/assets/card-trending.jpg";
import missed from "@/assets/card-missed.jpg";
import { MapPin, TrendingUp, Newspaper } from "lucide-react";

type Props = {
  active: string | null;
  onToggle: (id: string) => void;
};

const CARDS = [
  {
    id: "nearby",
    title: "Què passa a prop meu?",
    desc: "Projectes, obres i avisos del teu municipi en un sol lloc.",
    img: nearby,
    Icon: MapPin,
  },
  {
    id: "popular",
    title: "Temes populars",
    desc: "Els assumptes de transparència més consultats aquesta setmana.",
    img: trending,
    Icon: TrendingUp,
  },
  {
    id: "missed",
    title: "Potser t'has perdut això",
    desc: "Publicacions destacades de l'administració recentment.",
    img: missed,
    Icon: Newspaper,
  },
] as const;

export function FeatureCards({ active, onToggle }: Props) {
  return (
    <section
      aria-label="Explora informació pública"
      className="mx-auto max-w-6xl px-4 pb-10 sm:px-6"
    >
      <div className="grid gap-5 md:grid-cols-3">
        {CARDS.map(({ id, title, desc, img, Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              id={id}
              type="button"
              aria-expanded={isActive}
              aria-controls={`${id}-panel`}
              onClick={() => onToggle(id)}
              className={`group bg-card shadow-soft hover:shadow-glow focus-visible:ring-ring relative overflow-hidden rounded-2xl border text-left transition-all hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 ${
                isActive ? "border-primary/50 ring-primary/30 ring-2" : "border-border"
              }`}
            >
              <div className="bg-muted aspect-[16/10] overflow-hidden">
                <img
                  src={img}
                  alt=""
                  width={768}
                  height={480}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2">
                  <span className="bg-primary-soft text-primary inline-flex h-8 w-8 items-center justify-center rounded-lg">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <h3 className="text-foreground text-base font-semibold">{title}</h3>
                </div>
                <p className="text-muted-foreground mt-2 text-sm">{desc}</p>
                <span className="text-primary mt-3 inline-block text-xs font-medium">
                  {isActive ? "Amaga" : "Explora"} →
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
