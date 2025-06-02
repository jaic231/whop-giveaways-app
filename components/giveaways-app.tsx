"use client";

import { useState, useEffect } from "react";
import { CreateGiveawayForm } from "./create-giveaway-form";
import { GiveawaysList } from "./giveaways-list";
import { useCompanyStore } from "@/lib/stores/company-store";
import type { GiveawayWithStats } from "@/lib/types";

interface CurrentUser {
  id: string;
  name: string | null;
  username: string;
  isAdmin: boolean;
}

interface GiveawaysAppProps {
  currentUser: CurrentUser;
}

export function GiveawaysApp({ currentUser }: GiveawaysAppProps) {
  const [view, setView] = useState<"list" | "create">("list");
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
      setGiveaways(data.giveaways);
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

  const handleGiveawayCreated = () => {
    setView("list");
    setRefreshKey((prev) => prev + 1); // Trigger refresh
  };

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
                <div className="h-8 bg-gray-200 rounded-md w-48 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded-md w-64 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded-md w-40 animate-pulse"></div>
                <div className="space-y-1 mt-2">
                  <div className="h-3 bg-gray-200 rounded-md w-32 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded-md w-28 animate-pulse"></div>
                </div>
              </div>
              <div className="h-10 bg-gray-200 rounded-lg w-36 animate-pulse"></div>
            </div>
          </div>

          {/* Content Skeleton */}
          <div className="space-y-6">
            {/* Stats Cards Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse"
                >
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                </div>
              ))}
            </div>

            {/* Giveaways List Skeleton */}
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2 flex-1">
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                    </div>
                    <div className="h-6 bg-gray-200 rounded w-20 ml-4"></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-3 bg-gray-200 rounded w-32"></div>
                    </div>
                    <div className="h-9 bg-gray-200 rounded w-24"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Loading Indicator Overlay */}
          <div className="fixed bottom-8 right-8">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 flex items-center space-x-3">
              <div className="relative">
                <div className="w-6 h-6 border-2 border-blue-200 rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-6 h-6 border-2 border-blue-600 rounded-full animate-spin border-t-transparent"></div>
              </div>
              <div className="text-sm">
                <div className="font-medium text-gray-900">Initializing</div>
                <div className="text-gray-500">
                  Loading workspace context...
                </div>
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Giveaways</h1>
              <p className="text-gray-600 mt-1">
                Create and manage prize competitions
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Welcome, {currentUser.name || currentUser.username} (Admin)
              </p>

              {/* Experience and Company Info */}
              <div className="text-xs text-gray-400 mt-2 space-y-1">
                <div>Experience ID: {experienceId || "N/A"}</div>
                <div>Company ID: {companyId || "N/A"}</div>
              </div>
            </div>

            {currentUser.isAdmin && view === "list" && (
              <button
                onClick={() => setView("create")}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Create Giveaway
              </button>
            )}

            {currentUser.isAdmin && view === "create" && (
              <button
                onClick={() => setView("list")}
                className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                Back to List
              </button>
            )}
          </div>
        </div>

        {/* Content */}
        {view === "create" ? (
          <CreateGiveawayForm
            experienceId={experienceId!}
            companyId={companyId!}
          />
        ) : (
          <GiveawaysList
            giveaways={giveaways}
            currentUserId={currentUser.id}
            loading={loading}
            onRefresh={handleRefresh}
          />
        )}
      </div>
    </div>
  );
}
