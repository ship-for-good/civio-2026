"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";

export function Schedule() {
  const t = useTranslations("Schedule");

  const days = [
    {
      title: t("day1_title"),
      time: t("day1_time"),
      description: t("day1_description"),
    },
    {
      title: t("day2_title"),
      time: t("day2_time"),
      description: t("day2_description"),
    },
  ];

  return (
    <section id="schedule" className="py-24 sm:py-32 bg-background-alt">
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
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-16"
        >
          <p className="text-base text-foreground-muted leading-relaxed max-w-4xl">
            {t("intro_description")}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {days.map((day, dayIndex) => (
            <motion.div
              key={day.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: dayIndex * 0.15 }}
              className="bg-background border border-border rounded-2xl p-8"
            >
              <div className="mb-6">
                <h3 className="font-pixel text-2xl sm:text-3xl mb-1">{day.title}</h3>
                <p className="text-sm font-mono text-accent">{day.time}</p>
              </div>
              <p className="text-base text-foreground-muted leading-relaxed">
                {day.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
