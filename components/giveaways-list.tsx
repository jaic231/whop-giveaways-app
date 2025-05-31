"use client";

import { useState, useEffect } from "react";
import { GiveawayCard } from "./giveaway-card";
import type { GiveawayWithStats } from "@/lib/types";

interface GiveawaysListProps {
  giveaways: GiveawayWithStats[];
  currentUserId: string;
  loading: boolean;
  onRefresh: () => void;
}

export function GiveawaysList({
  giveaways,
  currentUserId,
  loading,
  onRefresh,
}: GiveawaysListProps) {
  const [filter, setFilter] = useState<
    "all" | "upcoming" | "active" | "completed"
  >("all");

  const filteredGiveaways = giveaways.filter((giveaway) => {
    if (filter === "all") return true;
    return giveaway.status.toLowerCase() === filter;
  });

  const upcomingCount = giveaways.filter((g) => g.status === "UPCOMING").length;
  const activeCount = giveaways.filter((g) => g.status === "ACTIVE").length;
  const completedCount = giveaways.filter(
    (g) => g.status === "COMPLETED"
  ).length;

  if (loading) {
    return (
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
    );
  }

  if (giveaways.length === 0) {
    return (
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
          No giveaways yet
        </h3>
        <p className="text-gray-600 mb-6">
          Create your first giveaway to get started!
        </p>
        <button
          onClick={onRefresh}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === "all"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            All ({giveaways.length})
          </button>
          <button
            onClick={() => setFilter("upcoming")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === "upcoming"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Upcoming ({upcomingCount})
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === "active"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              filter === "completed"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Completed ({completedCount})
          </button>
        </div>

        <button
          onClick={onRefresh}
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

      {/* Giveaways Grid */}
      {filteredGiveaways.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">
            No {filter === "all" ? "" : filter} giveaways found.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredGiveaways.map((giveaway) => (
            <GiveawayCard
              key={giveaway.id}
              giveaway={giveaway}
              currentUserId={currentUserId}
              onUpdate={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
