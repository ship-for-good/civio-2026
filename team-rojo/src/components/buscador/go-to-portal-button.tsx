import type { Classification } from "@/domain/buscador/types";

type GoToPortalButtonProps = {
  data: Classification;
};

export function GoToPortalButton({ data }: GoToPortalButtonProps) {
  const href = data.deepLink ?? data.portalUrl;
  const hasDeepLink = Boolean(data.deepLink);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center px-5 py-2.5 rounded-lg bg-accent text-white font-medium hover:bg-accent-hover transition-colors"
    >
      → Ir al portal{hasDeepLink ? " (búsqueda lista)" : ""}
    </a>
  );
}
