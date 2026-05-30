"use client";

import { useState } from "react";

const CATEGORIES = [
  {
    label: "Sueldos y cargos",
    queries: [
      "Sueldo de una ministra",
      "Retribución de altos cargos del Estado",
      "Cuánto cobra un secretario de estado",
    ],
  },
  {
    label: "Contratos",
    queries: [
      "Contratos del Ministerio de Hacienda",
      "Obras públicas adjudicadas por el Estado",
      "Contratos de servicios del Ministerio de Sanidad",
    ],
  },
  {
    label: "Subvenciones",
    queries: [
      "Subvenciones recibidas por una empresa",
      "Ayudas públicas a una ONG",
      "Fondos europeos gestionados por el Estado",
    ],
  },
  {
    label: "Bienes de políticos",
    queries: [
      "Patrimonio declarado de un diputado",
      "Bienes de un ministro",
      "Declaración de actividades de un alto cargo",
    ],
  },
  {
    label: "Normativa",
    queries: [
      "Texto de la Ley de Transparencia",
      "Reales decretos del Ministerio de Hacienda",
      "Convenios firmados por el Estado",
    ],
  },
  {
    label: "Casa Real",
    queries: [
      "Presupuesto de la Casa Real",
      "Actividades oficiales del Rey",
      "Retribuciones de la Familia Real",
    ],
  },
  {
    label: "Organismos públicos",
    queries: [
      "Estructura del Ministerio de Sanidad",
      "Personal del Ministerio de Educación",
      "Organigrama de una agencia estatal",
    ],
  },
  {
    label: "Pedir información",
    queries: [
      "Pedir documentos al Ministerio de Hacienda",
      "Solicitar información al Ministerio de Sanidad",
      "Pedir acceso a expedientes del Ministerio de Justicia",
    ],
  },
];

type QueryChipsProps = {
  onPick: (query: string) => void;
  disabled?: boolean;
};

export function QueryChips({ onPick, disabled = false }: QueryChipsProps) {
  const [selected, setSelected] = useState<number | null>(null);

  if (selected !== null) {
    const category = CATEGORIES[selected];
    return (
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="flex items-center gap-1 text-xs text-white/60 hover:text-white/90 transition-colors w-fit"
        >
          ← {category.label}
        </button>
        <div className="flex flex-wrap gap-2">
          {category.queries.map((query) => (
            <button
              key={query}
              type="button"
              disabled={disabled}
              onClick={() => onPick(query)}
              className="px-4 py-2 rounded-full border border-white/40 text-sm text-white/90 hover:bg-white/20 transition-colors disabled:opacity-60"
            >
              {query}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {CATEGORIES.map((cat, i) => (
        <button
          key={cat.label}
          type="button"
          disabled={disabled}
          onClick={() => setSelected(i)}
          className="px-4 py-2 rounded-full border border-white/40 text-sm text-white/80 hover:bg-white/20 transition-colors disabled:opacity-60"
        >
          {cat.label}
        </button>
      ))}
    </div>
  );
}
