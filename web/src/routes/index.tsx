import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Toaster } from "sonner";

import { InfoPanel } from "@/components/transparencia/InfoPanel";
import { ChatPanel } from "@/components/transparencia/ChatPanel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Transparencia ES — chat ciudadano sobre contratos públicos" },
      {
        name: "description",
        content:
          "Pregunta en lenguaje normal en qué se gasta el dinero público en España. Datos reales de PLACSP con enlace a la fuente oficial.",
      },
      { property: "og:title", content: "Transparencia ES" },
      {
        property: "og:description",
        content:
          "Chat ciudadano que responde con contratos públicos reales y siempre cita la fuente oficial.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [draft, setDraft] = useState("");

  return (
    <main className="bg-background lg:h-screen lg:overflow-hidden">
      <Toaster richColors position="top-center" />
      <div className="grid grid-cols-1 gap-0 lg:h-screen lg:grid-cols-12 lg:px-20">
        <section className="lg:col-span-5 lg:overflow-y-auto lg:border-r lg:border-border">
          <InfoPanel onPickUseCase={(q) => setDraft(q)} />
        </section>
        <section className="flex h-[85vh] min-h-0 flex-col p-4 lg:col-span-7 lg:h-screen lg:p-6">
          <ChatPanel draft={draft} setDraft={setDraft} />
        </section>
      </div>
    </main>
  );
}
