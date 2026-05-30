import { ArrowUpRight, ExternalLink } from "lucide-react";
import { useFeatured } from "@/hooks/use-aina-queries";
import { formatDateCa, imageForKey, imageObjectPositionForKey } from "@/lib/assets";
import { cn } from "@/lib/utils";
import { McpVerifiedBadge } from "@/components/aina/McpVerifiedBadge";

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
      <McpVerifiedBadge showPortalLink />

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
              className="flex items-start gap-4 p-3 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl bg-primary-soft/30">
                <img
                  src={imageForKey(i.image_key)}
                  alt=""
                  loading="lazy"
                  width={112}
                  height={112}
                  className="absolute inset-0 h-full w-full object-contain p-1 transition-transform duration-500 group-hover:scale-[1.05]"
                  style={{ objectPosition: imageObjectPositionForKey(i.image_key) }}
                />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
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
