"use client";

type SearchInputProps = {
  onSubmit: (query: string) => void;
  disabled?: boolean;
};

export function SearchInput({ onSubmit, disabled = false }: SearchInputProps) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const input = form.elements.namedItem("query") as HTMLInputElement;
    const trimmed = input.value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 w-full">
      <input
        name="query"
        type="text"
        aria-label="Pregunta de información pública"
        placeholder="¿Qué información pública buscas?"
        disabled={disabled}
        className="flex-1 px-4 py-3 rounded-lg border border-border bg-background text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent"
      />
      <button
        type="submit"
        disabled={disabled}
        className="px-6 py-3 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover transition-colors disabled:opacity-60"
      >
        Buscar
      </button>
    </form>
  );
}
