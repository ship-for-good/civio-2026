"use client";

import { asset } from "@/lib/asset";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

const EVENT_DATE = new Date("2026-05-29T00:00:00");

const partners = [
  { name: "Civio", logo: "/civio-logo.svg", url: "https://civio.es/", width: 150 },
  { name: "42Barcelona", logo: "/42-barcelona-logo.png", url: "https://www.42barcelona.com/es/", width: 150 },
  { name: "Software Crafters Barcelona", logo: "/sbcn-logo.svg", url: "https://softwarecrafters.barcelona/", width: 80 },
];

const container = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.3,
    },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] as const },
  },
} as const;

export function Hero() {
  const t = useTranslations("Hero");

  const subtext = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Math.ceil((EVENT_DATE.getTime() - today.getTime()) / 86400000);
    if (days > 0) return t("registrationsClosedSubtext", { days });
    if (days === 0) return t("registrationsClosedSubtextToday");
    return t("registrationsClosedSubtextLive");
  }, [t]);

  return (
    <section className="min-h-[90vh] flex items-center justify-center pt-16">
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto px-6 text-center"
      >
        <motion.div variants={fadeUp} className="mb-6">
          <span className="text-sm tracking-widest text-accent font-medium">
            {t("tagline")}
          </span>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          className="font-pixel tracking-tight max-w-3xl mx-auto mb-8"
        >
          <span className="block text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-tight mb-4">
            {t("headline_top")}
          </span>
          <span className="block text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight">
            {t("headline_bottom")}
          </span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          className="text-lg sm:text-xl text-foreground-muted max-w-2xl mx-auto leading-relaxed mb-6"
        >
          {t("subheadline")}
        </motion.p>

        <motion.div variants={fadeUp} className="flex flex-col items-center gap-3">
          <span className="inline-flex items-center gap-2 bg-foreground-muted/15 text-foreground-muted px-8 py-3.5 rounded-full text-sm font-medium cursor-default">
            {t("registrationsClosed")}
          </span>
          <p className="text-sm text-foreground-muted/80 max-w-sm">
            {subtext}
          </p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          className="flex items-center justify-center gap-10 mt-10 flex-wrap"
        >
          {partners.map((partner) => (
            <a
              key={partner.name}
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:opacity-70 transition-opacity"
            >
              <img
                src={asset(partner.logo)}
                alt={partner.name}
                style={{ width: `${partner.width}px`, height: "auto" }}
              />
            </a>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}
