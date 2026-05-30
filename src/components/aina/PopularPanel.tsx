import { useTopics } from "@/hooks/use-aina-queries";
import { formatDateCa, imageForKey } from "@/lib/assets";

export function PopularPanel() {
  const { data: topics = [], isLoading } = useTopics();

  if (isLoading) {
    return (
      <p className="text-muted-foreground text-sm" role="status">
        Carregant temes…
      </p>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {topics.map((t) => (
        <article
          key={t.id}
          className="group border-border bg-card shadow-soft hover:shadow-glow overflow-hidden rounded-2xl border transition-all hover:-translate-y-0.5"
        >
          <div className="bg-muted aspect-[16/10] overflow-hidden">
            <img
              src={imageForKey(t.image_key)}
              alt=""
              loading="lazy"
              width={768}
              height={480}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          </div>
          <div className="p-5">
            <h3 className="text-foreground text-base font-semibold">{t.title}</h3>
            <p className="text-muted-foreground mt-1.5 text-sm">{t.summary}</p>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="bg-primary-soft text-primary rounded-full px-2.5 py-0.5 text-xs font-medium">
                {t.category}
              </span>
              <time className="text-muted-foreground text-xs" dateTime={t.published_at}>
                {formatDateCa(t.published_at)}
              </time>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
