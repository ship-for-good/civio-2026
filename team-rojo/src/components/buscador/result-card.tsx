import type { Classification } from "@/domain/buscador/types";
import { PortalBadge } from "./portal-badge";
import { StepGuide } from "./step-guide";
import { GoToPortalButton } from "./go-to-portal-button";

type ResultCardProps = {
  data: Classification;
  onReset: () => void;
};

export function ResultCard({ data, onReset }: ResultCardProps) {
  return (
    <div className="border border-border bg-background rounded-xl p-6 shadow-sm space-y-6">
      <PortalBadge data={data} />

      <div>
        <h2 className="text-base font-semibold text-foreground mb-2">Por qué aquí</h2>
        <p className="text-foreground-muted leading-relaxed">{data.explanation}</p>
      </div>

      <div>
        <h2 className="text-base font-semibold text-foreground mb-3">Cómo buscarlo</h2>
        <StepGuide steps={data.steps} tip={data.searchTip} />
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-2">
        <GoToPortalButton data={data} />
        <button
          onClick={onReset}
          className="text-sm text-foreground-muted hover:text-foreground transition-colors"
        >
          ¿No es esto? Probar otra
        </button>
      </div>
    </div>
  );
}
