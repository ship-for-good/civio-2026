export function SiteFooter() {
  return (
    <footer className="border-border/60 bg-card/40 shrink-0 border-t">
      <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 text-sm sm:flex-row sm:px-6">
        <p>© {new Date().getFullYear()} AIna de Transparència</p>
        <p className="text-center text-xs sm:text-right">
          Pregunta. Descobreix. Entén. · Il·lustracions per{" "}
          <a
            href="https://storyset.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Storyset
          </a>
        </p>
      </div>
    </footer>
  );
}
