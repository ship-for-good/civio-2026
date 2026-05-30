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
import { POPULAR_TOPICS } from "@/data/popular-topics";
import { cn } from "@/lib/utils";

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
    () => [...POPULAR_TOPICS].sort((a, b) => b.views - a.views).slice(0, 6),
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
          Dades i enllaços del{" "}
          <a
            href="https://ajuntament.barcelona.cat/transparencia/ca"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline underline-offset-2 hover:text-accent"
          >
            portal de Transparència de Barcelona
          </a>
          {" "}
          (maig 2026)
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

            {/* Summary from official transparency sources */}
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-foreground">Resum del tema</h3>
                <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                  <Sparkles className="h-3 w-3" /> Font oficial
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
