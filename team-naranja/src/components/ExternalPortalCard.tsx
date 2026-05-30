import { ExternalLink, Info } from "lucide-react";
import type { AskResponse } from "@/types";

interface ExternalPortalCardProps {
  response: AskResponse;
}

export function ExternalPortalCard({ response }: ExternalPortalCardProps) {
  const topic = response.matchedTopics[0];
  const primaryLink = response.links[0];

  return (
    <article className="animate-fade-in rounded-2xl border border-amber-400/30 bg-amber-500/5 p-6 backdrop-blur-sm">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-300">
        Portal sectorial
      </span>

      <h3 className="mt-3 text-lg font-medium tracking-tight text-white">
        {response.report.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-white/70">
        {response.report.summary}
      </p>

      <div className="mt-5 space-y-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
        <div>
          <h4 className="text-[11px] font-bold uppercase tracking-widest text-white/50">
            Datos disponibles
          </h4>
          <p className="mt-1 text-sm leading-relaxed text-white/80">
            {response.report.rawData}
          </p>
        </div>

        {topic && (
          <p className="text-sm text-white/70">
            Consultar en: <strong className="text-white">{topic.name}</strong>
          </p>
        )}

        <div className="flex gap-3 rounded-lg border border-amber-400/20 bg-amber-500/10 p-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-amber-200">
              Vocabulario útil
            </h4>
            <ul className="mt-1 list-inside list-disc text-xs leading-relaxed text-white/70">
              <li>CPV — código europeo de productos/servicios</li>
              <li>Expediente — identificador del contrato</li>
              <li>Administración licitadora — quien publica la licitación</li>
            </ul>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-white/70">
          {response.report.analysis}
        </p>
      </div>

      {primaryLink && (
        <a
          href={primaryLink.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-xs font-semibold text-amber-950 transition hover:scale-[1.02]"
        >
          {primaryLink.label}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </article>
  );
}
