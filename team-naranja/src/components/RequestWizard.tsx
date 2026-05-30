import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import type { RequestGuideResponse } from "@/types";

interface RequestWizardProps {
  guide: RequestGuideResponse;
  reportTitle: string;
}

export function RequestWizard({ guide, reportTitle }: RequestWizardProps) {
  const [step, setStep] = useState(1);
  const [copied, setCopied] = useState(false);

  const copyTemplate = async () => {
    await navigator.clipboard.writeText(guide.template);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article className="animate-fade-in rounded-2xl border border-pink-400/30 bg-pink-500/5 p-6 backdrop-blur-sm">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-pink-300">
        Información no publicada
      </span>

      <h3 className="mt-3 text-lg font-medium tracking-tight text-white">
        {reportTitle}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-white/70">
        Debes ejercer tu derecho de acceso a la información pública.
      </p>

      <div className="mt-5 flex gap-2">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className={`h-1 flex-1 rounded-full transition-colors ${
              n <= step ? "bg-pink-400" : "bg-white/10"
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <section className="mt-6">
          <h4 className="text-sm font-medium text-white">
            Paso 1 — Confirma qué buscas
          </h4>
          <p className="mt-2 text-sm leading-relaxed text-white/70">
            {guide.steps[0]}
          </p>
          <button
            type="button"
            onClick={() => setStep(2)}
            className="mt-5 rounded-xl bg-pink-400 px-4 py-2 text-xs font-semibold text-pink-950 transition hover:scale-[1.02]"
          >
            Siguiente
          </button>
        </section>
      )}

      {step === 2 && (
        <section className="mt-6">
          <h4 className="text-sm font-medium text-white">
            Paso 2 — Organismo y portal
          </h4>
          <p className="mt-2 text-sm leading-relaxed text-white/70">
            {guide.steps[1]}
          </p>
          <p className="mt-3 text-sm text-white/80">
            <strong className="text-white">Organismo:</strong> {guide.organism}
          </p>
          <a
            href={guide.portalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-pink-300 underline-offset-4 hover:underline"
          >
            Ir al portal de solicitudes
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded-xl border border-white/15 px-4 py-2 text-xs font-medium text-white/70 transition hover:bg-white/5"
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="rounded-xl bg-pink-400 px-4 py-2 text-xs font-semibold text-pink-950 transition hover:scale-[1.02]"
            >
              Siguiente
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="mt-6">
          <h4 className="text-sm font-medium text-white">Paso 3 — Plantilla</h4>
          <p className="mt-2 text-sm leading-relaxed text-white/70">
            {guide.steps[2]}
          </p>
          <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-xl border border-white/10 bg-black/40 p-3 text-xs leading-relaxed text-white/80">
            {guide.template}
          </pre>
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="rounded-xl border border-white/15 px-4 py-2 text-xs font-medium text-white/70 transition hover:bg-white/5"
            >
              Atrás
            </button>
            <button
              type="button"
              onClick={copyTemplate}
              className="inline-flex items-center gap-2 rounded-xl bg-pink-400 px-4 py-2 text-xs font-semibold text-pink-950 transition hover:scale-[1.02]"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  Copiar texto
                </>
              )}
            </button>
          </div>
        </section>
      )}
    </article>
  );
}
