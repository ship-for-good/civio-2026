"use client";

import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";

const EVENT_DATE = new Date("2026-05-29T00:00:00");

export function Footer() {
  const t = useTranslations("Footer");

  const closingText = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Math.ceil((EVENT_DATE.getTime() - today.getTime()) / 86400000);
    if (days > 0) return t("closing", { days });
    if (days === 0) return t("closingToday");
    return t("closingLive");
  }, [t]);
  return (
    <footer className="py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <p className="text-xs uppercase tracking-widest text-accent mb-6">
            {t("tagline")}
          </p>
          <p className="font-pixel text-3xl sm:text-4xl md:text-5xl tracking-tight mb-8 max-w-2xl mx-auto">
            {closingText}
          </p>

          <span className="inline-flex items-center gap-2 bg-foreground-muted/15 text-foreground-muted px-8 py-3.5 rounded-full text-sm font-medium cursor-default">
            {t("registrationsClosed")}
          </span>
        </motion.div>

        <div className="border-t border-border pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-foreground-muted">
          <p>
            <span className="font-pixel text-foreground text-sm">Ship For Good</span>{" "}
            · Barcelona, {t("year")}
          </p>

          <div className="flex items-center gap-4">
            <a
              href="mailto:info@softwarecrafters.barcelona"
              className="text-foreground-muted hover:text-foreground transition-colors"
              aria-label="Email"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </a>
            <a
              href="https://x.com/bcnswcraft"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground-muted hover:text-foreground transition-colors"
              aria-label="X (Twitter)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://bsky.app/profile/bcnswcraft.bsky.social"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground-muted hover:text-foreground transition-colors"
              aria-label="Bluesky"
            >
              <svg width="18" height="18" viewBox="0 0 568 501" fill="currentColor">
                <path d="M123.121 33.664C188.241 82.553 258.281 181.68 284 234.873c25.719-53.192 95.759-152.32 160.879-201.21C491.866-1.611 568-28.906 568 57.947c0 17.346-9.945 145.713-15.778 166.555-20.275 72.453-94.155 90.933-159.875 79.748C507.222 323.8 536.444 388.56 473.333 453.32c-119.86 122.992-172.272-30.859-185.702-70.281-2.462-7.227-3.614-10.608-3.631-7.733-.017-2.875-1.169.506-3.631 7.733-13.43 39.422-65.842 193.273-185.702 70.281-63.111-64.76-33.889-129.52 80.986-149.071-65.72 11.185-139.6-7.295-159.875-79.748C10.945 203.659 1 75.291 1 57.946 1-28.91 76.135-1.612 123.121 33.664z" />
              </svg>
            </a>
            <a
              href="https://www.linkedin.com/company/software-crafters-barcelona"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground-muted hover:text-foreground transition-colors"
              aria-label="LinkedIn"
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
            </a>
          </div>

          <p>
            {t("collaboration_prefix")}{" "}
            <a href="https://www.42barcelona.com/es/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              42 Barcelona
            </a>
            {", "}
            <a href="https://civio.es/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              Fundación Civio
            </a>
            {` ${t("collaboration_and")} `}
            <a href="https://softwarecrafters.barcelona/" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
              Software Crafters Barcelona
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
