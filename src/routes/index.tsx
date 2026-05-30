import { createFileRoute, Link } from "@tanstack/react-router";
import { ChatHero } from "@/components/aina/ChatHero";
import { FeatureCards } from "@/components/aina/FeatureCards";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AIna de Transparència — MCP super powered, dades públiques certeres" },
      {
        name: "description",
        content:
          "Pregunta sobre dades públiques amb una IA MCP super powered. Respostes verificables, fonts oficials i informació en directe.",
      },
      { property: "og:title", content: "AIna de Transparència" },
      { property: "og:description", content: "MCP super powered. Pregunta. Descobreix. Entén." },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="bg-background relative flex min-h-dvh flex-col overflow-hidden">
      <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[75vh]">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, oklch(0.62 0.13 235 / 0.55) 0%, oklch(0.78 0.10 235 / 0.30) 35%, oklch(0.95 0.04 230 / 0.15) 65%, transparent 100%)",
          }}
        />
      </div>

      <div className="absolute top-0 right-0 left-0 z-30 flex items-center justify-between px-4 pt-4 sm:px-6 sm:pt-5">
        <Link to="/" aria-label="Inici" className="inline-flex items-center gap-2">
          <img src={logo} alt="" width={28} height={28} className="h-7 w-7 drop-shadow-sm" />
          <span className="text-foreground/90 text-sm font-semibold tracking-tight">AIna</span>
        </Link>
        <ThemeToggle />
      </div>

      <main className="relative z-10 flex flex-1 flex-col justify-start overflow-y-auto pt-14 sm:pt-16">
        <ChatHero />
        <div className="pb-6 sm:pb-8">
          <FeatureCards />
        </div>
      </main>
    </div>
  );
}
