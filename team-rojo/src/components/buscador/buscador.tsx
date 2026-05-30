"use client";

import { useState } from "react";
import { motion } from "motion/react";
import type { Classification } from "@/domain/buscador/types";
import { SearchInput } from "./search-input";
import { QueryChips } from "./query-chips";
import { ResultCard } from "./result-card";

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] as const },
  },
} as const;

type ViewState = "idle" | "loading" | "result" | "error";

type ClassifyApiResponse = {
  classification: Classification;
  source?: string;
  warning?: string;
  error?: string;
};

export function Buscador() {
  const [view, setView] = useState<ViewState>("idle");
  const [result, setResult] = useState<Classification | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleQuery(query: string) {
    setView("loading");
    setErrorMessage(null);

    try {
      const response = await fetch("/api/buscador/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(
          payload.error ??
            "No se pudo clasificar. Comprueba CURSOR_API_KEY en .env.local y npm run dev."
        );
      }

      const data = (await response.json()) as ClassifyApiResponse;
      setResult(data.classification);
      setView("result");
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Error al clasificar. Usa npm run dev con CURSOR_API_KEY."
      );
      setView("error");
    }
  }

  function handleReset() {
    setResult(null);
    setErrorMessage(null);
    setView("idle");
  }

  const isLoading = view === "loading";

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-16">
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="w-full max-w-2xl flex flex-col gap-8"
      >
        <motion.div variants={fadeUp} className="text-center">
          <h1 className="font-pixel text-4xl sm:text-5xl tracking-tight text-foreground mb-4">
            ¿Dónde está esa información pública?
          </h1>
          <p className="text-lg text-foreground-muted leading-relaxed">
            Pregunta en lenguaje normal. Te decimos el portal correcto y cómo encontrarlo.
          </p>
        </motion.div>

        <motion.div variants={fadeUp}>
          <SearchInput onSubmit={handleQuery} disabled={isLoading} />
        </motion.div>

        {isLoading && (
          <motion.p
            variants={fadeUp}
            className="text-center text-foreground-muted"
            role="status"
            aria-live="polite"
          >
            Clasificando con el agente…
          </motion.p>
        )}

        {view === "error" && errorMessage !== null && (
          <motion.div variants={fadeUp} className="text-center space-y-3">
            <p className="text-foreground-muted">{errorMessage}</p>
            <button
              type="button"
              onClick={handleReset}
              className="text-sm text-accent hover:underline"
            >
              Volver a intentar
            </button>
          </motion.div>
        )}

        {view === "idle" && (
          <motion.div variants={fadeUp}>
            <QueryChips onPick={handleQuery} disabled={isLoading} />
          </motion.div>
        )}

        {view === "result" && result !== null && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <ResultCard data={result} onReset={handleReset} />
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
