import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/aina/SiteHeader";
import { SiteFooter } from "@/components/aina/SiteFooter";
import { FloatingChat } from "@/components/aina/FloatingChat";
import { PopularPanel } from "@/components/aina/PopularPanel";

export const Route = createFileRoute("/temes-populars")({
  head: () => ({
    meta: [
      { title: "Temes populars — AIna de Transparència" },
      {
        name: "description",
        content: "Els assumptes de transparència més consultats aquesta setmana.",
      },
      { property: "og:title", content: "Temes populars — AIna de Transparència" },
      {
        property: "og:description",
        content: "Els assumptes de transparència més consultats aquesta setmana.",
      },
    ],
  }),
  component: TemesPopularsPage,
});

function TemesPopularsPage() {
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
            Temes populars
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Els assumptes de transparència més consultats aquesta setmana.
          </p>
          <div className="mt-8">
            <PopularPanel />
          </div>
        </section>
      </main>
      <SiteFooter />
      <FloatingChat />
    </div>
  );
}
