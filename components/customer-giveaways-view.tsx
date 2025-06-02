"use client";

import { useState, useEffect } from "react";
import { GiveawayCard } from "./giveaway-card";
import { useCompanyStore } from "@/lib/stores/company-store";
import type { GiveawayWithStats } from "@/lib/types";

interface CurrentUser {
  id: string;
  name: string | null;
  username: string;
  isAdmin: boolean;
}

interface CustomerGiveawaysViewProps {
  currentUser: CurrentUser;
}

export function CustomerGiveawaysView({
  currentUser,
}: CustomerGiveawaysViewProps) {
  const [giveaways, setGiveaways] = useState<GiveawayWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // Use Zustand store for company/experience context
  const {
    experienceId,
    companyId,
    isLoading: companyLoading,
    error: companyError,
    initializeFromUrl,
  } = useCompanyStore();

  const fetchGiveaways = async () => {
    if (!companyId) return; // Don't fetch without company ID

    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append("userId", currentUser.id);
      params.append("companyId", companyId);

      const response = await fetch(`/api/giveaways?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch giveaways");
      }
      const data = await response.json();
      // Filter to only show active giveaways for customers
      const activeGiveaways = data.giveaways.filter(
        (g: GiveawayWithStats) => g.status === "ACTIVE"
      );
      setGiveaways(activeGiveaways);
    } catch (error) {
      console.error("Failed to fetch giveaways:", error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize company context on mount
  useEffect(() => {
    initializeFromUrl();
  }, [initializeFromUrl]);

  // Fetch giveaways when company ID becomes available
  useEffect(() => {
    if (companyId) {
      fetchGiveaways();
    }
  }, [companyId, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  // Show loading state while initializing company context
  if (companyLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <div className="h-8 bg-gray-200 rounded-md w-56 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded-md w-48 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded-md w-36 animate-pulse"></div>
                <div className="space-y-1 mt-2">
                  <div className="h-3 bg-gray-200 rounded-md w-32 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded-md w-28 animate-pulse"></div>
                </div>
              </div>
              <div className="h-10 w-10 bg-gray-200 rounded-md animate-pulse"></div>
            </div>
          </div>

          {/* Giveaway Cards Grid Skeleton */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse"
              >
                {/* Card Header */}
                <div className="p-6 pb-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-5 bg-gray-200 rounded-full w-16"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="px-6 pb-4">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="text-center">
                      <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                      <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto"></div>
                    </div>
                    <div className="text-center">
                      <div className="h-4 bg-gray-200 rounded w-full mb-1"></div>
                      <div className="h-6 bg-gray-200 rounded w-2/3 mx-auto"></div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-xs mb-1">
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                      <div className="h-3 bg-gray-200 rounded w-12"></div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2"></div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="px-6 pb-6">
                  <div className="h-10 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Loading Indicator Overlay */}
          <div className="fixed bottom-8 right-8">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 flex items-center space-x-3">
              <div className="relative">
                <div className="w-6 h-6 border-2 border-blue-200 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-6 h-6 border-2 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
              </div>
              <div className="text-sm">
                <div className="font-medium text-gray-900">Connecting</div>
                <div className="text-gray-500">Finding your giveaways...</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if failed to load company context
  if (companyError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Failed to Load Context
          </h3>
          <p className="text-red-600 mb-4">{companyError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse"
              >
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Active Giveaways
              </h1>
              <p className="text-gray-600 mt-1">Join live prize competitions</p>
              <p className="text-sm text-gray-500 mt-1">
                Welcome, {currentUser.name || currentUser.username}
              </p>

              {/* Experience and Company Info */}
              <div className="text-xs text-gray-400 mt-2 space-y-1">
                <div>Experience ID: {experienceId || "N/A"}</div>
                <div>Company ID: {companyId || "N/A"}</div>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              className="text-gray-600 hover:text-gray-900 p-2 rounded-md hover:bg-gray-100 transition-colors"
              title="Refresh"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        {giveaways.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <svg
                className="w-12 h-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No active giveaways
            </h3>
            <p className="text-gray-600 mb-6">
              Check back later for new prize competitions!
            </p>
            <button
              onClick={handleRefresh}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Refresh
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {giveaways.map((giveaway) => (
              <GiveawayCard
                key={giveaway.id}
                giveaway={giveaway}
                currentUserId={currentUser.id}
                onUpdate={handleRefresh}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
