import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Building2, CalendarRange, ChevronDown, ExternalLink, FileText, MapPin, Search, Tag, Wallet, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  VERIFIED_BARCELONA_TENDERS,
  type BarcelonaTender,
  type TenderStatus,
} from "@/data/barcelona-tenders-verified";

// ---------- Data (licitacions reals, portal Ajuntament de Barcelona) ----------

type Status = TenderStatus;
type Tender = Omit<BarcelonaTender, "portalId">;

const TENDERS: Tender[] = VERIFIED_BARCELONA_TENDERS.map(
  ({ portalId: _portalId, ...t }) => t,
);

const STATUS_STYLES: Record<Status, string> = {
  "En curs": "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  "Adjudicada": "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "Publicat": "bg-slate-100 text-slate-700 dark:bg-slate-500/15 dark:text-slate-300",
  "Licitació": "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "Planificada": "bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
};

const STATUS_COLORS: Record<Status, string> = {
  "En curs": "#3b82f6",
  "Adjudicada": "#10b981",
  "Publicat": "#6b7280",
  "Licitació": "#f59e0b",
  "Planificada": "#8b5cf6",
};

// Lifecycle stages used for the progress / stepper visualization.
const LIFECYCLE = ["Publicada", "Oberta", "En avaluació", "Adjudicada", "Finalitzada"] as const;
type Stage = typeof LIFECYCLE[number];

const STATUS_TO_STAGE: Record<Status, Stage> = {
  "Planificada": "Publicada",
  "Publicat": "Publicada",
  "Licitació": "Oberta",
  "En curs": "En avaluació",
  "Adjudicada": "Adjudicada",
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "Obra pública": "Procés destinat a l'execució d'obres i infraestructures públiques al servei de la ciutadania.",
  "Subvenció": "Ajut econòmic atorgat per l'administració per donar suport a entitats, projectes o activitats d'interès públic.",
  "Anunci": "Publicació oficial d'un procediment administratiu obert a la consulta pública.",
  "Contractació": "Procediment per a la contractació de serveis, subministraments o obres per part d'una entitat pública.",
};

// ---------- Helpers ----------

const uniq = <T,>(arr: T[]) => Array.from(new Set(arr));
const fmtEur = (n: number) =>
  new Intl.NumberFormat("ca-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("ca-ES", { day: "2-digit", month: "2-digit", year: "numeric" });

type SortKey = "budget" | "startDate" | "status" | "municipality";
type SortDir = "asc" | "desc";

// ---------- Component ----------

export function NearbyPanel() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [municipality, setMunicipality] = useState<string>("all");
  const [contractType, setContractType] = useState<string>("all");
  const [procedureType, setProcedureType] = useState<string>("all");
  const [organizer, setOrganizer] = useState<string>("all");
  const [category, setCategory] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("startDate");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const rowRefs = useRef<Map<string, HTMLTableRowElement>>(new Map());

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const fromTs = dateFrom ? new Date(dateFrom).getTime() : null;
    const toTs = dateTo ? new Date(dateTo).getTime() : null;
    const min = budgetMin ? Number(budgetMin) : null;
    const max = budgetMax ? Number(budgetMax) : null;

    const out = TENDERS.filter((t) => {
      if (q) {
        const hay = `${t.title} ${t.licitacioId} ${t.municipality} ${t.organizer}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (status !== "all" && t.status !== status) return false;
      if (municipality !== "all" && t.municipality !== municipality) return false;
      if (contractType !== "all" && t.contractType !== contractType) return false;
      if (procedureType !== "all" && t.procedureType !== procedureType) return false;
      if (organizer !== "all" && t.organizer !== organizer) return false;
      if (category !== "all" && t.category !== category) return false;
      const startTs = new Date(t.startDate).getTime();
      if (fromTs !== null && startTs < fromTs) return false;
      if (toTs !== null && startTs > toTs) return false;
      if (min !== null && t.budget < min) return false;
      if (max !== null && t.budget > max) return false;
      return true;
    });

    out.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "budget") return (a.budget - b.budget) * dir;
      if (sortKey === "startDate")
        return (new Date(a.startDate).getTime() - new Date(b.startDate).getTime()) * dir;
      if (sortKey === "status") return a.status.localeCompare(b.status) * dir;
      return a.municipality.localeCompare(b.municipality) * dir;
    });
    return out;
  }, [
    search, status, municipality, contractType, procedureType, organizer, category,
    dateFrom, dateTo, budgetMin, budgetMax, sortKey, sortDir,
  ]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const handleSelect = (id: string, opts?: { fromMap?: boolean; toggle?: boolean }) => {
    if (opts?.toggle && expandedId === id) {
      setExpandedId(null);
      return;
    }
    setSelectedId(id);
    setExpandedId(id);
    requestAnimationFrame(() => {
      const el = rowRefs.current.get(id);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const focusOnMap = (id: string) => {
    setSelectedId(id);
    setExpandedId(id);
    mapContainerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const resetFilters = () => {
    setSearch(""); setStatus("all"); setMunicipality("all"); setContractType("all");
    setProcedureType("all"); setOrganizer("all"); setCategory("all");
    setDateFrom(""); setDateTo(""); setBudgetMin(""); setBudgetMax("");
  };

  const municipalities = useMemo(() => uniq(TENDERS.map((t) => t.municipality)).sort(), []);
  const contractTypes = useMemo(() => uniq(TENDERS.map((t) => t.contractType)).sort(), []);
  const procedureTypes = useMemo(() => uniq(TENDERS.map((t) => t.procedureType)).sort(), []);
  const organizers = useMemo(() => uniq(TENDERS.map((t) => t.organizer)).sort(), []);
  const categories = useMemo(() => uniq(TENDERS.map((t) => t.category)).sort(), []);
  const statuses: Status[] = ["En curs", "Adjudicada", "Publicat", "Licitació", "Planificada"];

  return (
    <div className="flex w-full max-w-full min-w-0 flex-col gap-6">
      {/* Filters */}
      <Filters
        search={search} setSearch={setSearch}
        status={status} setStatus={setStatus}
        municipality={municipality} setMunicipality={setMunicipality}
        contractType={contractType} setContractType={setContractType}
        procedureType={procedureType} setProcedureType={setProcedureType}
        organizer={organizer} setOrganizer={setOrganizer}
        category={category} setCategory={setCategory}
        dateFrom={dateFrom} setDateFrom={setDateFrom}
        dateTo={dateTo} setDateTo={setDateTo}
        budgetMin={budgetMin} setBudgetMin={setBudgetMin}
        budgetMax={budgetMax} setBudgetMax={setBudgetMax}
        municipalities={municipalities}
        contractTypes={contractTypes}
        procedureTypes={procedureTypes}
        organizers={organizers}
        categories={categories}
        statuses={statuses}
        resetFilters={resetFilters}
        count={filtered.length}
        total={TENDERS.length}
      />

      {/* Map */}
      <div ref={mapContainerRef} className="overflow-hidden rounded-2xl border border-border shadow-soft h-[60dvh] min-h-[420px]">
        <TenderMap
          tenders={filtered}
          selectedId={selectedId}
          onSelect={(id) => handleSelect(id, { fromMap: true })}
        />
      </div>

      {/* Table */}
      <div className="flex flex-col gap-4 min-w-0">


        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div className="max-h-[70dvh] overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 z-10 bg-muted/80 text-xs uppercase tracking-wide text-muted-foreground backdrop-blur">
                <tr>
                  <th className="px-3 py-3 font-medium">Títol</th>
                  <th className="px-3 py-3 font-medium">ID</th>
                  <SortableTh label="Municipi" active={sortKey === "municipality"} dir={sortDir} onClick={() => toggleSort("municipality")} />
                  <th className="px-3 py-3 font-medium">Organitzador</th>
                  <SortableTh label="Import" active={sortKey === "budget"} dir={sortDir} onClick={() => toggleSort("budget")} align="right" />
                  <SortableTh label="Estat" active={sortKey === "status"} dir={sortDir} onClick={() => toggleSort("status")} />
                  <SortableTh label="Inici" active={sortKey === "startDate"} dir={sortDir} onClick={() => toggleSort("startDate")} />
                  <th className="px-3 py-3 font-medium">Fi</th>
                  <th className="w-8 px-2 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground">
                      No s'han trobat resultats amb els filtres actuals.
                    </td>
                  </tr>
                )}
                {filtered.map((t) => {
                  const isSelected = selectedId === t.id;
                  const isExpanded = expandedId === t.id;
                  return (
                    <Fragment key={t.id}>
                      <tr
                        ref={(el) => {
                          if (el) rowRefs.current.set(t.id, el);
                          else rowRefs.current.delete(t.id);
                        }}
                        onClick={() => handleSelect(t.id, { toggle: true })}
                        className={cn(
                          "cursor-pointer transition-colors hover:bg-muted/40",
                          isSelected && "bg-primary-soft/60 hover:bg-primary-soft/60",
                        )}
                      >
                        <td className="px-3 py-3 font-medium text-foreground">{t.title}</td>
                        <td className="px-3 py-3 font-mono text-xs text-muted-foreground">{t.licitacioId}</td>
                        <td className="px-3 py-3 text-muted-foreground">{t.municipality}</td>
                        <td className="px-3 py-3 text-muted-foreground">{t.organizer}</td>
                        <td className="px-3 py-3 text-right tabular-nums text-foreground">{fmtEur(t.budget)}</td>
                        <td className="px-3 py-3">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[t.status]}`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {t.status}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-muted-foreground">{fmtDate(t.startDate)}</td>
                        <td className="px-3 py-3 text-muted-foreground">{fmtDate(t.endDate)}</td>
                        <td className="px-2 py-3 text-muted-foreground">
                          <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-180")} />
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-muted/20">
                          <td colSpan={9} className="px-3 py-4 sm:px-5">
                            <DetailCard
                              tender={t}
                              activeContractType={contractType}
                              onFilterContractType={(v) =>
                                setContractType((cur) => (cur === v ? "all" : v))
                              }
                              onShowOnMap={() => focusOnMap(t.id)}
                              maxBudget={Math.max(...TENDERS.map((x) => x.budget))}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Subcomponents ----------

function SortableTh({
  label, active, dir, onClick, align,
}: { label: string; active: boolean; dir: SortDir; onClick: () => void; align?: "right" }) {
  const Icon = active ? (dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <th className="px-3 py-3 font-medium">
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1 transition-colors hover:text-foreground",
          active && "text-foreground",
          align === "right" && "ml-auto",
        )}
      >
        {label}
        <Icon className="h-3 w-3" />
      </button>
    </th>
  );
}

function DetailCard({
  tender,
  activeContractType,
  onFilterContractType,
  onShowOnMap,
  maxBudget,
}: {
  tender: Tender;
  activeContractType: string;
  onFilterContractType: (v: string) => void;
  onShowOnMap: () => void;
  maxBudget: number;
}) {
  const [showFullDesc, setShowFullDesc] = useState(false);
  const description =
    CATEGORY_DESCRIPTIONS[tender.category] ??
    "Procediment públic gestionat per l'administració, amb informació detallada disponible a la font oficial.";
  const fullDesc = `${description} Aquest expedient correspon a «${tender.title}» promogut per ${tender.organizer} al municipi de ${tender.municipality}.`;
  const shortDesc = fullDesc.length > 140 ? fullDesc.slice(0, 140) + "…" : fullDesc;

  const currentStage = STATUS_TO_STAGE[tender.status];
  const stageIndex = LIFECYCLE.indexOf(currentStage);
  const progressPct = ((stageIndex + 1) / LIFECYCLE.length) * 100;
  const budgetPct = Math.min(100, Math.round((tender.budget / maxBudget) * 100));
  const isPillActive = activeContractType === tender.contractType;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-soft sm:p-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold leading-tight text-foreground sm:text-lg">{tender.title}</h3>
          <p className="mt-1 font-mono text-xs text-muted-foreground">{tender.licitacioId}</p>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[tender.status]}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {tender.status}
        </span>
      </div>

      {/* Contract type pills */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">Tipus:</span>
        <button
          type="button"
          aria-pressed={isPillActive}
          onClick={() => onFilterContractType(tender.contractType)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all",
            isPillActive
              ? "border border-accent bg-accent text-white shadow-[inset_0_2px_0_oklch(0_0_0/0.12)]"
              : "border border-primary/30 bg-primary-soft text-primary hover:border-accent hover:shadow-md",
          )}
        >
          <Tag className="h-3 w-3" />
          {tender.contractType}
          {isPillActive && <X className="h-3 w-3 opacity-90" />}
        </button>
        <span className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
          {tender.procedureType}
        </span>
      </div>


      {/* Info grid + budget */}
      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        <div className="space-y-2 lg:col-span-2">
          <InfoRow icon={Building2} label="Organitzador" value={tender.organizer} />
          <InfoRow icon={MapPin} label="Ubicació" value={`${tender.location} · ${tender.municipality}`} />
          <InfoRow icon={CalendarRange} label="Vigència" value={`${fmtDate(tender.startDate)} – ${fmtDate(tender.endDate)}`} />
        </div>

        {/* Budget callout — accent (orange) */}
        <div className="relative overflow-hidden rounded-lg border-2 border-accent/40 bg-accent-soft p-4">
          <div className="absolute -right-4 -top-4 h-16 w-16 rounded-full bg-accent/20 blur-xl" />
          <div className="relative flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-accent-foreground/80">
            <Wallet className="h-3.5 w-3.5 text-accent" />
            Pressupost
          </div>
          <div className="relative mt-1 text-3xl font-extrabold tabular-nums leading-tight text-foreground">
            {fmtEur(tender.budget)}
          </div>
          <div className="relative mt-3 h-2 w-full overflow-hidden rounded-full bg-background/60">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${budgetPct}%` }}
            />
          </div>
          <p className="relative mt-1.5 text-[11px] text-muted-foreground">
            Sense IVA · {budgetPct}% del màxim al llistat
          </p>
        </div>
      </div>

      {/* Progress timeline */}
      <div className="mt-5">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">Estat del procés</span>
          <span className="text-xs font-semibold text-primary">{currentStage}</span>
        </div>
        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-muted">
          {/* completed (orange) */}
          <div
            className="absolute inset-y-0 left-0 bg-accent transition-all"
            style={{ width: `${(stageIndex / (LIFECYCLE.length - 1)) * 100}%` }}
          />
          {/* current marker (blue) */}
          <div
            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-primary shadow-md"
            style={{ left: `${(stageIndex / (LIFECYCLE.length - 1)) * 100}%` }}
          />
        </div>
        <ol className="mt-3 grid grid-cols-5 gap-1 text-[10px] sm:text-xs">
          {LIFECYCLE.map((stage, i) => {
            const completed = i < stageIndex;
            const isCurrent = i === stageIndex;
            return (
              <li key={stage} className="flex flex-col items-center text-center">
                <span
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-semibold transition-colors",
                    completed && "border-accent bg-accent text-white",
                    isCurrent && "border-primary bg-primary text-primary-foreground ring-2 ring-primary/25",
                    !completed && !isCurrent && "border-border bg-muted text-muted-foreground",
                  )}
                >
                  {i + 1}
                </span>
                <span
                  className={cn(
                    "mt-1 leading-tight",
                    isCurrent && "font-semibold text-primary",
                    completed && "text-foreground",
                    !completed && !isCurrent && "text-muted-foreground",
                  )}
                >
                  {stage}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Description */}
      <div className="mt-5 rounded-lg border border-border bg-muted/30 p-3">
        <div className="mb-1 flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
          <FileText className="h-3.5 w-3.5 text-accent" /> Descripció
        </div>
        <p className="text-sm leading-relaxed text-foreground">{showFullDesc ? fullDesc : shortDesc}</p>
        {fullDesc.length > 140 && (
          <button
            type="button"
            onClick={() => setShowFullDesc((v) => !v)}
            className="mt-1 text-xs font-medium text-accent hover:underline"
          >
            {showFullDesc ? "Mostra menys" : "Llegir més"}
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="mt-5 flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onShowOnMap}
          className="border-primary/40 bg-primary-soft text-primary hover:bg-primary hover:text-primary-foreground"
        >
          <MapPin className="h-4 w-4" /> Veure al mapa
        </Button>
        <Button
          asChild
          size="sm"
          className="bg-accent text-white shadow-md hover:bg-accent/90"
        >
          <a href={tender.sourceUrl} target="_blank" rel="noopener noreferrer">
            Veure licitació original <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      </div>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }: { icon: typeof Building2; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-lg bg-muted/30 px-3 py-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="text-sm text-foreground">{value}</div>
      </div>
    </div>
  );
}

type FiltersProps = {
  search: string; setSearch: (v: string) => void;
  status: string; setStatus: (v: string) => void;
  municipality: string; setMunicipality: (v: string) => void;
  contractType: string; setContractType: (v: string) => void;
  procedureType: string; setProcedureType: (v: string) => void;
  organizer: string; setOrganizer: (v: string) => void;
  category: string; setCategory: (v: string) => void;
  dateFrom: string; setDateFrom: (v: string) => void;
  dateTo: string; setDateTo: (v: string) => void;
  budgetMin: string; setBudgetMin: (v: string) => void;
  budgetMax: string; setBudgetMax: (v: string) => void;
  municipalities: string[]; contractTypes: string[]; procedureTypes: string[];
  organizers: string[]; categories: string[]; statuses: Status[];
  resetFilters: () => void;
  count: number; total: number;
};

function Filters(p: FiltersProps) {
  const [collapsed, setCollapsed] = useState(true);

  const activeChips: { label: string; onClear: () => void }[] = [];
  if (p.search) activeChips.push({ label: `Cerca: "${p.search}"`, onClear: () => p.setSearch("") });
  if (p.status !== "all") activeChips.push({ label: `Estat: ${p.status}`, onClear: () => p.setStatus("all") });
  if (p.municipality !== "all") activeChips.push({ label: `Municipi: ${p.municipality}`, onClear: () => p.setMunicipality("all") });
  if (p.category !== "all") activeChips.push({ label: `Categoria: ${p.category}`, onClear: () => p.setCategory("all") });
  if (p.contractType !== "all") activeChips.push({ label: `Contracte: ${p.contractType}`, onClear: () => p.setContractType("all") });
  if (p.procedureType !== "all") activeChips.push({ label: `Procediment: ${p.procedureType}`, onClear: () => p.setProcedureType("all") });
  if (p.organizer !== "all") activeChips.push({ label: `Organitzador: ${p.organizer}`, onClear: () => p.setOrganizer("all") });
  if (p.dateFrom) activeChips.push({ label: `Des de: ${p.dateFrom}`, onClear: () => p.setDateFrom("") });
  if (p.dateTo) activeChips.push({ label: `Fins a: ${p.dateTo}`, onClear: () => p.setDateTo("") });
  if (p.budgetMin) activeChips.push({ label: `Import mín: ${p.budgetMin} €`, onClear: () => p.setBudgetMin("") });
  if (p.budgetMax) activeChips.push({ label: `Import màx: ${p.budgetMax} €`, onClear: () => p.setBudgetMax("") });

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">Filtres</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {activeChips.length} {activeChips.length === 1 ? "actiu" : "actius"}
          </span>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setCollapsed((c) => !c)}>
          <ChevronDown className={cn("mr-1 h-4 w-4 transition-transform", collapsed && "-rotate-90")} />
          {collapsed ? "Mostrar filtres" : "Plegar"}
        </Button>
      </div>

      <div className="relative mt-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={p.search}
          onChange={(e) => p.setSearch(e.target.value)}
          placeholder="Cerca per títol, ID, municipi o organitzador…"
          className="pl-9"
        />
      </div>

      {collapsed ? (
        <div className="mt-3">
          {activeChips.length === 0 ? (
            <p className="text-sm text-muted-foreground"><span className="font-medium text-foreground">{p.count}</span> de {p.total} resultats.</p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {activeChips.filter((c) => !c.label.startsWith("Cerca:")).map((c) => (
                <button
                  key={c.label}
                  onClick={c.onClear}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs text-foreground hover:bg-muted"
                >
                  {c.label}
                  <X className="h-3 w-3 text-muted-foreground" />
                </button>
              ))}
              <Button variant="ghost" size="sm" onClick={p.resetFilters} className="h-7 px-2 text-xs">
                Netejar tot
              </Button>
              <span className="ml-auto text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{p.count}</span> / {p.total}
              </span>
            </div>
          )}
        </div>
      ) : (
        <>

          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <FilterSelect label="Estat" value={p.status} onChange={p.setStatus} options={p.statuses} />
            <FilterSelect label="Municipi" value={p.municipality} onChange={p.setMunicipality} options={p.municipalities} />
            <FilterSelect label="Categoria" value={p.category} onChange={p.setCategory} options={p.categories} />
            <FilterSelect label="Tipus de contracte" value={p.contractType} onChange={p.setContractType} options={p.contractTypes} />
            <FilterSelect label="Tipus de procediment" value={p.procedureType} onChange={p.setProcedureType} options={p.procedureTypes} />
            <FilterSelect label="Organitzador" value={p.organizer} onChange={p.setOrganizer} options={p.organizers} />

            <div>
              <Label className="text-xs text-muted-foreground">Data des de</Label>
              <Input type="date" value={p.dateFrom} onChange={(e) => p.setDateFrom(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Data fins a</Label>
              <Input type="date" value={p.dateTo} onChange={(e) => p.setDateTo(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Import (€)</Label>
              <div className="mt-1 flex gap-2">
                <Input type="number" placeholder="Mín" value={p.budgetMin} onChange={(e) => p.setBudgetMin(e.target.value)} />
                <Input type="number" placeholder="Màx" value={p.budgetMax} onChange={(e) => p.setBudgetMax(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{p.count}</span> de {p.total} resultats
            </p>
            <Button variant="ghost" size="sm" onClick={p.resetFilters}>
              <X className="mr-1 h-4 w-4" /> Netejar filtres
            </Button>
          </div>
        </>
      )}
    </div>
  );
}


function FilterSelect({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="mt-1">
          <SelectValue placeholder="Tots" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tots</SelectItem>
          {options.map((o) => (
            <SelectItem key={o} value={o}>{o}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ---------- Map (client-only) ----------

type MapProps = { tenders: Tender[]; selectedId: string | null; onSelect: (id: string) => void };

function TenderMap(props: MapProps) {
  const [mounted, setMounted] = useState(false);
  const [Comp, setComp] = useState<React.ComponentType<MapProps> | null>(null);

  useEffect(() => {
    setMounted(true);
    import("./TenderMapClient").then((m) => setComp(() => m.default));
  }, []);

  if (!mounted || !Comp) {
    return (
      <div className="flex h-72 w-full items-center justify-center bg-muted text-sm text-muted-foreground lg:h-full">
        Carregant mapa…
      </div>
    );
  }
  return <Comp {...props} />;
}

export { STATUS_COLORS };
