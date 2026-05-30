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
    <form onSubmit={handleSubmit} className="relative w-full">
      <input
        name="query"
        type="text"
        aria-label="Pregunta de información pública"
        placeholder="Ej. ¿cuánto cobra una ministra?"
        disabled={disabled}
        data-testid="search-input"
        className="w-full px-5 py-4 pr-14 rounded-full text-white placeholder:text-white/50 focus:outline-none text-base"
        style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)" }}
      />
      <button
        type="submit"
        disabled={disabled}
        data-testid="search-submit"
        aria-label="Buscar"
        className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full text-white hover:opacity-80 transition-opacity disabled:opacity-40"
        style={{ background: "rgba(255,255,255,0.25)" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
        </svg>
      </button>
    </form>
  );
}
