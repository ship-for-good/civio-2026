import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Send, Loader2, Bot, User, Plus, History, Trash2, Check } from "lucide-react";
import { toast } from "sonner";

import { chat } from "@/lib/chat.functions";
import type { ChatMessage } from "@/lib/contratos";
import { ContratoCard } from "./ContratoCard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Props = {
  draft: string;
  setDraft: (v: string) => void;
};

type Conversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
};

const STORAGE_KEY = "transparencia-es:conversations:v1";
const ACTIVE_KEY = "transparencia-es:active:v1";

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function loadConversations(): Conversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Conversation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function deriveTitle(messages: ChatMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser) return "Nuevo chat";
  const t = firstUser.content.trim().replace(/\s+/g, " ");
  return t.length > 48 ? t.slice(0, 48) + "…" : t;
}

export function ChatPanel({ draft, setDraft }: Props) {
  const chatFn = useServerFn(chat);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Hydrate from localStorage on mount (avoid SSR mismatch).
  useEffect(() => {
    const convs = loadConversations();
    const active = localStorage.getItem(ACTIVE_KEY);
    if (convs.length > 0) {
      setConversations(convs);
      setActiveId(active && convs.some((c) => c.id === active) ? active : convs[0].id);
    } else {
      const fresh: Conversation = {
        id: uid(),
        title: "Nuevo chat",
        messages: [],
        updatedAt: Date.now(),
      };
      setConversations([fresh]);
      setActiveId(fresh.id);
    }
    setHydrated(true);
  }, []);

  // Persist on changes.
  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations, hydrated]);

  useEffect(() => {
    if (!hydrated || !activeId) return;
    localStorage.setItem(ACTIVE_KEY, activeId);
  }, [activeId, hydrated]);

  const active = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId],
  );
  const messages = active?.messages ?? [];

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  function newChat() {
    // Si el activo ya está vacío, lo reusamos en vez de duplicar.
    if (active && active.messages.length === 0) return;
    const fresh: Conversation = {
      id: uid(),
      title: "Nuevo chat",
      messages: [],
      updatedAt: Date.now(),
    };
    setConversations((prev) => [fresh, ...prev]);
    setActiveId(fresh.id);
    setDraft("");
  }

  function deleteConversation(id: string) {
    setConversations((prev) => {
      const next = prev.filter((c) => c.id !== id);
      if (next.length === 0) {
        const fresh: Conversation = {
          id: uid(),
          title: "Nuevo chat",
          messages: [],
          updatedAt: Date.now(),
        };
        setActiveId(fresh.id);
        return [fresh];
      }
      if (id === activeId) setActiveId(next[0].id);
      return next;
    });
  }

  function updateActive(updater: (msgs: ChatMessage[]) => ChatMessage[]) {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== activeId) return c;
        const messages = updater(c.messages);
        return {
          ...c,
          messages,
          title: c.title === "Nuevo chat" ? deriveTitle(messages) : c.title,
          updatedAt: Date.now(),
        };
      }),
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || loading || !active) return;
    setDraft("");
    const historial = messages.map((m) => ({ role: m.role, content: m.content }));
    updateActive((msgs) => [...msgs, { role: "user", content: text }]);
    setLoading(true);
    try {
      const res = await chatFn({ data: { mensaje: text, historial } });
      updateActive((msgs) => [
        ...msgs,
        { role: "assistant", content: res.reply, contratos: res.contratos },
      ]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Algo ha fallado.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const sorted = useMemo(
    () => [...conversations].sort((a, b) => b.updatedAt - a.updatedAt),
    [conversations],
  );

  return (
    <div className="flex h-full min-h-0 flex-col rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-2 border-b border-border px-5 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Bot className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate text-sm font-medium">
            {active?.title ?? "Asistente Transparencia ES"}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={newChat}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-xs font-medium transition hover:bg-accent"
            title="Nuevo chat"
          >
            <Plus className="h-3.5 w-3.5" />
            Nuevo
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 text-xs font-medium transition hover:bg-accent"
                title="Historial"
              >
                <History className="h-3.5 w-3.5" />
                Historial
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Conversaciones guardadas
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {sorted.length === 0 && (
                <div className="px-2 py-3 text-xs text-muted-foreground">
                  Aún no hay conversaciones.
                </div>
              )}
              {sorted.map((c) => (
                <DropdownMenuItem
                  key={c.id}
                  onSelect={(e) => {
                    e.preventDefault();
                    setActiveId(c.id);
                  }}
                  className="flex items-center gap-2"
                >
                  <Check
                    className={`h-3.5 w-3.5 shrink-0 ${
                      c.id === activeId ? "text-primary" : "text-transparent"
                    }`}
                  />
                  <span className="flex-1 truncate text-sm">{c.title}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      deleteConversation(c.id);
                    }}
                    className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    aria-label="Eliminar conversación"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {messages.length === 0 && !loading && (
          <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-center text-sm text-muted-foreground">
            <p className="max-w-sm">
              Pregúntame en lenguaje normal: "¿Cuánto gastó el Ayto. de Barcelona en
              colegios?" Te buscaré los contratos y te llevaré a la fuente oficial.
            </p>
          </div>
        )}

        {messages.map((m, i) => (
          <MessageBubble key={i} m={m} />
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Buscando contratos…
          </div>
        )}
      </div>

      <form
        onSubmit={onSubmit}
        className="flex items-end gap-2 border-t border-border p-3"
      >
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSubmit(e as unknown as FormEvent);
            }
          }}
          rows={1}
          placeholder="Pregunta lo que quieras saber del gasto público…"
          className="max-h-32 min-h-[44px] flex-1 resize-none rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none ring-ring placeholder:text-muted-foreground focus:ring-2"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !draft.trim()}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
          aria-label="Enviar"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </form>
    </div>
  );
}

function MessageBubble({ m }: { m: ChatMessage }) {
  const isUser = m.role === "user";
  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-foreground text-background" : "bg-primary text-primary-foreground"
        }`}
      >
        {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
      </div>
      <div className={`max-w-[85%] space-y-2 ${isUser ? "items-end" : ""}`}>
        <div
          className={`whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
            isUser
              ? "bg-foreground text-background"
              : "bg-secondary text-secondary-foreground"
          }`}
        >
          {m.content}
        </div>
        {m.contratos && m.contratos.length > 0 && (
          <div className="space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {m.contratos.length} contrato{m.contratos.length === 1 ? "" : "s"} encontrado
              {m.contratos.length === 1 ? "" : "s"}
            </p>
            <div className="space-y-2">
              {m.contratos.map((c, i) => (
                <ContratoCard key={i} c={c} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
