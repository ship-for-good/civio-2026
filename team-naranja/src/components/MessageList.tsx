import type { AskResponse } from "@/types";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  response?: AskResponse;
}

interface MessageListProps {
  messages: Message[];
  loading?: boolean;
}

export function MessageList({ messages, loading }: MessageListProps) {
  return (
    <div className="flex flex-col gap-3">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
        >
          {msg.role === "user" ? (
            <div className="ml-auto max-w-[85%] rounded-2xl rounded-tr-none bg-white/10 px-4 py-2.5 text-xs leading-relaxed text-white">
              {msg.content}
            </div>
          ) : (
            <div className="max-w-[90%] rounded-2xl rounded-tl-none bg-white/5 px-4 py-2.5 text-xs leading-relaxed text-white/80">
              {msg.content}
            </div>
          )}
        </div>
      ))}

      {loading && (
        <div className="flex justify-start">
          <div className="max-w-[80%] rounded-2xl rounded-tl-none bg-white/5 px-4 py-2.5 text-xs text-white/50">
            <span className="inline-flex items-center gap-1.5">
              Consultando catálogo
              <span className="flex gap-1">
                <span className="h-1 w-1 animate-bounce rounded-full bg-white/60 [animation-delay:-0.3s]" />
                <span className="h-1 w-1 animate-bounce rounded-full bg-white/60 [animation-delay:-0.15s]" />
                <span className="h-1 w-1 animate-bounce rounded-full bg-white/60" />
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
