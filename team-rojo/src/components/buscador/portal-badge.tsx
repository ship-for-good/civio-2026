import type { Classification } from "@/domain/buscador/types";

type PortalBadgeProps = {
  data: Classification;
};

export function PortalBadge({ data }: PortalBadgeProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span data-testid="result-label" className="inline-flex items-center px-3 py-1 rounded-full bg-accent-light text-accent text-sm font-medium">
        {data.label}
      </span>
      <a
        href={data.portalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-foreground-muted hover:text-accent transition-colors"
      >
        {data.portalUrl}
      </a>
    </div>
  );
}
