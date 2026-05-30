import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/aina/SiteHeader";
import { ChatHero } from "@/components/aina/ChatHero";
import { FeatureCards } from "@/components/aina/FeatureCards";
import { NearbyPanel } from "@/components/aina/NearbyPanel";
import { PopularPanel } from "@/components/aina/PopularPanel";
import { MissedPanel } from "@/components/aina/MissedPanel";
import { SiteFooter } from "@/components/aina/SiteFooter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AIna de Transparència — La transparència pública, al teu abast" },
      { name: "description", content: "Fes preguntes sobre dades públiques de manera senzilla i entenedora. Pregunta. Descobreix. Entén." },
      { property: "og:title", content: "AIna de Transparència" },
      { property: "og:description", content: "La transparència pública, al teu abast. Pregunta. Descobreix. Entén." },
    ],
  }),
  component: Index,
});

function Index() {
  const [active, setActive] = useState<string | null>(null);

  const toggle = (id: string) => setActive((cur) => (cur === id ? null : id));

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <ChatHero />
        <FeatureCards active={active} onToggle={toggle} />

        {active && (
          <section
            id={`${active}-panel`}
            aria-live="polite"
            className="mx-auto max-w-6xl px-4 pb-16 sm:px-6"
          >
            <div className="animate-fade-in-up rounded-2xl border border-border bg-card/50 p-4 sm:p-6">
              <header className="mb-5 flex items-center justify-between">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  {active === "nearby" && "Què passa a prop meu?"}
                  {active === "popular" && "Temes populars"}
                  {active === "missed" && "Potser t'has perdut això"}
                </h2>
                <button
                  type="button"
                  onClick={() => setActive(null)}
                  className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted"
                >
                  Tanca
                </button>
              </header>
              {active === "nearby" && <NearbyPanel />}
              {active === "popular" && <PopularPanel />}
              {active === "missed" && <MissedPanel />}
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
