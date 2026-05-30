import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/aina/SiteHeader";
import { SiteFooter } from "@/components/aina/SiteFooter";
import { FloatingChat } from "@/components/aina/FloatingChat";
import { MissedPanel } from "@/components/aina/MissedPanel";

export const Route = createFileRoute("/potser-thas-perdut")({
  head: () => ({
    meta: [
      { title: "Potser t'has perdut això — AIna de Transparència" },
      {
        name: "description",
        content: "Publicacions destacades de l'administració recentment.",
      },
      {
        property: "og:title",
        content: "Potser t'has perdut això — AIna de Transparència",
      },
      {
        property: "og:description",
        content: "Publicacions destacades de l'administració recentment.",
      },
    ],
  }),
  component: PotserThasPerdutPage,
});

function PotserThasPerdutPage() {
  return (
    <div className="bg-background flex min-h-dvh flex-col">
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <Link
            to="/"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm"
          >
            <ArrowLeft className="h-4 w-4" /> Tornar a l&apos;inici
          </Link>
          <h1 className="text-foreground mt-4 text-3xl font-semibold tracking-tight sm:text-4xl">
            Potser t&apos;has perdut això
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Publicacions destacades de l&apos;administració recentment.
          </p>
          <div className="mt-8">
            <MissedPanel />
          </div>
        </section>
      </main>
      <SiteFooter />
      <FloatingChat />
    </div>
  );
}
