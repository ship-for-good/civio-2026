import { ExternalLink } from "lucide-react";
import type { AskResponse } from "@/types";

interface FoundReportCardProps {
  response: AskResponse;
}

export function FoundReportCard({ response }: FoundReportCardProps) {
  const { report, links } = response;
  const primaryLink = links[0];

  return (
    <article className="animate-fade-in rounded-2xl border border-emerald-400/30 bg-emerald-500/5 p-6 backdrop-blur-sm">
      <header className="mb-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          Información encontrada
        </span>
        <h3 className="mt-3 text-lg font-medium tracking-tight text-white">
          {report.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-white/70">
          {report.summary}
        </p>
      </header>

      <section className="space-y-4 rounded-xl border border-white/5 bg-white/[0.02] p-4">
        {primaryLink && (
          <div>
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-white/50">
              Datos disponibles
            </h4>
            <a
              href={primaryLink.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1.5 text-sm leading-relaxed text-emerald-300 transition hover:text-emerald-200 hover:underline"
            >
              {primaryLink.label}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}
        <ReportSection title="Qué puedes hacer con esto" content={report.analysis} />
        <ReportSection title="Limitaciones" content={report.limitations} />
      </section>

    </article>
  );
}

function ReportSection({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <h4 className="text-[11px] font-bold uppercase tracking-widest text-white/50">
        {title}
      </h4>
      <p className="mt-1 text-sm leading-relaxed text-white/80">{content}</p>
    </div>
  );
}
