import { Link } from "@tanstack/react-router";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5" aria-label="AIna de Transparència — inici">
          <span className="text-base tracking-tight text-foreground">
            <span className="font-extrabold">AI</span>
            <span className="font-medium">na de Transparència</span>
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <nav
            aria-label="Navegació principal"
            className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex"
          >
            <Link
              to="/aprop-meu"
              className="transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              A prop meu
            </Link>
            <Link
              to="/temes-populars"
              className="transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              Temes populars
            </Link>
            <Link
              to="/potser-thas-perdut"
              className="transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground" }}
            >
              Destacats
            </Link>
          </nav>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
