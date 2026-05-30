import contracts from "@/assets/topic-contracts.jpg";
import budgets from "@/assets/topic-budgets.jpg";
import grants from "@/assets/topic-grants.jpg";
import mobility from "@/assets/topic-mobility.jpg";

const TOPICS = [
  {
    title: "Contractació pública",
    desc: "Qui guanya les licitacions i amb quins criteris.",
    tags: ["Contractes", "Licitacions"],
    img: contracts,
  },
  {
    title: "Pressupostos",
    desc: "On va cada euro del pressupost municipal i autonòmic.",
    tags: ["Pressupost", "Despesa"],
    img: budgets,
  },
  {
    title: "Subvencions",
    desc: "Ajudes públiques concedides a entitats i empreses.",
    tags: ["Subvencions", "Ajudes"],
    img: grants,
  },
  {
    title: "Mobilitat",
    desc: "Inversions en transport públic i carrils bici.",
    tags: ["Mobilitat", "Transport"],
    img: mobility,
  },
  {
    title: "Medi ambient",
    desc: "Polítiques de sostenibilitat i qualitat de l'aire.",
    tags: ["Clima", "Sostenibilitat"],
    img: budgets,
  },
];

export function PopularPanel() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {TOPICS.map((t) => (
        <article key={t.title} className="group overflow-hidden rounded-2xl border border-border bg-card shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-glow">
          <div className="aspect-[16/10] overflow-hidden bg-muted">
            <img src={t.img} alt="" loading="lazy" width={768} height={480} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
          </div>
          <div className="p-5">
            <h3 className="text-base font-semibold text-foreground">{t.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{t.desc}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {t.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
