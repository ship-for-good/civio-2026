import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowUp, Database, ShieldCheck, Zap } from "lucide-react";
import { useExampleQuestions } from "@/hooks/use-aina-queries";
import { EXAMPLE_QUESTIONS } from "@/lib/db/seed-data";

const SECONDARY_TOGGLES = [
  { id: "sources", label: "Fonts oficials", Icon: ShieldCheck },
  { id: "live", label: "Dades en directe", Icon: Database },
] as const;

function useTypewriter(phrases: string[], active: boolean) {
  const [text, setText] = useState("");
  const [phraseIdx, setPhraseIdx] = useState(0);
  const phrasesRef = useRef(phrases);
  phrasesRef.current = phrases;

  const phrasesKey = phrases.join("\n");
  useEffect(() => {
    setPhraseIdx(0);
    setText("");
  }, [phrasesKey]);

  useEffect(() => {
    if (!active) {
      setText("");
      return;
    }
    const list = phrasesRef.current;
    if (list.length === 0) return;

    const phrase = list[phraseIdx % list.length];
    let i = 0;
    let cancelled = false;
    let timeout: ReturnType<typeof setTimeout>;

    const stop = () => {
      cancelled = true;
      clearTimeout(timeout);
    };

    const type = () => {
      if (cancelled) return;
      if (i <= phrase.length) {
        setText(phrase.slice(0, i));
        i++;
        timeout = setTimeout(type, 45 + Math.random() * 40);
      } else {
        timeout = setTimeout(erase, 2200);
      }
    };
    const erase = () => {
      if (cancelled) return;
      if (i >= 0) {
        setText(phrase.slice(0, i));
        i--;
        timeout = setTimeout(erase, 20);
      } else {
        setPhraseIdx((p) => (p + 1) % list.length);
      }
    };
    timeout = setTimeout(type, 300);
    return stop;
  }, [phraseIdx, active]);

  return text;
}

export function ChatHero() {
  const [value, setValue] = useState("");
  const [reply, setReply] = useState<string | null>(null);
  const isEmpty = value.length === 0;
  const { data: questions } = useExampleQuestions();
  const phrases = useMemo(
    () => (questions?.length ? questions.map((q) => q.text_ca) : EXAMPLE_QUESTIONS),
    [questions],
  );
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
    <section id="top" className="relative w-full">
      <div className="mx-auto max-w-3xl px-4 pt-4 pb-6 text-center sm:px-6 sm:pt-6 sm:pb-8">
        <div className="animate-fade-in-up border-accent/40 bg-background/60 text-accent inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold shadow-[0_0_0_4px_oklch(0.74_0.16_55/0.08)] backdrop-blur-md">
          <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
          <span>
            <strong className="font-semibold">MCP</strong> super powered
          </span>
        </div>

        <h1 className="animate-fade-in-up text-foreground mt-6 text-4xl tracking-tight text-balance sm:mt-8 sm:text-6xl">
          <span className="font-extrabold">AI</span>
          <span className="font-medium">na de Transparència</span>
        </h1>

        <p className="animate-fade-in-up text-muted-foreground mx-auto mt-4 max-w-xl text-pretty text-sm sm:text-base">
          No és una IA qualsevol. Connectada amb el protocol{" "}
          <strong className="text-accent">MCP</strong>, consulta dades públiques en directe i et
          respon amb fonts verificables. Més precisa, més certera.
        </p>

        <form
          onSubmit={onSubmit}
          className="animate-fade-in-up relative mx-auto mt-6 max-w-2xl sm:mt-8"
          aria-label="Fes una pregunta sobre dades públiques"
        >
          <div className="liquid-glass liquid-glass-focus relative rounded-3xl p-3">
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
              className="text-foreground block w-full resize-none rounded-2xl bg-transparent px-4 py-4 text-base placeholder:text-transparent focus:outline-none"
              placeholder="Escriu la teva pregunta…"
              aria-describedby="aina-helper"
            />
            {isEmpty && (
              <div
                aria-hidden="true"
                className="text-muted-foreground pointer-events-none absolute top-7 left-7 text-left text-base"
              >
                <span className="typewriter-caret">{placeholder}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 px-2 pt-2.5 pb-1.5">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  aria-pressed="true"
                  title="MCP super powered (sempre actiu)"
                  className="border-accent/50 bg-accent/10 text-accent inline-flex cursor-default items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                >
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="bg-accent absolute inline-flex h-full w-full animate-ping rounded-full opacity-70" />
                    <span className="bg-accent relative inline-flex h-1.5 w-1.5 rounded-full" />
                  </span>
                  MCP super powered
                </button>
                {SECONDARY_TOGGLES.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed="true"
                    title={`${label} (sempre actiu)`}
                    className="border-border bg-background/40 text-muted-foreground inline-flex cursor-default items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm"
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                  </button>
                ))}
              </div>
              <button
                type="submit"
                disabled={!value.trim()}
                aria-label="Enviar pregunta"
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-[oklch(0.66_0.17_45)] text-white shadow-[0_8px_24px_-8px_oklch(0.74_0.16_55/0.6)] transition-all hover:scale-[1.04] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
              >
                <ArrowUp className="h-5 w-5" />
              </button>
            </div>
          </div>
          <p
            id="aina-helper"
            className="text-muted-foreground mt-4 inline-flex items-center gap-1.5 text-xs"
          >
            <Zap className="text-accent h-3 w-3" />
            Prem Enter per enviar · Prototip visual, encara no connectat a un MCP real
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
