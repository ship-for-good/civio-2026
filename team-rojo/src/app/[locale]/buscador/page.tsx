import { MotionProvider } from "@/components/motion-provider";
import { Buscador } from "@/components/buscador/buscador";

// The buscador copy is in Spanish for all locales (inherently Spanish domain — MVP decision).
// The parent [locale]/layout.tsx generates static params for all locales;
// this page is exported per locale automatically without needing params handling.
export default function BuscadorPage() {
  return (
    <MotionProvider>
      <main id="main">
        <Buscador />
      </main>
    </MotionProvider>
  );
}
