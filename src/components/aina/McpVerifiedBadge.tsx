import { ShieldCheck } from "lucide-react";

const TRANSPARENCY_URL = "https://ajuntament.barcelona.cat/transparencia/ca";

type Props = {
  className?: string;
  /** Mostra enllaç explícit al portal (temes populars). */
  showPortalLink?: boolean;
};

/** Indica que el contingut prové de fonts públiques verificades via MCP (prototip). */
export function McpVerifiedBadge({ className, showPortalLink = false }: Props) {
  return (
    <div
      className={
        className ??
        "mb-5 inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent"
      }
    >
      <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="text-left leading-snug">
        <strong className="font-semibold">Informació verificada amb MCP</strong>
        {showPortalLink ? (
          <>
            {" "}
            · fonts i enllaços del{" "}
            <a
              href={TRANSPARENCY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline underline-offset-2 hover:text-accent"
            >
              portal de Transparència de Barcelona
            </a>
          </>
        ) : (
          <> · fonts oficials contrastades pel protocol MCP</>
        )}
      </span>
    </div>
  );
}

export function McpVerifiedChip() {
  return (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
      <ShieldCheck className="h-3 w-3" aria-hidden />
      Verificat amb MCP
    </span>
  );
}
