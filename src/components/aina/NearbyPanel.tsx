import { useNearby } from "@/hooks/use-aina-queries";

const STATUS_STYLES: Record<string, string> = {
  "En curs": "bg-accent-soft text-accent-foreground",
  Adjudicada: "bg-primary-soft text-primary",
  Publicat: "bg-muted text-muted-foreground",
  Licitació: "bg-accent-soft text-accent-foreground",
  Planificada: "bg-muted text-muted-foreground",
  "En votació": "bg-primary-soft text-primary",
};

const MAP_EMBED =
  import.meta.env.VITE_GOOGLE_MAPS_EMBED_URL ??
  "https://www.google.com/maps?q=Barcelona&output=embed";

export function NearbyPanel() {
  const { data: rows = [], isLoading, isError } = useNearby();

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="border-border shadow-soft overflow-hidden rounded-2xl border lg:col-span-2">
        <iframe
          title="Mapa de la zona"
          src={MAP_EMBED}
          className="h-72 w-full lg:h-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <div className="border-border bg-card shadow-soft overflow-hidden rounded-2xl border lg:col-span-3">
        {isLoading && (
          <p className="text-muted-foreground p-6 text-sm" role="status">
            Carregant dades…
          </p>
        )}
        {isError && !isLoading && (
          <p className="text-muted-foreground p-6 text-sm" role="status">
            Mostrant dades de demostració.
          </p>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/60 text-muted-foreground text-xs tracking-wide uppercase">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Títol
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Categoria
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Organització
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Data
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Estat
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-muted/40">
                  <td className="text-foreground px-4 py-3 font-medium">{r.title}</td>
                  <td className="text-muted-foreground px-4 py-3">{r.category}</td>
                  <td className="text-muted-foreground px-4 py-3">{r.organization}</td>
                  <td className="text-muted-foreground px-4 py-3">{r.date}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status] ?? "bg-muted text-muted-foreground"}`}
                    >
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
