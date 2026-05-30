import { useCallback, useState } from "react";
import catalog from "@/data/catalog.json";
import { processAskQuery } from "@/lib/matching";
import type { AskResponse, Catalog } from "@/types";

const MOCK_DELAY_MS = 700;

export function useAskAssistant() {
  const [loading, setLoading] = useState(false);

  const ask = useCallback(async (query: string): Promise<AskResponse> => {
    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
      return processAskQuery(query, catalog as Catalog);
    } finally {
      setLoading(false);
    }
  }, []);

  return { ask, loading };
}
