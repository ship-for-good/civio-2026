import contracts from "@/assets/topic-contracts.jpg";
import budgets from "@/assets/topic-budgets.jpg";
import grants from "@/assets/topic-grants.jpg";
import mobility from "@/assets/topic-mobility.jpg";

const ITEMS = [
  {
    title: "Publicat el portal d'alts càrrecs 2026",
    summary: "Inclou retribucions, agendes i declaracions de béns actualitzades.",
    date: "26 maig 2026",
    img: contracts,
  },
  {
    title: "Nou conveni col·lectiu municipal",
    summary: "Detalls del conveni signat amb els treballadors públics aquest mes.",
    date: "22 maig 2026",
    img: grants,
  },
  {
    title: "Auditoria del transport metropolità",
    summary: "Resultats de l'auditoria independent sobre eficiència i costos.",
    date: "18 maig 2026",
    img: mobility,
  },
  {
    title: "Memòria anual de subvencions",
    summary: "Resum amb totes les ajudes concedides durant l'any anterior.",
    date: "14 maig 2026",
    img: budgets,
  },
];

export function MissedPanel() {
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {ITEMS.map((i) => (
        <article key={i.title} className="group flex gap-4 overflow-hidden rounded-2xl border border-border bg-card p-3 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-glow">
          <div className="aspect-square h-28 w-28 flex-none overflow-hidden rounded-xl bg-muted">
            <img src={i.img} alt="" loading="lazy" width={224} height={224} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]" />
          </div>
          <div className="min-w-0 flex-1 py-1">
            <time className="text-xs font-medium text-accent">{i.date}</time>
            <h3 className="mt-1 text-sm font-semibold text-foreground">{i.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{i.summary}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
