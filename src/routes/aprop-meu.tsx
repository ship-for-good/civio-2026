import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/aina/SiteHeader";
import { SiteFooter } from "@/components/aina/SiteFooter";
import { FloatingChat } from "@/components/aina/FloatingChat";
import { NearbyPanel } from "@/components/aina/NearbyPanel";

export const Route = createFileRoute("/aprop-meu")({
  head: () => ({
    meta: [
      { title: "Què passa a prop meu? — AIna de Transparència" },
      {
        name: "description",
        content: "Projectes, obres i avisos del teu municipi en un sol lloc.",
      },
      { property: "og:title", content: "Què passa a prop meu? — AIna de Transparència" },
      {
        property: "og:description",
        content: "Projectes, obres i avisos del teu municipi en un sol lloc.",
      },
    ],
  }),
  component: ApropMeuPage,
});

function ApropMeuPage() {
  return (
    <div className="bg-background flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-[1400px] px-4 py-10 sm:px-6">
          <Link
            to="/"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
          >
            <ArrowLeft className="h-4 w-4" /> Tornar a l&apos;inici
          </Link>
          <h1 className="text-foreground mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Què passa a prop meu?
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Explora projectes, obres i licitacions del teu territori. Filtra, cerca i clica al
            mapa o a la taula per veure-ho tot connectat.
          </p>
          <div className="mt-8">
            <NearbyPanel />
          </div>
        </section>
      </main>
      <SiteFooter />
      <FloatingChat />
    </div>
  );
}
