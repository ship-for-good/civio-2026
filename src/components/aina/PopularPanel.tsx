import { useMemo, useState } from "react";
import {
  Crown,
  Medal,
  Award,
  TrendingUp,
  Eye,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  Hash,
} from "lucide-react";
import contracts from "@/assets/topic-contracts.jpg";
import budgets from "@/assets/topic-budgets.jpg";
import grants from "@/assets/topic-grants.jpg";
import mobility from "@/assets/topic-mobility.jpg";
import { cn } from "@/lib/utils";

type Article = { title: string; source: string; url: string };
type Topic = {
  id: string;
  title: string;
  desc: string;
  tags: string[];
  img: string;
  views: number;        // weekly consultations
  trend: number;        // % vs last week
  reason: string;       // why it's ranked here
  summary: string[];    // MCP-generated bullets
  articles: Article[];
};

// Mock dataset — ranked by `views` (descending).
const TOPICS: Topic[] = [
  {
    id: "contractacio",
    title: "Contractació pública",
    desc: "Qui guanya les licitacions i amb quins criteris.",
    tags: ["Contractes", "Licitacions"],
    img: contracts,
    views: 12840,
    trend: 38,
    reason: "Pic de consultes després de l'adjudicació de l'AVE i obres metropolitanes.",
    summary: [
      "La Generalitat ha adjudicat 312 contractes nous aquesta setmana, un 18% més que la mitjana mensual.",
      "El 64% del volum econòmic es concentra en obres d'infraestructura ferroviària i sanitàries.",
      "Tres empreses constructores acumulen el 41% de l'import total adjudicat.",
    ],
    articles: [
      { title: "Adjudicada la nova fase de l'AVE per 480 M€", source: "DOGC", url: "#" },
      { title: "Llistat de licitacions setmanals · gener", source: "Plataforma de Contractació", url: "#" },
      { title: "Anàlisi: concentració d'adjudicacions", source: "El Crític", url: "#" },
    ],
  },
  {
    id: "pressupostos",
    title: "Pressupostos",
    desc: "On va cada euro del pressupost municipal i autonòmic.",
    tags: ["Pressupost", "Despesa"],
    img: budgets,
    views: 9620,
    trend: 22,
    reason: "Debat parlamentari sobre els pressupostos 2026 en curs.",
    summary: [
      "El projecte de pressupostos 2026 incrementa un 6,4% la despesa social respecte al 2025.",
      "Sanitat i Educació concentren el 58% del total, amb una pujada conjunta de 1.300 M€.",
      "Inversió en habitatge multiplica per 2,1 la dotació de l'exercici anterior.",
    ],
    articles: [
      { title: "El Govern presenta el projecte de pressupostos 2026", source: "Govern.cat", url: "#" },
      { title: "Comparativa partides 2025–2026", source: "Idescat", url: "#" },
    ],
  },
  {
    id: "subvencions",
    title: "Subvencions",
    desc: "Ajudes públiques concedides a entitats i empreses.",
    tags: ["Subvencions", "Ajudes"],
    img: grants,
    views: 7110,
    trend: 12,
    reason: "Publicació del padró d'ajudes culturals i tecnològiques de 2026.",
    summary: [
      "S'han publicat 47 noves convocatòries d'ajudes amb un import global de 92 M€.",
      "El sector cultural rep la dotació més gran (28 M€), seguit per energia neta (19 M€).",
      "Termini mitjà per sol·licitar: 31 dies. Hi ha 4 convocatòries que tanquen aquesta setmana.",
    ],
    articles: [
      { title: "Convocatòries obertes a empreses i entitats", source: "DOGC", url: "#" },
      { title: "Mapa de subvencions culturals", source: "CoNCA", url: "#" },
    ],
  },
  {
    id: "mobilitat",
    title: "Mobilitat",
    desc: "Inversions en transport públic i carrils bici.",
    tags: ["Mobilitat", "Transport"],
    img: mobility,
    views: 5430,
    trend: -4,
    reason: "Estabilitat respecte la setmana anterior — sense grans anuncis nous.",
    summary: [
      "TMB inverteix 88 M€ en renovació de la flota d'autobusos elèctrics fins 2027.",
      "Es projecten 64 km de nous carrils bici a l'AMB en els pròxims 18 mesos.",
      "Rodalies registra el millor índex de puntualitat dels últims 4 trimestres (87%).",
    ],
    articles: [
      { title: "Pla de renovació de flota TMB", source: "TMB", url: "#" },
      { title: "Carrils bici metropolitans · estat d'execució", source: "AMB", url: "#" },
    ],
  },
  {
    id: "medi-ambient",
    title: "Medi ambient",
    desc: "Polítiques de sostenibilitat i qualitat de l'aire.",
    tags: ["Clima", "Sostenibilitat"],
    img: budgets,
    views: 3980,
    trend: 9,
    reason: "Episodis de contaminació activen consultes sobre la ZBE i mesures correctores.",
    summary: [
      "Els nivells de NO₂ superen el llindar OMS en 7 estacions de l'AMB durant 3 dies.",
      "La ZBE Rondes ha reduït un 14% les emissions de partícules des de la seva ampliació.",
      "Pla de transició energètica preveu 600 MW addicionals de solar fotovoltaica el 2026.",
    ],
    articles: [
      { title: "Informe setmanal de qualitat de l'aire", source: "Generalitat", url: "#" },
      { title: "ZBE: balanç i pròxims passos", source: "AMB", url: "#" },
    ],
  },
  {
    id: "habitatge",
    title: "Habitatge",
    desc: "Lloguers, promocions públiques i ajudes a joves.",
    tags: ["Habitatge", "Lloguer"],
    img: contracts,
    views: 2870,
    trend: 17,
    reason: "Nova línia d'ajudes a joves de fins a 35 anys publicada divendres.",
    summary: [
      "L'INCASOL licita 1.240 noves vivendes de lloguer social a 18 municipis.",
      "Bo lloguer jove: import màxim de 250 €/mes durant 24 mesos.",
      "Preu mitjà del lloguer a Barcelona: 1.180 €/mes, +3,2% interanual.",
    ],
    articles: [
      { title: "Convocatòria bo lloguer jove 2026", source: "Agència Habitatge", url: "#" },
      { title: "Promocions INCASOL en marxa", source: "INCASOL", url: "#" },
    ],
  },
];

const RANK_STYLES = [
  { Icon: Crown, ring: "ring-amber-400/60", chip: "bg-gradient-to-br from-amber-400 to-amber-600 text-white", label: "Or" },
  { Icon: Medal, ring: "ring-slate-400/60", chip: "bg-gradient-to-br from-slate-300 to-slate-500 text-white", label: "Argent" },
  { Icon: Award, ring: "ring-orange-500/60", chip: "bg-gradient-to-br from-orange-400 to-orange-700 text-white", label: "Bronze" },
] as const;

function formatViews(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

export function PopularPanel() {
  const ranked = useMemo(
    () => [...TOPICS].sort((a, b) => b.views - a.views).slice(0, 6),
    [],
  );
  const [selectedId, setSelectedId] = useState<string>(ranked[0].id);
  const selected = ranked.find((t) => t.id === selectedId) ?? ranked[0];
  const maxViews = ranked[0].views;

  return (
    <div>
      {/* MCP attribution banner */}
      <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent">
        <ShieldCheck className="h-3.5 w-3.5" />
        <span>
          Resums generats amb <strong className="font-semibold">MCP</strong> · fonts oficials verificades
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(280px,360px)_1fr]">
        {/* LEFT — fixed-rank list */}
        <ol className="flex flex-col gap-2" aria-label="Rànquing de temes">
          {ranked.map((t, idx) => {
            const rank = idx + 1;
            const rankStyle = RANK_STYLES[idx];
            const isActive = t.id === selectedId;
            const widthPct = Math.max(8, Math.round((t.views / maxViews) * 100));
            return (
              <li key={t.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  aria-pressed={isActive}
                  className={cn(
                    "group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border bg-card/60 px-3 py-3 text-left backdrop-blur-xl transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    isActive
                      ? "border-accent/60 bg-card shadow-glow ring-1 ring-accent/30"
                      : "border-border/60 hover:-translate-y-0.5 hover:border-accent/40 hover:bg-card/85",
                  )}
                >
                  {/* Rank badge */}
                  <div className="relative shrink-0">
                    {rankStyle ? (
                      <span
                        className={cn(
                          "flex h-11 w-11 items-center justify-center rounded-xl text-base font-black shadow-md ring-2",
                          rankStyle.chip,
                          rankStyle.ring,
                        )}
                        aria-label={`Posició ${rank}`}
                      >
                        <rankStyle.Icon className="h-5 w-5" />
                      </span>
                    ) : (
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-muted text-sm font-bold text-muted-foreground ring-1 ring-border">
                        #{rank}
                      </span>
                    )}
                    <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-card bg-foreground text-[10px] font-black text-background">
                      {rank}
                    </span>
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate text-sm font-semibold text-foreground">{t.title}</h3>
                      <span
                        className={cn(
                          "inline-flex items-center gap-0.5 text-[11px] font-semibold tabular-nums",
                          t.trend >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
                        )}
                      >
                        <TrendingUp className={cn("h-3 w-3", t.trend < 0 && "rotate-180")} />
                        {t.trend > 0 ? "+" : ""}
                        {t.trend}%
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Eye className="h-3 w-3" />
                      <span className="tabular-nums font-medium text-foreground/80">{formatViews(t.views)}</span>
                      <span>consultes</span>
                    </div>
                    {/* Popularity bar */}
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          isActive ? "bg-gradient-to-r from-accent to-primary" : "bg-primary/60 group-hover:bg-primary",
                        )}
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ol>

        {/* RIGHT — selected topic detail */}
        <article
          key={selected.id}
          className="animate-fade-in-up overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-soft backdrop-blur-xl"
        >
          {/* Hero */}
          <div className="relative aspect-[16/7] overflow-hidden bg-muted sm:aspect-[16/6]">
            <img
              src={selected.img}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
            <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-white/30 bg-black/40 px-2.5 py-1 text-xs font-bold text-white backdrop-blur">
              <Hash className="h-3 w-3" />
              {ranked.findIndex((t) => t.id === selected.id) + 1} més consultat
            </div>
            <div className="absolute bottom-4 left-4 right-4">
              <div className="flex flex-wrap items-center gap-1.5">
                {selected.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-primary-soft/90 px-2.5 py-0.5 text-xs font-medium text-primary backdrop-blur"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {selected.title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{selected.desc}</p>
            </div>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            {/* Stat strip */}
            <div className="grid grid-cols-3 gap-3">
              <Stat
                label="Consultes setmana"
                value={formatViews(selected.views)}
                icon={<Eye className="h-4 w-4" />}
              />
              <Stat
                label="Tendència"
                value={`${selected.trend > 0 ? "+" : ""}${selected.trend}%`}
                icon={<TrendingUp className="h-4 w-4" />}
                tone={selected.trend >= 0 ? "positive" : "negative"}
              />
              <Stat
                label="Articles indexats"
                value={String(selected.articles.length)}
                icon={<ExternalLink className="h-4 w-4" />}
              />
            </div>

            {/* Why it's ranked here */}
            <div className="rounded-xl border border-primary/25 bg-primary/5 p-4">
              <div className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-primary">
                <TrendingUp className="h-3.5 w-3.5" /> Per què està en aquesta posició
              </div>
              <p className="text-sm text-foreground/90">{selected.reason}</p>
            </div>

            {/* MCP-generated summary */}
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">Resum del tema</h3>
                <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                  <Sparkles className="h-3 w-3" /> Generat amb MCP
                </span>
              </div>
              <ul className="space-y-2">
                {selected.summary.map((line, i) => (
                  <li key={i} className="flex gap-3 rounded-lg bg-muted/50 p-3 text-sm text-foreground/90">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-accent/15 text-[11px] font-bold text-accent">
                      {i + 1}
                    </span>
                    <span className="leading-snug">{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Source articles */}
            <div>
              <h3 className="mb-2 text-sm font-semibold text-foreground">
                Articles font ({selected.articles.length})
              </h3>
              <ul className="divide-y divide-border/60 overflow-hidden rounded-xl border border-border/60">
                {selected.articles.map((a) => (
                  <li key={a.title}>
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 bg-background/40 px-3 py-2.5 text-sm transition-colors hover:bg-accent/5"
                    >
                      <span className="flex-1">
                        <span className="block font-medium text-foreground group-hover:text-accent">
                          {a.title}
                        </span>
                        <span className="text-xs text-muted-foreground">{a.source}</span>
                      </span>
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </article>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  tone?: "neutral" | "positive" | "negative";
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background/40 p-3 text-center">
      <div
        className={cn(
          "mx-auto mb-1 inline-flex h-7 w-7 items-center justify-center rounded-lg",
          tone === "positive" && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
          tone === "negative" && "bg-rose-500/15 text-rose-600 dark:text-rose-400",
          tone === "neutral" && "bg-primary/10 text-primary",
        )}
      >
        {icon}
      </div>
      <div className="text-lg font-bold tabular-nums text-foreground">{value}</div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
    </div>
  );
}
