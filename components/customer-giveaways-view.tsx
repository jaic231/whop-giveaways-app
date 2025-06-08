"use client";

import { useState, useEffect } from "react";
import { GiveawayCard } from "./giveaway-card";
import { useCompanyStore } from "@/lib/stores/company-store";
import { useGiveaways } from "@/lib/hooks/use-giveaways";
import { GiveawayHistoryDialog } from "./giveaway-history-dialog";
import { Button } from "./ui/button";
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
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const {
    activeGiveaways,
    endedGiveaways,
    loading,
    error,
    refresh,
    fetchGiveaways,
  } = useGiveaways(currentUser.id);

  // Use Zustand store for company/experience context
  const { experienceId, companyId, initializeFromUrl } = useCompanyStore();

  useState(() => {
    initializeFromUrl();
  });

  // Show loading state while initializing company context
  if (loading) {
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
  if (error) {
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
          <p className="text-red-600 mb-4">{error}</p>
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
              <p className="text-gray-600 mt-1">
                Welcome, {currentUser.name || currentUser.username}! Join a
                giveaway for a chance to win.
              </p>

              {/* Experience and Company Info */}
              <div className="text-xs text-gray-400 mt-2 space-y-1">
                <div>Experience ID: {experienceId || "N/A"}</div>
                <div>Company ID: {companyId || "N/A"}</div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={() => setIsHistoryOpen(true)}>
                View History
              </Button>
              <button
                onClick={refresh}
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
                    d="M4 4v5h5M20 20v-5h-5"
                  ></path>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 9a9 9 0 0115-2.73M20 15a9 9 0 01-15 2.73"
                  ></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Giveaways List */}
        {activeGiveaways.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {activeGiveaways.map((giveaway) => (
              <GiveawayCard
                key={giveaway.id}
                giveaway={giveaway}
                onUpdate={fetchGiveaways}
                currentUserId={currentUser.id}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-800">
              No Active Giveaways
            </h3>
            <p className="text-gray-500 mt-2">
              Check back later for more opportunities to win!
            </p>
          </div>
        )}
      </div>

      <GiveawayHistoryDialog
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={endedGiveaways}
        currentUserId={currentUser.id}
      />
    </div>
  );
}
