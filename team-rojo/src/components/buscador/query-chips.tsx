"use client";

const EXAMPLE_QUERIES = [
  "Contratos de limpieza del Ayuntamiento de Madrid",
  "Subvenciones a una asociación cultural",
  "Cuánto cobra un ministro",
  "Declaración de bienes de un diputado",
  "Calidad del aire en mi ciudad",
] as const;

type QueryChipsProps = {
  onPick: (query: string) => void;
};

export function QueryChips({ onPick }: QueryChipsProps) {
  return (
    <div className="flex flex-wrap gap-2" role="list">
      {EXAMPLE_QUERIES.map((query) => (
        <button
          key={query}
          role="listitem"
          onClick={() => onPick(query)}
          className="px-4 py-2 rounded-full border border-border text-sm text-foreground-muted hover:bg-background-alt transition-colors"
        >
          {query}
        </button>
      ))}
    </div>
  );
}
