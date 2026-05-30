import { Sparkles, FileSearch, ShieldCheck, Languages } from "lucide-react";

const USE_CASES = [
  "¿Cuánto se gastó el Ayuntamiento de Zaragoza en obras en el Mercado Central?",
  "¿Cuánto se ha gastado el Ayuntamiento de Barcelona en obras de colegios?",
  "Contratos del Ministerio de Sanidad en 2024",
  "¿Dónde encuentro los contratos de mi ayuntamiento?",
];

const FEATURES = [
  { icon: FileSearch, text: "Datos reales de la Plataforma de Contratación (PLACSP)" },
  { icon: Languages, text: "Sin jerga: te traduce CPV y tipos de contrato" },
  { icon: ShieldCheck, text: "Siempre con enlace a la fuente oficial" },
];

export function InfoPanel({ onPickUseCase }: { onPickUseCase: (q: string) => void }) {
  return (
    <div className="flex h-full flex-col gap-6 p-6 lg:p-10">
      <div className="flex items-center gap-2">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="h-5 w-5" />
        </div>
        <span className="text-lg font-semibold tracking-tight">Transparencia ES</span>
      </div>

      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground lg:text-4xl">
          ¿En qué se gasta el dinero público?
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          En España la información pública existe, pero vive dispersa y con
          vocabulario técnico. Este asistente responde preguntas en lenguaje
          de calle sobre contratos públicos, te muestra los datos reales y
          siempre te lleva a la fuente oficial. No inventa, no opina.
        </p>
        <ul className="space-y-2">
          {FEATURES.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-start gap-2 text-sm text-foreground/80">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto rounded-2xl border border-border bg-card p-5 shadow-sm">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Prueba con un ejemplo
        </p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {USE_CASES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onPickUseCase(q)}
              className="group rounded-xl border border-border bg-background p-3 text-left text-sm leading-snug text-foreground/80 transition hover:border-primary hover:bg-accent hover:text-foreground"
            >
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
