import budgets from "@/assets/topic-budgets.jpg";
import contracts from "@/assets/topic-contracts.jpg";
import grants from "@/assets/topic-grants.jpg";
import mobility from "@/assets/topic-mobility.jpg";
import habitatge from "@/assets/habitatge.png";
import cardNearby from "@/assets/card-nearby.jpg";
import cardTrending from "@/assets/card-trending.jpg";
import cardMissed from "@/assets/card-missed.jpg";
import logo from "@/assets/logo.png";
import featuredPressupost from "@/assets/featured/featured-pressupost.svg";
import featuredInfoparticipa from "@/assets/featured/featured-infoparticipa.svg";
import featuredSubvencions from "@/assets/featured/featured-subvencions.svg";
import featuredAltsCarrecs from "@/assets/featured/featured-alts-carrecs.svg";
import featuredMobilitat from "@/assets/featured/featured-mobilitat.svg";
import featuredEtica from "@/assets/featured/featured-etica.svg";

const IMAGE_MAP: Record<string, string> = {
  "topic-contracts": contracts,
  "topic-budgets": budgets,
  "topic-grants": grants,
  "topic-mobility": mobility,
  "topic-habitatge": habitatge,
  "card-nearby": cardNearby,
  "card-trending": cardTrending,
  "card-missed": cardMissed,
  logo,
  "featured-pressupost": featuredPressupost,
  "featured-infoparticipa": featuredInfoparticipa,
  "featured-subvencions": featuredSubvencions,
  "featured-alts-carrecs": featuredAltsCarrecs,
  "featured-mobilitat": featuredMobilitat,
  "featured-etica": featuredEtica,
};

export { logo };

export function imageForKey(key: string): string {
  return IMAGE_MAP[key] ?? contracts;
}

/** Punt de focus per `object-position` (evita retalls estranys segons la imatge). */
const FEATURED_IMAGE_KEYS = new Set([
  "featured-pressupost",
  "featured-infoparticipa",
  "featured-subvencions",
  "featured-alts-carrecs",
  "featured-mobilitat",
  "featured-etica",
]);

export function isFeaturedImageKey(key: string): boolean {
  return FEATURED_IMAGE_KEYS.has(key);
}

export function imageObjectPositionForKey(key: string): string {
  const positions: Record<string, string> = {
    "topic-habitatge": "center 22%",
    "topic-budgets": "center 32%",
    "topic-contracts": "center 28%",
    "topic-grants": "center 30%",
    "topic-mobility": "center 35%",
    "card-nearby": "center center",
    "card-trending": "center center",
    "card-missed": "center center",
    "featured-pressupost": "center 42%",
    "featured-infoparticipa": "center 38%",
    "featured-subvencions": "center 40%",
    "featured-alts-carrecs": "center 35%",
    "featured-mobilitat": "center 45%",
    "featured-etica": "center 40%",
  };
  return positions[key] ?? "center 30%";
}

export function formatDateCa(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("ca-ES", { day: "numeric", month: "long", year: "numeric" });
}
