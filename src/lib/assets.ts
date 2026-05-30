import budgets from "@/assets/topic-budgets.jpg";
import contracts from "@/assets/topic-contracts.jpg";
import grants from "@/assets/topic-grants.jpg";
import mobility from "@/assets/topic-mobility.jpg";

const IMAGE_MAP: Record<string, string> = {
  "topic-contracts": contracts,
  "topic-budgets": budgets,
  "topic-grants": grants,
  "topic-mobility": mobility,
};

export function imageForKey(key: string): string {
  return IMAGE_MAP[key] ?? contracts;
}

export function formatDateCa(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ca-ES", { day: "numeric", month: "long", year: "numeric" });
}
