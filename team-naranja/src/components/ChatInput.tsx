import { Send } from "lucide-react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onSuggestionSelect?: (value: string) => void;
  disabled?: boolean;
  suggestions?: string[];
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  onSuggestionSelect,
  disabled = false,
  suggestions = [],
}: ChatInputProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() && !disabled) onSubmit();
  };

  return (
    <div className="p-2">
      {suggestions.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() =>
                onSuggestionSelect ? onSuggestionSelect(s) : onChange(s)
              }
              className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-white/80 transition hover:bg-white/10"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="glass flex items-center gap-2 rounded-2xl p-2"
      >
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Pregunta a PRISMA..."
          disabled={disabled}
          className="flex-1 bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Enviar</span>
        </button>
      </form>
    </div>
  );
}
