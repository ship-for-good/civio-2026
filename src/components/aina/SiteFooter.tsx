export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-card/40">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
        <p>© {new Date().getFullYear()} AIna de Transparència</p>
        <p className="text-xs">Pregunta. Descobreix. Entén.</p>
      </div>
    </footer>
  );
}
