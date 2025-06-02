"use client";

import { useState, useEffect } from "react";
import { CreateGiveawayForm } from "./create-giveaway-form";
import { GiveawaysList } from "./giveaways-list";
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
      setGiveaways(data.giveaways);
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

  const handleGiveawayCreated = () => {
    setView("list");
    setRefreshKey((prev) => prev + 1); // Trigger refresh
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

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
                <div>Experience ID: {experienceId || "Loading..."}</div>
                {companyInfoLoading ? (
                  <div>Company ID: Loading...</div>
                ) : (
                  <div>Company ID: {companyId || "N/A"}</div>
                )}
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

            {view === "create" && (
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
            creatorId={currentUser.id}
            creatorName={currentUser.name || currentUser.username}
            onSuccess={handleGiveawayCreated}
            onCancel={() => setView("list")}
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
