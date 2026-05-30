"use client";

const EXAMPLE_QUERIES = [
  "Contratos de limpieza del Ayuntamiento de Madrid",
  "Subvenciones a una asociación cultural",
  "Cuánto cobra un ministro",
  "Declaración de bienes de un diputado",
  "Cómo solicitar acceso a documentos de un ministerio",
] as const;

type QueryChipsProps = {
  onPick: (query: string) => void;
  disabled?: boolean;
};

export function QueryChips({ onPick, disabled = false }: QueryChipsProps) {
  return (
    <div className="flex flex-wrap gap-2" role="list">
      {EXAMPLE_QUERIES.map((query) => (
        <button
          key={query}
          role="listitem"
          type="button"
          disabled={disabled}
          onClick={() => onPick(query)}
          className="px-4 py-2 rounded-full border border-border text-sm text-foreground-muted hover:bg-background-alt transition-colors disabled:opacity-60"
        >
          {query}
        </button>
      ))}
    </div>
  );
}
