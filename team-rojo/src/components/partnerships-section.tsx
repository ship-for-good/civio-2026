"use client";

import { asset } from "@/lib/asset";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";

interface PartnerCardProps {
  href: string;
  logoSrc: string;
  logoAlt: string;
  logoWidth: number;
  title: string;
  description: React.ReactNode;
  quote?: React.ReactNode;
  delay?: number;
}

function PartnerCard({ href, logoSrc, logoAlt, logoWidth, title, description, quote, delay = 0 }: PartnerCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay }}
      className="flex flex-col md:flex-row items-center gap-12 bg-background border border-border rounded-2xl p-10 sm:p-14"
    >
      <div className="shrink-0 md:w-[160px] flex items-center justify-center">
        <a href={href} target="_blank" rel="noopener noreferrer">
          <img
            src={logoSrc}
            alt={logoAlt}
            style={{ width: `${logoWidth}px`, height: "auto" }}
          />
        </a>
      </div>
      <div className="flex-1">
        <p className="text-xs uppercase tracking-widest text-accent mb-4">
          <a href={href} target="_blank" rel="noopener noreferrer" className="hover:underline">
            {title}
          </a>
        </p>
        <p className="text-base text-foreground-muted leading-relaxed mb-6">{description}</p>
        {quote && (
          <blockquote className="border-l-2 border-accent pl-4 text-sm font-medium">
            "{quote}"
          </blockquote>
        )}
      </div>
    </motion.div>
  );
}

interface LogoGridProps {
  logos: { href: string; src: string; alt: string; width: number }[];
}

function LogoGrid({ logos }: LogoGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {logos.map((logo, i) => (
        <motion.a
          key={logo.alt}
          href={logo.href}
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, delay: i * 0.1 }}
          className="aspect-square flex items-center justify-center bg-background border border-border rounded-2xl p-8 hover:opacity-80 transition-opacity"
        >
          <img src={logo.src} alt={logo.alt} style={{ width: `${logo.width}px`, height: "auto" }} />
        </motion.a>
      ))}
    </div>
  );
}

interface SubsectionProps {
  label: string;
  children: React.ReactNode;
  delay?: number;
}

function Subsection({ label, children, delay = 0 }: SubsectionProps) {
  return (
    <div className="space-y-6">
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.5, delay }}
        className="text-xs uppercase tracking-widest text-foreground-muted"
      >
        {label}
      </motion.p>
      {children}
    </div>
  );
}

export function PartnershipsSection() {
  const t = useTranslations("CivioSection");

  return (
    <>
      <section id="nos-ayudan" className="py-24 sm:py-32 bg-background-alt">
        <div className="max-w-6xl mx-auto px-6 space-y-16">
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

          <Subsection label={t("sponsors_subtitle")}>
            <LogoGrid logos={[
              { href: "https://www.getmanfred.com/", src: asset("/manfred-logo.svg"), alt: "Manfred", width: 140 },
              { href: "https://qualityclouds.ai/", src: asset("/qualityclouds-logo.webp"), alt: "QualityClouds", width: 200 },
              { href: "https://www.plainconcepts.com/", src: asset("/plain-concepts-logo.svg"), alt: "Plain Concepts", width: 130 },
              { href: "https://www.nextdigital.es/", src: asset("/next-digital-logo.svg"), alt: "Next Digital", width: 180 },
            ]} />
          </Subsection>

          <Subsection label={t("apoyan_subtitle")} delay={0.1}>
            <LogoGrid logos={[
              { href: "https://lovable.dev/", src: asset("/lovable-logo.png"), alt: "Lovable", width: 130 },
              { href: "https://cursor.com/", src: asset("/cursor-logo.svg"), alt: "Cursor", width: 130 },
              { href: "https://falca.com/", src: asset("/falca-logo.jpg"), alt: "Falca", width: 130 },
            ]} />
          </Subsection>
        </div>
      </section>

      <section className="py-24 sm:py-32 bg-background">
        <div className="max-w-6xl mx-auto px-6 space-y-8">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="font-pixel text-4xl sm:text-5xl tracking-tight"
          >
            {t("organizan_subtitle")}
          </motion.h2>
          <PartnerCard
            href="https://civio.es/"
            logoSrc={asset("/civio-logo.svg")}
            logoAlt={t("civio_alt")}
            logoWidth={160}
            title={t("civio_title")}
            description={t.rich("civio_description", {
              civio: (chunks) => (
                <a href="https://civio.es/" target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {chunks}
                </a>
              ),
            })}
            quote={t("quote")}
          />
          <PartnerCard
            href="https://www.42barcelona.com/es/"
            logoSrc={asset("/42-barcelona-logo.png")}
            logoAlt="42Barcelona"
            logoWidth={150}
            title={t("venue_title")}
            description={t("venue_description")}
            delay={0.1}
          />
          <PartnerCard
            href="https://softwarecrafters.barcelona/"
            logoSrc={asset("/sbcn-logo.svg")}
            logoAlt="Software Crafters Barcelona"
            logoWidth={120}
            title={t("supporter_title")}
            description={t("supporter_description")}
            delay={0.2}
          />
        </div>
      </section>
    </>
  );
}
