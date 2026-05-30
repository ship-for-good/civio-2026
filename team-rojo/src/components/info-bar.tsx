"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";

export function InfoBar() {
  const t = useTranslations("InfoBar");

  const items = [
    { label: t("whenLabel"), value: t("whenValue") },
    { label: t("whereLabel"), value: t("whereValue"), href: "https://www.42barcelona.com/es/" },
    { label: t("formatLabel"), value: t("formatValue") },
  ];

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.8 }}
      className="max-w-6xl mx-auto px-6 py-16 -mt-16"
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 border border-border rounded-2xl divide-y sm:divide-y-0 sm:divide-x divide-border">
        {items.map((item) => (
          <div key={item.label} className="px-8 py-6 text-center">
            <p className="text-xs uppercase tracking-widest text-foreground-muted mb-2">
              {item.label}
            </p>
            <p className="text-base font-medium whitespace-pre-line">
              {item.href ? (
                <a href={item.href} target="_blank" rel="noopener noreferrer" className="hover:text-accent transition-colors">
                  {item.value}
                </a>
              ) : item.value}
            </p>
          </div>
        ))}
      </div>
    </motion.section>
  );
}
