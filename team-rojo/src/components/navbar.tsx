"use client";

import { asset } from "@/lib/asset";
import { Link, usePathname } from "@/i18n/navigation";
import { Locale } from "@/i18n/routing";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

const locales: Locale[] = ["es", "ca", "en"];

const NAV_SECTIONS = ["schedule", "how-it-works", "nos-ayudan", "faq", "code-of-conduct"] as const;

export function Navbar() {
  const t = useTranslations("Navbar");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-40% 0px -55% 0px" }
    );

    for (const id of NAV_SECTIONS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, []);

  const navLinkClass = (sectionId: string) =>
    `text-sm transition-colors hidden sm:block ${
      activeSection === sectionId
        ? "text-foreground font-medium"
        : "text-foreground-muted hover:text-foreground"
    }`;

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border"
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <img
            src={asset("/logo.svg")}
            alt={t("logo_alt")}
            height={36}
            style={{ height: "36px", width: "auto" }}
          />
        </Link>

        <div className="flex items-center gap-6">
          <a href="#schedule" className={navLinkClass("schedule")}>
            {t("schedule")}
          </a>
          <a href="#how-it-works" className={navLinkClass("how-it-works")}>
            {t("howItWorks")}
          </a>
          <a href="#nos-ayudan" className={navLinkClass("nos-ayudan")}>
            {t("partners")}
          </a>
          <a href="#faq" className={navLinkClass("faq")}>
            {t("faq")}
          </a>
          <a href="#code-of-conduct" className={navLinkClass("code-of-conduct")}>
            {t("codeOfConduct")}
          </a>

          <div className="flex items-center rounded-full border border-border p-1">
            {locales.map((switchLocale) => {
              const isActive = locale === switchLocale;

              return (
                <Link
                  key={switchLocale}
                  href={pathname}
                  locale={switchLocale}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-accent text-white"
                      : "text-foreground-muted hover:text-foreground"
                  }`}
                >
                  {t(`language.${switchLocale}`)}
                </Link>
              );
            })}
          </div>

          <span className="text-sm font-medium bg-foreground-muted/20 text-foreground-muted px-4 py-2 rounded-full cursor-default">
            {t("registrationsClosed")}
          </span>
        </div>
      </div>
    </motion.nav>
  );
}
