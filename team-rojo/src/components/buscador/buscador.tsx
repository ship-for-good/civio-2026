"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { classify } from "@/domain/buscador/classify";
import type { Classification } from "@/domain/buscador/types";
import { SearchInput } from "./search-input";
import { QueryChips } from "./query-chips";
import { ResultCard } from "./result-card";

// Animation variants — reused from the existing brand motion pattern
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

// State machine: idle → result
// classify() is synchronous so no loading/error network states are needed here.
// NOTE: when an async classifier replaces classify(), add "loading" and "error"
// states to this machine (the boundary contract — Classification — stays the same).

export function Buscador() {
  const [result, setResult] = useState<Classification | null>(null);

  function handleQuery(query: string) {
    setResult(classify(query));
  }

  function handleReset() {
    setResult(null);
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-6 py-16">
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="w-full max-w-2xl flex flex-col gap-8"
      >
        {/* Header */}
        <motion.div variants={fadeUp} className="text-center">
          <h1 className="font-pixel text-4xl sm:text-5xl tracking-tight text-foreground mb-4">
            ¿Dónde está esa información pública?
          </h1>
          <p className="text-lg text-foreground-muted leading-relaxed">
            Pregunta en lenguaje normal. Te decimos el portal correcto y cómo encontrarlo.
          </p>
        </motion.div>

        {/* Search input — always visible */}
        <motion.div variants={fadeUp}>
          <SearchInput onSubmit={handleQuery} />
        </motion.div>

        {/* Conditional content: idle → chips, result → result card */}
        {result === null ? (
          <motion.div variants={fadeUp}>
            <QueryChips onPick={handleQuery} />
          </motion.div>
        ) : (
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
