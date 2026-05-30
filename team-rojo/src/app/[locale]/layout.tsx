import { pixel, serif } from "@/lib/fonts";
import { routing } from "@/i18n/routing";
import type { Metadata, Viewport } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import "../globals.css";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const BASE_URL = "https://www.shipforgood.org";

const OG_LOCALE: Record<string, string> = {
  es: "es_ES",
  ca: "ca_ES",
  en: "en_US",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export async function generateMetadata({ params }: Omit<Props, "children">): Promise<Metadata> {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "Metadata" });
  const ogLocale = OG_LOCALE[locale] ?? "es_ES";
  const alternateLocales = Object.values(OG_LOCALE).filter((l) => l !== ogLocale);

  return {
    metadataBase: new URL(BASE_URL),
    title: t("title"),
    description: t("description"),
    icons: {
      icon: "/logo-mini.svg",
      apple: "/logo-mini.svg",
    },
    alternates: {
      canonical: `/${locale}`,
      languages: {
        es: "/es",
        ca: "/ca",
        en: "/en",
      },
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `${BASE_URL}/${locale}`,
      siteName: "Ship For Good",
      locale: ogLocale,
      alternateLocale: alternateLocales,
      type: "website",
      images: [{ url: "/og.png", width: 1200, height: 630, alt: t("title") }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: ["/og.png"],
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <html lang={locale} className={`${serif.variable} ${pixel.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Event",
              name: "Ship For Good — 1ª Edición",
              startDate: "2026-05-29T18:00:00+02:00",
              endDate: "2026-05-30T21:00:00+02:00",
              eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
              eventStatus: "https://schema.org/EventScheduled",
              location: {
                "@type": "Place",
                name: "42 Barcelona",
                address: {
                  "@type": "PostalAddress",
                  streetAddress: "Carrer Albert Einstein 8-14",
                  addressLocality: "Barcelona",
                  postalCode: "08042",
                  addressCountry: "ES",
                },
              },
              organizer: {
                "@type": "Organization",
                name: "Software Crafters Barcelona",
                url: "https://softwarecrafters.barcelona/",
              },
              url: BASE_URL,
              image: `${BASE_URL}/og.png`,
              isAccessibleForFree: true,
              maximumAttendeeCapacity: 60,
            }),
          }}
        />
      </head>
      <body className="antialiased">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
