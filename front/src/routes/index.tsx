import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  Search,
  Send,
  Info,
  HelpCircle,
  FileText,
  Building2,
  Users,
  UserCircle2,
  PieChart,
  FileSignature,
  Lightbulb,
  ChevronRight,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Lock,
} from "lucide-react";

import { askChat } from "@/lib/api/chat";
import type { ChatResponse } from "@/lib/types/chat";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Transparencia Navigator — De la pregunta a la información pública" },
      {
        name: "description",
        content:
          "Asistente de Civio para encontrar información del Portal de Transparencia de España en lenguaje natural.",
      },
      { property: "og:title", content: "Transparencia Navigator — Civio" },
      { property: "og:description", content: "De la pregunta a la información pública." },
    ],
  }),
  component: Index,
});

const faqs = [
  { icon: Building2, text: "¿Cuánto costó una obra pública?" },
  { icon: Users, text: "¿Qué subvenciones recibió una organización?" },
  { icon: UserCircle2, text: "¿Cuánto cobra un alto cargo?" },
  { icon: PieChart, text: "¿Dónde se gasta el dinero público?" },
  { icon: FileSignature, text: "¿Qué contratos tiene este organismo?" },
  { icon: Info, text: "¿Cómo solicitar información que no está publicada?" },
];

const navItems = [
  { icon: Info, label: "Sobre el proyecto" },
  { icon: HelpCircle, label: "Cómo funciona" },
  { icon: FileText, label: "Derecho de acceso" },
];

const loadingSteps = [
  "Estamos buscando información pública relacionada con tu consulta...",
  "Interpretando la consulta...",
  "Consultando fuentes oficiales...",
];

const derechoAccesoURL = "https://transparencia.gob.es/derecho-acceso/solicite-informacion-publica";

const pageTypeLabels: Record<string, string> = {
  navigation: "Índice de secciones",
  leaf_static: "Contenido estático",
  leaf_dynamic: "Contenido dinámico",
  buscador_entry: "Buscador oficial",
  external: "Fuente externa",
};

function CivioLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`font-extrabold tracking-tight text-civio-blue text-2xl ${className}`}>
      CIVIO
      <span className="text-civio-green">:</span>
    </span>
  );
}

function renderInlineMarkdown(text: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

function AssistantMessage({ message }: { message: string }) {
  const paragraphs = message
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <div className="space-y-3">
      {paragraphs.map((paragraph, index) => (
        <p key={`${paragraph}-${index}`} className="text-sm text-muted-foreground leading-relaxed">
          {renderInlineMarkdown(paragraph)}
        </p>
      ))}
    </div>
  );
}

function ResultsView({
  query,
  response,
  error,
  onReset,
}: {
  query: string;
  response: ChatResponse | null;
  error: string;
  onReset: () => void;
}) {
  const matchedNode = response?.matched_node;
  const sourceUrl = response?.url || derechoAccesoURL;
  const sourceTitle =
    matchedNode?.title ||
    (response?.found
      ? "Fuente oficial relacionada"
      : "Procedimiento de solicitud de información pública");
  const sourceDescription =
    matchedNode?.description ||
    response?.hint ||
    "Si la información no aparece publicada, puedes solicitarla formalmente mediante el Derecho de Acceso.";
  const pageType = matchedNode?.page_type
    ? (pageTypeLabels[matchedNode.page_type] ?? matchedNode.page_type)
    : "Fuente oficial";
  const path = response?.path ?? [];

  return (
    <section className="mx-auto max-w-7xl px-6 pb-20 animate-fade-in">
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onReset();
        }}
        className="mb-6 inline-flex items-center gap-1.5 text-base font-medium text-civio-blue hover:underline transition-all"
      >
        ← Volver al inicio
      </a>

      {/* Interpretation */}
      <div className="mb-8">
        <p className="text-sm text-muted-foreground inline-flex items-center gap-2">
          <Sparkles className="h-3.5 w-3.5 text-civio-yellow" />
          Consulta enviada al asistente
        </p>
        <h2 className="mt-2 text-2xl md:text-3xl font-bold text-civio-blue leading-tight tracking-tight">
          {query}
        </h2>
        <p
          className={`mt-3 inline-flex items-center gap-2 text-sm font-medium ${error ? "text-destructive" : "text-civio-blue"}`}
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-civio-green-soft">
            <CheckCircle2 className="h-3.5 w-3.5 text-civio-green" />
          </span>
          {error
            ? "No pudimos conectar con el asistente en este momento."
            : response?.found
              ? "Encontramos una fuente oficial relacionada con tu consulta."
              : "No encontramos una publicación directa; te indicamos cómo continuar."}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Main column */}
        <div>
          <h3 className="text-lg font-semibold text-civio-blue">Cómo obtener esta información</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Resultado generado a partir del grafo del Portal de Transparencia.
          </p>

          <div
            className={`mt-5 rounded-xl border p-5 ${error ? "border-destructive/30 bg-destructive/5" : "border-civio-green/30 bg-civio-green-soft/50"}`}
          >
            <div className="flex items-center gap-2 text-civio-blue font-semibold">
              <Lightbulb className="h-4 w-4 text-civio-green" />
              Respuesta del asistente
            </div>
            {error ? (
              <p className="mt-2 text-sm text-muted-foreground">{error}</p>
            ) : response?.message ? (
              <div className="mt-2">
                <AssistantMessage message={response.message} />
              </div>
            ) : null}
            {!error && response?.hint ? (
              <p className="mt-3 rounded-lg bg-white/70 p-3 text-sm text-muted-foreground">
                {response.hint}
              </p>
            ) : null}
          </div>

          {/* Sources */}
          <div className="mt-5 space-y-4">
            <article className="rounded-xl border border-border bg-card p-5 transition-all hover:border-civio-blue/30 hover:shadow-sm">
              <h4 className="text-base font-semibold text-civio-blue">{sourceTitle}</h4>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                {sourceDescription}
              </p>
              <div className="mt-4 flex items-center justify-between flex-wrap gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-civio-green-soft px-2 py-1 text-[11px] font-medium text-civio-blue">
                  <span className="h-1.5 w-1.5 rounded-full bg-civio-green" />
                  {pageType}
                </span>
                <a
                  href={sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-civio-blue/20 px-3 py-1.5 text-sm font-medium text-civio-blue hover:bg-civio-blue hover:text-primary-foreground transition-colors"
                >
                  Ir a la fuente
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </article>
          </div>
        </div>

        {/* Sidebar — Path and future related searches */}
        <aside>
          <h3 className="text-base font-semibold text-civio-blue">Contexto en el portal</h3>
          <div className="mt-4 space-y-3">
            {path.length > 0 ? (
              path.map((step, index) => (
                <article
                  key={`${step.url}-${index}`}
                  className="rounded-xl border border-border bg-card p-4 transition-all hover:border-civio-blue/30 hover:shadow-sm"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Nivel {index + 1}
                  </span>
                  <h4 className="mt-1 text-sm font-semibold text-civio-blue leading-snug">
                    {step.title}
                  </h4>
                  <a
                    href={step.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-civio-blue hover:underline"
                  >
                    Abrir en el portal
                    <ArrowRight className="h-3 w-3" />
                  </a>
                </article>
              ))
            ) : (
              <article className="rounded-xl border border-border bg-card p-4">
                <h4 className="text-sm font-semibold text-civio-blue leading-snug">
                  Consultas relacionadas
                </h4>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  En este MVP mostramos el resultado principal del backend. La proximidad entre
                  nodos queda preparada como siguiente iteración.
                </p>
              </article>
            )}
          </div>
        </aside>
      </div>

      {/* CTA banner */}
      <div className="mt-10 rounded-2xl border border-civio-yellow/40 bg-civio-yellow-soft/60 p-6 flex flex-col md:flex-row items-start md:items-center gap-5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-civio-yellow">
          <FileText className="h-5 w-5 text-civio-blue" />
        </span>
        <div className="flex-1">
          <h4 className="text-base font-semibold text-civio-blue">¿No aparece la información?</h4>
          <p className="mt-1 text-sm text-muted-foreground">
            Si la información no está publicada, puedes solicitarla formalmente mediante el Derecho
            de Acceso.
          </p>
        </div>
        <a
          href={derechoAccesoURL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-civio-yellow px-5 py-3 text-sm font-semibold text-civio-blue hover:brightness-95 transition"
        >
          Solicitar información pública
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>

      {/* Footer actions */}
      <div className="mt-10 flex flex-col items-center gap-3 text-sm">
        <div className="flex items-center gap-3 text-civio-blue">
          <span className="text-muted-foreground">¿Quieres realizar otra consulta?</span>
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 font-medium hover:border-civio-blue/30 transition"
          >
            Buscar de nuevo
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Lock className="h-3 w-3" />
          Las respuestas se generan con información de fuentes oficiales. Verifica siempre en los
          portales originales.
        </p>
        <span className="sr-only">Consulta: {query}</span>
      </div>
    </section>
  );
}

function Index() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [chatResponse, setChatResponse] = useState<ChatResponse | null>(null);
  const [searchError, setSearchError] = useState("");
  const [stepIndex, setStepIndex] = useState(0);
  const timeouts = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];

    if (!isSearching) {
      return;
    }

    setStepIndex(0);
    timeouts.current.push(setTimeout(() => setStepIndex(1), 700));
    timeouts.current.push(setTimeout(() => setStepIndex(2), 1400));

    return () => {
      timeouts.current.forEach(clearTimeout);
      timeouts.current = [];
    };
  }, [isSearching]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isSearching) return;

    const trimmedQuery = query.trim();
    setHasResults(false);
    setChatResponse(null);
    setSearchError("");
    setSubmittedQuery(trimmedQuery);
    setIsSearching(true);

    try {
      const response = await askChat(trimmedQuery);
      setChatResponse(response);
    } catch (error) {
      setSearchError(
        error instanceof Error ? error.message : "No pudimos consultar el backend del asistente.",
      );
    } finally {
      setIsSearching(false);
      setHasResults(true);
      setQuery("");
    }
  };

  const resetSearch = () => {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
    setIsSearching(false);
    setHasResults(false);
    setQuery("");
    setSubmittedQuery("");
    setChatResponse(null);
    setSearchError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const collapsed = isSearching || hasResults;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
      {/* Header */}
      <header className="border-b border-border/60 bg-background">
        <div className="mx-auto max-w-7xl px-6 py-5 flex items-center gap-6">
          <div className="flex items-center gap-4">
            <a
              href="https://civio.es/"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer hover:opacity-80 transition-opacity"
            >
              <CivioLogo />
            </a>
            <div className="h-10 w-px bg-border" />
            <div className="leading-tight">
              <div className="flex items-center gap-2">
                <button
                  onClick={resetSearch}
                  className="font-semibold text-civio-blue cursor-pointer hover:opacity-80 transition-opacity"
                >
                  Tu derecho a saber
                </button>
                <span className="inline-flex items-center rounded-md bg-civio-green-soft px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-civio-blue">
                  Beta
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                De la pregunta a la información pública
              </p>
            </div>
          </div>

          <nav className="ml-auto hidden lg:flex items-center gap-7 text-sm text-civio-blue">
            {navItems.map(({ icon: Icon, label }) => (
              <a
                key={label}
                href="#"
                className="flex items-center gap-2 hover:text-civio-blue/70 transition-colors"
              >
                <Icon className="h-4 w-4" />
                {label}
              </a>
            ))}
            <a
              href="https://civio.es/socios/?utm_medium=web&utm_source=banner-top"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center rounded-full bg-civio-yellow px-5 py-2.5 text-sm font-bold uppercase tracking-wide text-civio-blue hover:brightness-95 transition"
            >
              ÚNETE
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section
          className={`relative mx-auto max-w-7xl px-6 transition-all duration-700 ease-out ${
            collapsed ? "pt-8 pb-6" : "pt-16 pb-12"
          }`}
        >
          <div className={`mx-auto ${collapsed ? "max-w-7xl" : "max-w-3xl text-center"}`}>
            <div
              className={`grid transition-all duration-700 ease-out ${
                collapsed
                  ? "grid-rows-[0fr] opacity-0 -translate-y-2"
                  : "grid-rows-[1fr] opacity-100 translate-y-0"
              }`}
            >
              <div className="overflow-hidden">
                <h1 className="text-4xl md:text-5xl font-bold text-civio-blue leading-tight tracking-tight">
                  ¿Qué información pública
                  <br />
                  estás buscando?
                </h1>
                <p className="mt-6 text-base md:text-lg text-muted-foreground">
                  Pregúntale a nuestro asistente. Te ayudamos a encontrar
                  <br className="hidden md:block" />
                  la información, entenderla y saber qué hacer si no está publicada.
                </p>
              </div>
            </div>

            {/* Search */}
            <form
              onSubmit={handleSubmit}
              className={`transition-all duration-700 ease-out ${collapsed ? "mt-2" : "mt-8"}`}
            >
              <div className="relative rounded-[20px] border border-border bg-white shadow-sm focus-within:ring-2 focus-within:ring-civio-blue/20 transition">
                <div className="absolute top-4 left-5 text-muted-foreground pointer-events-none">
                  <Search className="h-5 w-5" />
                </div>
                <textarea
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  disabled={isSearching}
                  placeholder={
                    hasResults
                      ? "Haz otra pregunta sobre información pública..."
                      : "Ej. ¿Cuánto costó una obra pública en mi municipio?"
                  }
                  className="w-full h-[150px] resize-none rounded-[20px] bg-transparent px-5 py-4 pl-14 pr-14 pb-5 text-sm md:text-base text-civio-blue placeholder:text-muted-foreground/70 outline-none disabled:opacity-70"
                  aria-label="Pregunta al asistente"
                />
                <button
                  type="submit"
                  disabled={isSearching || !query.trim()}
                  className="absolute top-1/2 right-3 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-civio-blue text-primary-foreground hover:bg-civio-blue/90 transition-colors disabled:opacity-80 disabled:cursor-not-allowed"
                  aria-label="Enviar pregunta"
                >
                  {isSearching ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </button>
              </div>
            </form>

            <div
              className={`grid transition-all duration-500 ease-out ${
                collapsed ? "grid-rows-[0fr] opacity-0" : "grid-rows-[1fr] opacity-100 mt-2"
              }`}
            >
              <div className="overflow-hidden">
                <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <Lightbulb className="h-4 w-4 text-civio-yellow" />
                  También puedes preguntar por subvenciones, contratos, presupuestos, altos cargos o
                  gasto público.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQs / Loading / Results */}
        {!collapsed ? (
          <section className="mx-auto max-w-7xl px-6 pb-20 animate-fade-in">
            <h2 className="text-sm font-semibold text-civio-blue mb-4">Preguntas frecuentes</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {faqs.map(({ icon: Icon, text }) => (
                <button
                  key={text}
                  onClick={() => {
                    setQuery(text);
                  }}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-4 text-left hover:border-civio-blue/30 hover:shadow-sm transition-all"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-civio-green-soft text-civio-green">
                    <Icon className="h-4.5 w-4.5" strokeWidth={2} />
                  </span>
                  <span className="flex-1 text-sm font-medium text-civio-blue leading-snug">
                    {text}
                  </span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-civio-blue transition-colors" />
                </button>
              ))}
            </div>
          </section>
        ) : isSearching ? (
          <section className="mx-auto max-w-3xl px-6 pb-20 animate-fade-in">
            <div className="rounded-2xl border border-border bg-card/60 px-6 py-8">
              <ul className="space-y-4">
                {loadingSteps.map((step, i) => {
                  const state = i < stepIndex ? "done" : i === stepIndex ? "active" : "pending";
                  return (
                    <li
                      key={step}
                      className={`flex items-start gap-3 text-sm transition-all duration-500 ${
                        state === "pending" ? "opacity-40" : "opacity-100"
                      }`}
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                        {state === "done" ? (
                          <CheckCircle2 className="h-5 w-5 text-civio-green" />
                        ) : state === "active" ? (
                          <Loader2 className="h-4 w-4 animate-spin text-civio-blue" />
                        ) : (
                          <span className="h-2 w-2 rounded-full bg-border" />
                        )}
                      </span>
                      <span
                        className={`leading-relaxed ${
                          state === "active"
                            ? "text-civio-blue font-medium"
                            : "text-muted-foreground"
                        }`}
                      >
                        {step}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </section>
        ) : (
          <ResultsView
            query={submittedQuery}
            response={chatResponse}
            error={searchError}
            onReset={resetSearch}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary/40">
        <div className="mx-auto max-w-7xl px-6 py-6 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8">
          <div className="flex items-center gap-4">
            <CivioLogo className="text-xl" />
            <p className="text-xs text-muted-foreground leading-tight">
              Vigilamos al poder,
              <br />
              cuidamos lo público
            </p>
          </div>
          <p className="text-xs text-muted-foreground max-w-xl">
            Con periodismo, herramientas y acción promovemos gobiernos e instituciones más
            transparentes y personas mejor informadas.
          </p>
          <a
            href="https://civio.es"
            target="_blank"
            rel="noreferrer"
            className="md:ml-auto text-xs font-medium text-civio-blue hover:underline inline-flex items-center gap-1"
          >
            Conoce más sobre Civio →
          </a>
        </div>
      </footer>
    </div>
  );
}
