import { useEffect, useRef, useState } from "react";
import { ArrowUp, Sparkles } from "lucide-react";

import { useExampleQuestions } from "@/hooks/use-aina-queries";
import { EXAMPLE_QUESTIONS } from "@/lib/db/seed-data";

function useTypewriter(phrases: string[], active: boolean) {
  const [text, setText] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);

  useEffect(() => {
    if (!active || phrases.length === 0) return;
    const phrase = phrases[phraseIdx % phrases.length];
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
        setPhraseIdx((p) => (p + 1) % phrases.length);
      }
    };
    timeout = setTimeout(type, 300);
    return () => clearTimeout(timeout);
  }, [phraseIdx, active, phrases]);

  return text;
}

export function ChatHero() {
  const [value, setValue] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const isEmpty = value.length === 0;
  const { data: questions } = useExampleQuestions();
  const phrases = questions?.map((q) => q.text_ca) ?? EXAMPLE_QUESTIONS;
  const placeholder = useTypewriter(phrases, isEmpty);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    setReply(
      "Prototip — aviat connectarem amb dades públiques reals. Gràcies per la teva pregunta!",
    );
    setValue("");
    textareaRef.current?.focus();
  };

  return (
    <section id="top" className="bg-hero relative overflow-hidden">
      <div className="mx-auto max-w-3xl px-4 pt-16 pb-12 text-center sm:px-6 sm:pt-24 sm:pb-20">
        <div className="animate-fade-in-up border-border bg-card/70 text-muted-foreground shadow-soft inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs">
          <Sparkles className="text-accent h-3.5 w-3.5" aria-hidden="true" />
          La transparència pública, al teu abast
        </div>

        <h1 className="animate-fade-in-up text-foreground mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
          AIna de Transparència
        </h1>
        <p className="animate-fade-in-up text-muted-foreground mx-auto mt-4 max-w-xl text-base text-pretty sm:text-lg">
          Fes preguntes sobre dades públiques de manera senzilla i entenedora.
        </p>
        <p className="animate-fade-in-up text-muted-foreground mt-2 text-sm">
          Pregunta. Descobreix. Entén.
        </p>

        <form
          onSubmit={onSubmit}
          className="animate-fade-in-up mx-auto mt-10 max-w-2xl"
          aria-label="Fes una pregunta sobre dades públiques"
        >
          <div className="group border-border bg-card shadow-soft focus-within:border-primary/40 focus-within:shadow-glow relative rounded-2xl border p-2 transition-shadow">
            <label htmlFor="aina-input" className="sr-only">
              Pregunta
            </label>
            <textarea
              id="aina-input"
              ref={textareaRef}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (reply) setReply(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSubmit(e);
                }
              }}
              rows={2}
              className="text-foreground block w-full resize-none rounded-xl bg-transparent px-4 py-3 text-base placeholder:text-transparent focus:outline-none"
              placeholder="Escriu la teva pregunta…"
              aria-describedby="aina-helper"
            />
            {isEmpty && (
              <div
                aria-hidden="true"
                className="text-muted-foreground pointer-events-none absolute top-5 left-6 text-left text-base"
              >
                <span className="caret">{placeholder}</span>
              </div>
            )}
            <div className="flex items-center justify-between px-2 pt-1 pb-1">
              <p id="aina-helper" className="text-muted-foreground text-xs">
                Prem Enter per enviar
              </p>
              <button
                type="submit"
                disabled={!value.trim()}
                aria-label="Enviar pregunta"
                className="bg-primary text-primary-foreground shadow-soft inline-flex h-10 w-10 items-center justify-center rounded-xl transition-all hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ArrowUp className="h-5 w-5" />
              </button>
            </div>
          </div>
          <p className="text-muted-foreground mt-3 text-xs">
            Prototip visual · no connectat a un model d&apos;IA real
          </p>
        </form>

        {reply && (
          <div
            role="status"
            className="animate-fade-in-up border-primary/30 bg-primary-soft text-foreground mx-auto mt-6 max-w-2xl rounded-xl border px-4 py-3 text-left text-sm"
          >
            {reply}
          </div>
        )}
      </div>
    </section>
  );
}
