import { useFeatured } from "@/hooks/use-aina-queries";
import { formatDateCa, imageForKey } from "@/lib/assets";

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
    <div className="grid gap-5 sm:grid-cols-2">
      {items.map((i) => (
        <article
          key={i.id}
          className="group border-border bg-card shadow-soft hover:shadow-glow flex gap-4 overflow-hidden rounded-2xl border p-3 transition-all hover:-translate-y-0.5"
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
            <time className="text-accent text-xs font-medium" dateTime={i.published_at}>
              {formatDateCa(i.published_at)}
            </time>
            <h3 className="text-foreground mt-1 text-sm font-semibold">{i.title}</h3>
            <p className="text-muted-foreground mt-1 line-clamp-2 text-sm">{i.summary}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
