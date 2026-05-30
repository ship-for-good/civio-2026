import type { ChatErrorResponse, ChatResponse } from "@/lib/types/chat";

const DEFAULT_CHAT_API_URL = "http://localhost:8080";

function chatEndpoint() {
  const base = import.meta.env.VITE_CHAT_API_URL || DEFAULT_CHAT_API_URL;
  return `${base.replace(/\/$/, "")}/chat`;
}

export async function askChat(question: string): Promise<ChatResponse> {
  const response = await fetch(chatEndpoint(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    let message = `Error ${response.status} al consultar el asistente`;
    try {
      const body = (await response.json()) as ChatErrorResponse;
      if (body.error) {
        message = body.error;
      }
    } catch {
      // Keep the status-based message if the backend does not return JSON.
    }
    throw new Error(message);
  }

  return (await response.json()) as ChatResponse;
}
