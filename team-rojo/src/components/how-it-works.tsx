"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";

const container = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
  },
} as const;

const BENEFIT_KEYS = [
  "benefit_0",
  "benefit_1",
  "benefit_2",
  "benefit_3",
  "benefit_4",
  "benefit_5",
] as const;

export function HowItWorks() {
  const t = useTranslations("HowItWorks");

  return (
    <section id="how-it-works" className="py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-16"
        >
          <h2 className="font-pixel text-4xl sm:text-5xl tracking-tight">
            {t("title")}
          </h2>
        </motion.div>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-20"
        >
          {BENEFIT_KEYS.map((key, index) => (
            <motion.div
              key={key}
              variants={fadeUp}
              className="group border border-border rounded-2xl p-6 hover:border-accent/30 transition-colors"
            >
              <span className="text-sm font-mono text-accent mb-4 block">
                {String(index + 1).padStart(2, "0")}
              </span>
              <p className="text-base text-foreground-muted leading-relaxed">
                {t(key)}
              </p>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="border-t border-border pt-12"
        >
          <h3 className="font-pixel text-2xl sm:text-3xl tracking-tight mb-4">
            {t("who_title")}
          </h3>
          <div className="text-base text-foreground-muted leading-relaxed">
            <p className="max-w-4xl">{t("who_description")}</p>
            <p className="mt-2 whitespace-nowrap">{t("who_tagline")}</p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
