import { useEffect, useRef, useState } from "react";
import { ArrowUp, Sparkles } from "lucide-react";

const EXAMPLES = [
  "Què cobra el president de la Generalitat?",
  "Quines subvencions té 42 Barcelona?",
  "Quant costa el manteniment del Tramvia Blau?",
  "Quines empreses han rebut ajudes públiques aquest any?",
  "Quin pressupost té el meu ajuntament?",
  "Quines obres públiques hi ha previstes al meu barri?",
  "Quins contractes ha adjudicat la Generalitat aquest mes?",
  "Quant s'ha gastat en comunicació institucional?",
  "Quins càrrecs públics tenen cotxe oficial?",
  "Quines subvencions culturals s'han concedit recentment?",
];

function useTypewriter(active: boolean) {
  const [text, setText] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    if (!active) return;
    const phrase = EXAMPLES[phraseIdx];
    let i = 0;
    let timeout: ReturnType<typeof setTimeout>;

    const type = () => {
      if (i <= phrase.length) {
        setText(phrase.slice(0, i));
        i++;
        timeout = setTimeout(type, 45 + Math.random() * 40);
      } else {
        timeout = setTimeout(erase, 2200);
      }
    };
    const erase = () => {
      if (i >= 0) {
        setText(phrase.slice(0, i));
        i--;
        timeout = setTimeout(erase, 20);
      } else {
        setPhraseIdx((p) => (p + 1) % EXAMPLES.length);
      }
    };
    timeout = setTimeout(type, 300);
    return () => clearTimeout(timeout);
  }, [phraseIdx, active]);

  return text;
}

export function ChatHero() {
  const [value, setValue] = useState("");
  const isEmpty = value.length === 0;
  const placeholder = useTypewriter(isEmpty);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    // Prototype only — no backend wired up.
    setValue("");
    textareaRef.current?.focus();
  };

  return (
    <section id="top" className="bg-hero relative overflow-hidden">
      <div className="mx-auto max-w-3xl px-4 pt-16 pb-12 sm:px-6 sm:pt-24 sm:pb-20 text-center">
        <div className="animate-fade-in-up inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs text-muted-foreground shadow-soft">
          <Sparkles className="h-3.5 w-3.5 text-accent" aria-hidden="true" />
          La transparència pública, al teu abast
        </div>

        <h1 className="animate-fade-in-up mt-6 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-6xl">
          AIna de Transparència
        </h1>
        <p className="animate-fade-in-up mx-auto mt-4 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
          Fes preguntes sobre dades públiques de manera senzilla i entenedora.
        </p>

        <form
          onSubmit={onSubmit}
          className="animate-fade-in-up mx-auto mt-10 max-w-2xl"
          aria-label="Fes una pregunta sobre dades públiques"
        >
          <div className="group relative rounded-2xl border border-border bg-card p-2 shadow-soft transition-shadow focus-within:shadow-glow focus-within:border-primary/40">
            <label htmlFor="aina-input" className="sr-only">
              Pregunta
            </label>
            <textarea
              id="aina-input"
              ref={textareaRef}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit(e);
                }
              }}
              rows={2}
              className="block w-full resize-none rounded-xl bg-transparent px-4 py-3 text-base text-foreground placeholder:text-transparent focus:outline-none"
              placeholder="Escriu la teva pregunta…"
              aria-describedby="aina-helper"
            />
            {isEmpty && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-6 top-5 text-left text-base text-muted-foreground"
              >
                <span className="caret">{placeholder}</span>
              </div>
            )}
            <div className="flex items-center justify-between px-2 pb-1 pt-1">
              <p id="aina-helper" className="text-xs text-muted-foreground">
                Prem Enter per enviar
              </p>
              <button
                type="submit"
                disabled={!value.trim()}
                aria-label="Enviar pregunta"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-soft transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowUp className="h-5 w-5" />
              </button>
            </div>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Prototip visual · no connectat a un model d'IA real
          </p>
        </form>
      </div>
    </section>
  );
}
