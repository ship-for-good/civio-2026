import { Link } from "@tanstack/react-router";
import { Network } from "lucide-react";
import logo from "@/assets/logo.png";
import { ThemeToggle } from "@/components/theme/ThemeToggle";

export function SiteHeader() {
  return (
    <header className="border-border/60 bg-background/80 sticky top-0 z-40 w-full shrink-0 border-b backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-2.5"
          aria-label="AIna de Transparència — inici"
        >
          <img src={logo} alt="" width={32} height={32} className="h-8 w-8" />
          <span className="text-foreground text-base tracking-tight">
            <span className="font-extrabold">AI</span>
            <span className="font-medium">na de Transparència</span>
          </span>
          <span className="border-accent/40 bg-accent-soft text-accent ml-2 hidden items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase sm:inline-flex">
            <Network className="h-3 w-3" /> MCP
          </span>
        </Link>
        <div className="flex items-center gap-4">
          <nav
            aria-label="Navegació principal"
            className="text-muted-foreground hidden items-center gap-6 text-sm sm:flex"
          >
            <Link
              to="/aprop-meu"
              className="hover:text-foreground transition-colors"
              activeProps={{ className: "text-foreground" }}
            >
              A prop meu
            </Link>
            <Link
              to="/temes-populars"
              className="hover:text-foreground transition-colors"
              activeProps={{ className: "text-foreground" }}
            >
              Temes populars
            </Link>
            <Link
              to="/potser-thas-perdut"
              className="hover:text-foreground transition-colors"
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
