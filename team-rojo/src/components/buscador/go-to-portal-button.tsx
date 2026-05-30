import type { Classification } from "@/domain/buscador/types";

type GoToPortalButtonProps = {
  data: Classification;
  gradient?: string;
};

export function GoToPortalButton({ data, gradient }: GoToPortalButtonProps) {
  const href = data.deepLink ?? data.portalUrl;
  const hasDeepLink = Boolean(data.deepLink);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center justify-center w-full px-5 py-3.5 rounded-full font-medium transition-colors bg-transparent hover:bg-gray-100 border text-foreground"
      style={{ borderColor: "rgba(100,100,100,0.35)" }}
    >
      Hacer la solicitud
    </a>
  );
}
