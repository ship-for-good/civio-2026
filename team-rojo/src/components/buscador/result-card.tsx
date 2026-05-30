import type { Classification, TopicId } from "@/domain/buscador/types";
import { GoToPortalButton } from "./go-to-portal-button";

const GRADIENTS: Record<TopicId, string> = {
  retribuciones:       "linear-gradient(135deg, #1a6eb5 0%, #4a9fd4 100%)",
  contratacion:        "linear-gradient(135deg, #1a6b3a 0%, #4a9e6b 100%)",
  subvenciones:        "linear-gradient(135deg, #c45e0a 0%, #e8a030 100%)",
  bienes_patrimonio:   "linear-gradient(135deg, #4a2d82 0%, #7b5ea7 100%)",
  casa_real:           "linear-gradient(135deg, #8b6914 0%, #c9a84c 100%)",
  derecho_acceso:      "linear-gradient(135deg, #0a6b6b 0%, #2a9d8f 100%)",
  normativa_boe:       "linear-gradient(135deg, #2d3a8c 0%, #5c6bc0 100%)",
  estatales_generales: "linear-gradient(135deg, #1a4f7a 0%, #3a85b5 100%)",
  hacienda:            "linear-gradient(135deg, #0a6b6b 0%, #2a9d8f 100%)",
  unknown:             "linear-gradient(135deg, #4a5568 0%, #718096 100%)",
};

type ResultCardProps = {
  data: Classification;
  onReset: () => void;
};

export function ResultCard({ data, onReset }: ResultCardProps) {
  const gradient = GRADIENTS[data.topicId];

  return (
    <div
      data-testid="result-card"
      className="rounded-2xl p-8 shadow-lg space-y-6"
      style={{ background: "rgba(255,255,255,0.75)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
    >
      <div className="flex flex-col gap-2">
        <span
          className="text-xs font-medium text-white px-3 py-1 rounded-full w-fit"
          style={{ background: gradient }}
        >
          {new URL(data.portalUrl).hostname.replace("www.", "")}
        </span>
        <h2 className="text-base font-semibold text-foreground">{data.label}</h2>
      </div>

      {data.entityMatch && (
        <p className="text-sm text-foreground-muted">
          Tu solicitud va dirigida a{" "}
          <span className="font-semibold text-foreground">{data.entityMatch.name}</span>.
          Te llevamos a su sede electrónica, donde elegirás tu método de
          identificación (Cl@ve, certificado o DNI electrónico).
        </p>
      )}

      <p data-testid="result-explanation" className="text-foreground-muted leading-relaxed text-sm">{data.explanation}</p>

      {data.steps.length > 0 && (
        <ol className="space-y-2">
          {data.steps.map((step, i) => (
            <li key={i} className="flex gap-3 text-sm text-foreground-muted">
              <span className="shrink-0 font-medium text-foreground">{i + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      )}

      <div className="flex flex-col gap-3 pt-2">
        <GoToPortalButton data={data} gradient={gradient} />
        <button
          onClick={onReset}
          className="text-sm text-foreground-muted hover:text-foreground transition-colors text-center"
        >
          ¿No es esto lo que buscas?
        </button>
      </div>
    </div>
  );
}
