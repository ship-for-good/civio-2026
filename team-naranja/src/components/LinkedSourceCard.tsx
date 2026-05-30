import { ExternalLink, Link2 } from "lucide-react";
import type { AskResponse } from "@/types";

interface LinkedSourceCardProps {
  response: AskResponse;
}

export function LinkedSourceCard({ response }: LinkedSourceCardProps) {
  const primaryLink = response.links[0];

  return (
    <article className="animate-fade-in rounded-2xl border border-cyan-400/30 bg-cyan-500/5 p-6 backdrop-blur-sm">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-cyan-300">
        <Link2 className="h-3 w-3" />
        Enlace externo
      </span>

      <h3 className="mt-3 text-lg font-medium tracking-tight text-white">
        {response.report.title}
      </h3>

      <p className="mt-4 rounded-xl border border-white/5 bg-white/[0.02] p-4 text-sm leading-relaxed text-white/80">
        El portal de transparencia solo enlaza a otra fuente. {response.report.summary}
      </p>

      <p className="mt-4 text-sm leading-relaxed text-white/70">
        {response.report.analysis}
      </p>

      {primaryLink && (
        <a
          href={primaryLink.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-semibold text-cyan-950 transition hover:scale-[1.02]"
        >
          {primaryLink.label}
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      )}
    </article>
  );
}
