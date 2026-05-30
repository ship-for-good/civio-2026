import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: Props) {
  const { locale } = await params;
  redirect({ href: "/buscador", locale: locale as (typeof routing.locales)[number] });
}
