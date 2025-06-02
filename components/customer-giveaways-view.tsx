"use client";

import { useState, useEffect } from "react";
import { GiveawayCard } from "./giveaway-card";
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

  // Experience and company info
  const [experienceId, setExperienceId] = useState<string>("");
  const [companyId, setCompanyId] = useState<string>("");
  const [companyInfoLoading, setCompanyInfoLoading] = useState(true);

  const fetchGiveaways = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/giveaways?userId=${currentUser.id}`);
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

  const fetchExperienceAndCompanyInfo = async () => {
    try {
      setCompanyInfoLoading(true);

      // Get experience ID from URL
      const experienceIdFromUrl = window.location.pathname.split("/")[2];
      setExperienceId(experienceIdFromUrl);

      // Fetch company ID from experience
      const response = await fetch(
        `/api/experience/${experienceIdFromUrl}/company`
      );
      if (response.ok) {
        const data = await response.json();
        setCompanyId(data.companyId);
      }
    } catch (error) {
      console.error("Failed to fetch experience/company info:", error);
    } finally {
      setCompanyInfoLoading(false);
    }
  };

  useEffect(() => {
    fetchGiveaways();
    fetchExperienceAndCompanyInfo();
  }, [refreshKey]);

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

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
                <div>Experience ID: {experienceId || "Loading..."}</div>
                {companyInfoLoading ? (
                  <div>Company ID: Loading...</div>
                ) : (
                  <div>Company ID: {companyId || "N/A"}</div>
                )}
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
