import { useQuery } from "@tanstack/react-query";

import {
  getExampleQuestions,
  getFeatured,
  getNearby,
  getPopularTopics,
  getTopics,
} from "@/lib/api/aina.functions";
import { toPopularTopicView } from "@/data/popular-topics";
import {
  fallbackExampleQuestions,
  fallbackFeatured,
  fallbackNearby,
  fallbackPopularTopics,
  fallbackTopics,
} from "@/data/fallback";

async function withFallback<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch {
    return fallback;
  }
}

export function useExampleQuestions() {
  return useQuery({
    queryKey: ["aina", "example-questions"],
    queryFn: () => withFallback(() => getExampleQuestions(), fallbackExampleQuestions),
    staleTime: 60_000,
  });
}

export function useTopics() {
  return useQuery({
    queryKey: ["aina", "topics"],
    queryFn: () => withFallback(() => getTopics(), fallbackTopics),
    staleTime: 60_000,
  });
}

export function usePopularTopics() {
  return useQuery({
    queryKey: ["aina", "popular-topics"],
    queryFn: () =>
      withFallback(
        async () => (await getPopularTopics()).map(toPopularTopicView),
        fallbackPopularTopics,
      ),
    staleTime: 60_000,
  });
}

export function useFeatured() {
  return useQuery({
    queryKey: ["aina", "featured"],
    queryFn: () => withFallback(() => getFeatured(), fallbackFeatured),
    staleTime: 60_000,
  });
}

export function useNearby() {
  return useQuery({
    queryKey: ["aina", "nearby"],
    queryFn: () => withFallback(() => getNearby(), fallbackNearby),
    staleTime: 60_000,
  });
}
