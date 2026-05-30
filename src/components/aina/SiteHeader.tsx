import logo from "@/assets/logo.png";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5" aria-label="AIna de Transparència — inici">
          <img src={logo} alt="" width={32} height={32} className="h-8 w-8" />
          <span className="text-base font-semibold tracking-tight text-foreground">
            AIna <span className="text-muted-foreground font-normal">de Transparència</span>
          </span>
        </a>
        <nav aria-label="Navegació principal" className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
          <a href="#nearby" className="hover:text-foreground transition-colors">A prop meu</a>
          <a href="#popular" className="hover:text-foreground transition-colors">Temes populars</a>
          <a href="#missed" className="hover:text-foreground transition-colors">Destacats</a>
        </nav>
      </div>
    </header>
  );
}
