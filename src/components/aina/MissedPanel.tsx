import { ArrowUpRight, ExternalLink, ShieldCheck } from "lucide-react";
import { useFeatured } from "@/hooks/use-aina-queries";
import { formatDateCa, imageForKey } from "@/lib/assets";
import { cn } from "@/lib/utils";

export function MissedPanel() {
  const { data: items = [], isLoading } = useFeatured();

  if (isLoading) {
    return (
      <p className="text-muted-foreground text-sm" role="status">
        Carregant destacats…
      </p>
    );
  }

  return (
    <div>
      <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent">
        <ShieldCheck className="h-3.5 w-3.5" />
        <span>
          Enllaços al{" "}
          <a
            href="https://ajuntament.barcelona.cat/transparencia/ca"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold underline underline-offset-2 hover:text-accent"
          >
            portal de Transparència de Barcelona
          </a>
        </span>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {items.map((i) => (
          <article
            key={i.id}
            className="group border-border bg-card shadow-soft hover:shadow-glow overflow-hidden rounded-2xl border transition-all hover:-translate-y-0.5"
          >
            <a
              href={i.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex gap-4 p-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="bg-muted aspect-square h-28 w-28 flex-none overflow-hidden rounded-xl">
                <img
                  src={imageForKey(i.image_key)}
                  alt=""
                  loading="lazy"
                  width={224}
                  height={224}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                />
              </div>
              <div className="min-w-0 flex-1 py-1">
                <div className="flex items-start justify-between gap-2">
                  <time className="text-accent text-xs font-medium" dateTime={i.published_at}>
                    {formatDateCa(i.published_at)}
                  </time>
                  <ArrowUpRight
                    className={cn(
                      "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                      "group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent",
                    )}
                    aria-hidden
                  />
                </div>
                <h3 className="text-foreground mt-1 text-sm font-semibold group-hover:text-accent">
                  {i.title}
                </h3>
                <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">{i.summary}</p>
                <p className="text-muted-foreground mt-2 inline-flex items-center gap-1 text-xs">
                  <ExternalLink className="h-3 w-3 shrink-0" />
                  <span className="truncate">{i.source}</span>
                </p>
              </div>
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}
