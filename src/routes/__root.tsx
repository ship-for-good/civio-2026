import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import logo from "@/assets/logo.png";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { ThemeProvider } from "@/components/theme/ThemeProvider";

const NO_FLASH_SCRIPT = `(() => { try { const s = localStorage.getItem('aina-theme'); const m = window.matchMedia('(prefers-color-scheme: dark)').matches; const dark = s ? s === 'dark' : m; if (dark) document.documentElement.classList.add('dark'); document.documentElement.style.colorScheme = dark ? 'dark' : 'light'; } catch(e){} })();`;

function NotFoundComponent() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-foreground text-7xl font-bold">404</h1>
        <h2 className="text-foreground mt-4 text-xl font-semibold">Pàgina no trobada</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          La pàgina que cerques no existeix o s&apos;ha mogut.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors"
          >
            Torna a l&apos;inici
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-foreground text-xl font-semibold tracking-tight">
          No s&apos;ha pogut carregar la pàgina
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Alguna cosa ha fallat. Pots refrescar o tornar a l&apos;inici.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors"
          >
            Torna-ho a provar
          </button>
          <a
            href="/"
            className="border-input bg-background text-foreground hover:bg-accent inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium transition-colors"
          >
            Inici
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AIna de Transparència" },
      {
        name: "description",
        content: "La transparència pública, al teu abast. Fes preguntes sobre dades públiques.",
      },
      { name: "author", content: "Team Aina · Ship for Good" },
      { property: "og:title", content: "AIna de Transparència" },
      {
        property: "og:description",
        content: "MCP super powered. Pregunta. Descobreix. Entén.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", type: "image/png", href: logo },
      { rel: "apple-touch-icon", href: logo },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ca">
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <Outlet />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
