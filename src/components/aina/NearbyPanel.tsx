const ROWS = [
  { title: "Reforma de la Plaça Major", category: "Obra pública", org: "Ajuntament", date: "12/05/2026", status: "En curs" },
  { title: "Subvenció a entitats culturals", category: "Subvenció", org: "Diputació", date: "08/05/2026", status: "Adjudicada" },
  { title: "Pla de mobilitat sostenible", category: "Anunci", org: "Generalitat", date: "02/05/2026", status: "Publicat" },
  { title: "Contracte de neteja viària", category: "Contractació", org: "Ajuntament", date: "28/04/2026", status: "Licitació" },
  { title: "Ampliació carril bici", category: "Obra pública", org: "Ajuntament", date: "20/04/2026", status: "Planificada" },
];

const STATUS_STYLES: Record<string, string> = {
  "En curs": "bg-accent-soft text-accent-foreground",
  "Adjudicada": "bg-primary-soft text-primary",
  "Publicat": "bg-muted text-muted-foreground",
  "Licitació": "bg-accent-soft text-accent-foreground",
  "Planificada": "bg-muted text-muted-foreground",
};

export function NearbyPanel() {
  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="overflow-hidden rounded-2xl border border-border shadow-soft lg:col-span-2">
        <iframe
          title="Mapa de la zona"
          src="https://www.google.com/maps?q=Barcelona&output=embed"
          className="h-72 w-full lg:h-full"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft lg:col-span-3">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">Títol</th>
                <th scope="col" className="px-4 py-3 font-medium">Categoria</th>
                <th scope="col" className="px-4 py-3 font-medium">Organització</th>
                <th scope="col" className="px-4 py-3 font-medium">Data</th>
                <th scope="col" className="px-4 py-3 font-medium">Estat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ROWS.map((r) => (
                <tr key={r.title} className="hover:bg-muted/40">
                  <td className="px-4 py-3 font-medium text-foreground">{r.title}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.category}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.org}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.date}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[r.status] ?? "bg-muted text-muted-foreground"}`}>
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
