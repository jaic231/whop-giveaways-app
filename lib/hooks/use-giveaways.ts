"use client";

import { useState, useEffect, useCallback } from "react";
import { useCompanyStore } from "@/lib/stores/company-store";
import type { GiveawayWithStats } from "@/lib/types";

export function useGiveaways(currentUserId: string) {
  const [giveaways, setGiveaways] = useState<GiveawayWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { companyId, isLoading: companyLoading } = useCompanyStore();

  const fetchGiveaways = useCallback(async () => {
    if (!companyId) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append("userId", currentUserId);
      params.append("companyId", companyId);

      const response = await fetch(`/api/giveaways?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch giveaways");
      }
      const data = await response.json();
      setGiveaways(data.giveaways);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  }, [companyId, currentUserId]);

  useEffect(() => {
    if (companyId) {
      fetchGiveaways();
    }
  }, [companyId, fetchGiveaways, refreshKey]);

  const refresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const activeGiveaways = giveaways.filter((g) => g.status === "ACTIVE");
  const endedGiveaways = giveaways.filter((g) => g.status === "COMPLETED");

  return {
    activeGiveaways,
    endedGiveaways,
    loading: loading || companyLoading,
    error,
    refresh,
    fetchGiveaways,
  };
}
