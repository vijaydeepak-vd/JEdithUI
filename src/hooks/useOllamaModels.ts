"use client";

import useSWR from "swr";
import type { OllamaModelWithBadges, OllamaStatus } from "@/types";

interface ModelsResponse {
  models: OllamaModelWithBadges[];
  status: OllamaStatus;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useOllamaModels() {
  const { data, error, isLoading, mutate } = useSWR<ModelsResponse>(
    "/api/models",
    fetcher,
    {
      refreshInterval: 30000, // Refresh every 30s
      revalidateOnFocus: false,
    }
  );

  const models = data?.models || [];
  const status = data?.status || { connected: false, modelCount: 0, defaultModel: null };

  const visionModels = models.filter((m) => m.isVision);
  const defaultModel = models.find((m) => m.badges.includes("recommended")) || models[0];

  return {
    models,
    visionModels,
    status,
    defaultModel,
    isLoading,
    error,
    refresh: mutate,
  };
}
