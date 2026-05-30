"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";

const COC_URL = "https://softwarecrafters.barcelona/coc.html";

export function CodeOfConduct() {
  const t = useTranslations("CodeOfConduct");

  return (
    <section id="code-of-conduct" className="py-24 sm:py-32">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h2 className="font-pixel text-4xl sm:text-5xl tracking-tight">
            {t("title")}
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          <p className="text-base text-foreground-muted leading-relaxed mb-6">
            {t("description")}
          </p>
          <a
            href={COC_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:underline"
          >
            {t("link_text")} →
          </a>
        </motion.div>
      </div>
    </section>
  );
}
