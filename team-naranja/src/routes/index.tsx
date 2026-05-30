import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Search,
  X,
} from "lucide-react";
import type { Message } from "@/components/MessageList";
import { AssistantResponse } from "@/components/AssistantResponse";
import { useAskAssistant } from "@/hooks/useAskAssistant";
import catalog from "@/data/catalog.json";
import type { AskResponse } from "@/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PRISMA · Transparencia Activa" },
      {
        name: "description",
        content:
          "PRISMA es un asistente de navegación del ecosistema de transparencia española. Encuentra dónde se publica cada tipo de información pública.",
      },
      { property: "og:title", content: "PRISMA · Transparencia Activa" },
      {
        property: "og:description",
        content:
          "Asistente inteligente para explorar presupuestos, retribuciones, contratos y agendas del Estado.",
      },
    ],
  }),
  component: Index,
});

const SUGGESTIONS: { label: string; query: string }[] = [
  { label: "Sueldo del Presidente", query: "sueldo del presidente" },
  { label: "Presupuesto Educación 2026", query: "presupuesto educación 2026" },
  { label: "Contratos de obras de un colegio", query: "contratos de obras de un colegio" },
  { label: "Agendas de Ministros", query: "agendas de ministros" },
];


function PrismaLogo({ size = "md" }: { size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-6 w-6" : "h-8 w-8";
  return (
    <div className="relative inline-flex items-center justify-center">
      <span
        className={`absolute inset-0 rounded-full bg-white/30 blur-xl animate-pulse ${dim}`}
        aria-hidden
      />
      <svg
        viewBox="0 0 24 24"
        className={`relative ${dim} text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]`}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      >
        <path d="M12 2L18 12L12 22L6 12Z" />
      </svg>
    </div>
  );
}

function Index() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [lastResponse, setLastResponse] = useState<AskResponse | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const { ask, loading } = useAskAssistant();

  const resultsRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (panelOpen && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [panelOpen]);

  const submitQuery = async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed || loading) return;

    setMessages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), role: "user", content: trimmed },
    ]);
    setInput("");
    setPanelOpen(true);

    const response = await ask(trimmed);
    setLastResponse(response);
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: response.report.summary,
        response,
      },
    ]);
  };

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitQuery(input);
  };

  const closePanel = () => {
    setPanelOpen(false);
    setMessages([]);
    setLastResponse(null);
  };

  const scrollTo = (ref: React.RefObject<HTMLDivElement | null>) => {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const matchedTopic = lastResponse?.matchedTopics[0];

  return (
    <div className="min-h-screen text-white font-sans">
      {/* Header */}
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 pt-10 md:px-12 md:pt-14">
        <div className="flex items-center gap-3">
          <PrismaLogo />
          <div className="flex items-center gap-3">
            <span className="text-xl font-bold tracking-tightest">PRISMA</span>
            <span className="hidden h-5 w-px bg-white/20 md:block" />
            <span className="hidden text-[10px] uppercase tracking-[0.2em] text-white/60 md:block">
              Transparencia Activa
            </span>
          </div>
        </div>
        <nav className="hidden items-center gap-8 md:flex">
          <button
            onClick={() => scrollTo(heroRef)}
            className="text-[11px] font-semibold uppercase tracking-widest text-white/50 transition hover:text-white"
          >
            Portal
          </button>
          <button
            onClick={() => scrollTo(resultsRef)}
            className="text-[11px] font-semibold uppercase tracking-widest text-white/50 transition hover:text-white"
          >
            Consultas IA
          </button>
          <a
            href="https://transparencia.gob.es/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-semibold uppercase tracking-widest text-white/50 transition hover:text-white"
          >
            transparencia.gob.es
          </a>
        </nav>
      </header>

      <main className="mx-auto max-w-7xl px-6 pt-16 pb-24 md:px-12 md:pt-24">
        {/* Hero */}
        <section ref={heroRef} className="mx-auto max-w-3xl text-center">
          <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-white/80">
            Buscador de Información Pública
          </span>
          <h1 className="mt-6 text-4xl font-light leading-none tracking-tightest md:text-6xl">
            Exige tu derecho a: saber, entender y participar.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-sm font-light text-white/70 md:text-base">
            Explora de manera sencilla presupuestos, sueldos públicos, contratos
            estatales y agendas de altos cargos de España a través de nuestre
            asistente inteligente.
          </p>

          {/* Search bar */}
          <form
            onSubmit={handleHeroSubmit}
            className="glass mx-auto mt-10 flex max-w-2xl items-center gap-2 rounded-2xl p-2 shadow-2xl"
          >
            <Search className="ml-3 h-5 w-5 shrink-0 text-white/50" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Busca por 'Sueldo de Ministros', 'Contratos de Fomento', 'Presupuesto Sanidad'..."
              disabled={loading}
              className="flex-1 bg-transparent px-2 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-xl bg-white px-4 py-2.5 text-xs font-semibold text-black transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Buscando..." : "Buscar con IA"}
            </button>
          </form>

          {/* Suggestions */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.2em] text-white/40">
              Sugerencias:
            </span>
            {SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                onClick={() => submitQuery(s.query)}
                disabled={loading}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/80 transition hover:bg-white/10 disabled:opacity-50"
              >
                {s.label}
              </button>
            ))}
          </div>
        </section>


        {/* Results + Copilot */}
        <section
          ref={resultsRef}
          className={`mt-20 transition-all duration-500 ${
            panelOpen
              ? "max-h-none opacity-100"
              : "pointer-events-none max-h-0 overflow-hidden opacity-0"
          }`}
        >
          {panelOpen && (
            <div className="animate-fade-in">
                <div className="glass rounded-3xl p-6 md:p-8">
                  <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-5">
                    <div>
                      {matchedTopic && (
                        <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">
                          {(catalog as { topics: { id: string; category: string }[] }).topics.find(
                            (t) => t.id === matchedTopic.id,
                          )?.category ?? "Resultado"}
                        </span>
                      )}
                      <h2 className="mt-1 text-2xl font-light tracking-tight text-white">
                        {lastResponse?.report.title ?? "Consultando..."}
                      </h2>
                    </div>
                    <button
                      onClick={closePanel}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/60 transition hover:bg-white/10 hover:text-white"
                      aria-label="Cerrar panel"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-6">
                    {loading && !lastResponse && (
                      <div className="space-y-3">
                        <div className="h-4 w-1/3 animate-pulse rounded-full bg-white/10" />
                        <div className="h-3 w-full animate-pulse rounded-full bg-white/5" />
                        <div className="h-3 w-5/6 animate-pulse rounded-full bg-white/5" />
                        <div className="h-32 w-full animate-pulse rounded-2xl bg-white/5" />
                      </div>
                    )}
                    {lastResponse && <AssistantResponse response={lastResponse} />}
                  </div>
                </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-8 text-xs text-white/50 md:flex-row md:items-center md:justify-between md:px-12">
          <div className="flex items-center gap-3">
            <PrismaLogo size="sm" />
            <span>
              © 2026 Iniciativa PRISMA — Inspirado en la Transparencia Estatal
              de España
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <a
              href="https://transparencia.gob.es/servicios-buscador/buscar.htm"
              target="_blank"
              rel="noopener noreferrer"
              className="transition hover:text-white"
            >
              Buscador Oficial
            </a>
            <button
              onClick={() => scrollTo(heroRef)}
              className="transition hover:text-white"
            >
              Ayuda Ciudadana
            </button>
            <span className="text-white/40">
              Catálogo: {catalog.portal.name} · actualizado{" "}
              {catalog.portal.last_crawled}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
