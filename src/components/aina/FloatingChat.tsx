import { useState } from "react";
import { ArrowUp, Network, Sparkles, X } from "lucide-react";
import { useLocation } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const PAGE_CONTEXT: Record<string, string> = {
  "/aprop-meu": "Estàs explorant licitacions i obres del teu territori.",
  "/temes-populars": "Estàs mirant els temes més consultats aquesta setmana.",
  "/potser-thas-perdut": "Estàs revisant publicacions destacades de l'administració.",
};

export function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const { pathname } = useLocation();
  const ctx = PAGE_CONTEXT[pathname] ?? "Pregunta sobre dades públiques.";

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setValue("");
  };

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Tancar xat" : "Obrir xat MCP"}
        className={cn(
          "fixed bottom-5 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full text-white shadow-glow transition-all hover:scale-105",
          "bg-gradient-to-br from-accent to-[oklch(0.65_0.18_45)]",
          !open && "animate-pulse-ring",
        )}
      >
        {open ? <X className="h-6 w-6" /> : <Sparkles className="h-6 w-6" />}
      </button>

      {/* Drawer */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm animate-fade-in-up"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div className="fixed bottom-24 right-5 z-50 w-[min(380px,calc(100vw-2.5rem))] origin-bottom-right animate-fade-in-up">
            <div className="liquid-glass liquid-glass-focus rounded-2xl p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-accent text-white">
                    <Network className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-foreground">Pregunta a AIna</div>
                    <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-accent">
                      <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
                      MCP super powered
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-1 text-muted-foreground hover:text-foreground"
                  aria-label="Tancar"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">{ctx} Pregunta el que vulguis.</p>

              <form onSubmit={submit} className="mt-3">
                <div className="liquid-glass liquid-glass-focus flex items-end gap-2 rounded-xl p-2">
                  <textarea
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        submit(e);
                      }
                    }}
                    rows={2}
                    placeholder="Pregunta sobre el que estàs veient…"
                    className="block w-full resize-none bg-transparent px-2 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!value.trim()}
                    aria-label="Enviar"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent text-white shadow-soft transition-all hover:opacity-90 disabled:opacity-40"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                </div>
              </form>

              <p className="mt-2 text-[10px] text-muted-foreground">
                Prototip · respostes reals quan connectis el teu motor MCP.
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
