import { ExternalLink } from "lucide-react";
import type { Contrato } from "@/lib/contratos";

const eur = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function ContratoCard({ c }: { c: Contrato }) {
  return (
    <div className="rounded-xl border border-border bg-background p-3 text-sm shadow-sm">
      <p className="line-clamp-2 font-medium leading-snug text-foreground">
        {c.objeto}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="font-semibold text-foreground">{eur.format(c.importe)}</span>
        <span>·</span>
        <span>{c.organo}</span>
        <span>·</span>
        <span>{c.fecha}</span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
          {c.tipo_contrato}
        </span>
        <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
          CPV {c.cpv}
        </span>
        <span className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-secondary-foreground">
          {c.estado}
        </span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Adjudicado a <span className="text-foreground">{c.adjudicatario}</span>
      </p>
      <a
        href={c.url_expediente}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        Ver expediente oficial
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
