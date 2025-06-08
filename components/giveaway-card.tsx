"use client";

import { useState, useEffect } from "react";
import {
  formatPrizeAmount,
  formatTimeRemaining,
  isGiveawayActive,
  isGiveawayUpcoming,
  isGiveawayCompleted,
} from "@/lib/types";
import type { GiveawayWithStats } from "@/lib/types";
import { GiveawayWinnerDialog } from "./giveaway-winner-dialog";

interface GiveawayCardProps {
  giveaway: GiveawayWithStats;
  currentUserId: string;
  onUpdate: () => void;
}

export function GiveawayCard({
  giveaway,
  currentUserId,
  onUpdate,
}: GiveawayCardProps) {
  const [entering, setEntering] = useState(false);
  const [isWinnerDialogVisible, setIsWinnerDialogVisible] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(
    giveaway.timeRemaining
  );

  // Update countdown every second for active giveaways
  useEffect(() => {
    if (!isGiveawayActive(giveaway)) return;

    const interval = setInterval(() => {
      const endDate = new Date(giveaway.endDate);
      const remaining = endDate.getTime() - new Date().getTime();
      setTimeRemaining(remaining > 0 ? remaining : null);
    }, 1000);

    return () => clearInterval(interval);
  }, [giveaway]);

  const handleEnter = async () => {
    setEntering(true);
    try {
      const response = await fetch(`/api/giveaways/${giveaway.id}/enter`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: currentUserId,
          userName: "Current User", // TODO: In real app, this would come from Whop SDK
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to enter giveaway");
      }

      onUpdate(); // Refresh the list
    } catch (error) {
      console.error("Failed to enter giveaway:", error);
      // Could add toast notification here
    } finally {
      setEntering(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "UPCOMING":
        return "bg-yellow-100 text-yellow-800";
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "UPCOMING":
        return "Upcoming";
      case "ACTIVE":
        return "Live";
      case "COMPLETED":
        return "Completed";
      case "CANCELLED":
        return "Cancelled";
      default:
        return status;
    }
  };

  const userEntry = giveaway.entries.find(
    (entry) => entry.userId === currentUserId
  );
  const isWinner = userEntry?.isWinner || false;
  const isActive = isGiveawayActive(giveaway);
  const isUpcoming = isGiveawayUpcoming(giveaway);
  const isCompleted = isGiveawayCompleted(giveaway);
  const isCreator = giveaway.creatorId === currentUserId;

  return (
    <>
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-6">
        {/* Status Badge */}
        <div className="flex items-center justify-between mb-4">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
              giveaway.status
            )}`}
          >
            {getStatusText(giveaway.status)}
          </span>

          {isCompleted && userEntry && (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isWinner
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {isWinner ? "🎉 Winner!" : "Not won"}
            </span>
          )}
        </div>

        {/* Title */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {giveaway.title}
          </h3>
        </div>

        {/* Prize Amount */}
        <div className="mb-4">
          <div className="text-2xl font-bold text-green-600">
            {formatPrizeAmount(giveaway.prizeAmount)}
          </div>
          <div className="text-sm text-gray-500">Prize</div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-lg font-semibold text-gray-900">
              {giveaway.participantCount}
            </div>
            <div className="text-sm text-gray-500">
              {giveaway.participantCount === 1 ? "Participant" : "Participants"}
            </div>
          </div>

          <div>
            {isActive && timeRemaining && timeRemaining > 0 ? (
              <div>
                <div className="text-lg font-semibold text-orange-600">
                  {formatTimeRemaining(timeRemaining)}
                </div>
                <div className="text-sm text-gray-500">Remaining</div>
              </div>
            ) : isUpcoming ? (
              <div>
                <div className="text-lg font-semibold text-blue-600">
                  {new Date(giveaway.startDate).toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-500">Starts</div>
              </div>
            ) : isCompleted ? (
              <div>
                <div className="text-lg font-semibold text-gray-600">
                  {new Date(giveaway.endDate).toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-500">Ended</div>
              </div>
            ) : (
              <div>
                <div className="text-lg font-semibold text-gray-600">
                  {new Date(giveaway.endDate).toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-500">Ends</div>
              </div>
            )}
          </div>
        </div>

        {/* Creator Info */}
        <div className="mb-4 text-sm text-gray-500">
          Created by {giveaway.creatorName || "Anonymous"}
        </div>

        {/* Action Button */}
        <div className="w-full">
          {isCreator && isCompleted ? (
            <button
              onClick={() => setIsWinnerDialogVisible(true)}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 font-medium transition-colors"
            >
              View Winner
            </button>
          ) : isCreator && isActive ? (
            <div className="w-full bg-blue-50 border border-blue-200 text-blue-800 py-2 px-4 rounded-md text-center font-medium">
              Your Giveaway
            </div>
          ) : isActive && !giveaway.hasUserEntered ? (
            <button
              onClick={handleEnter}
              disabled={entering}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {entering ? "Entering..." : "Enter Giveaway"}
            </button>
          ) : isActive && giveaway.hasUserEntered ? (
            <div className="w-full bg-green-50 border border-green-200 text-green-800 py-2 px-4 rounded-md text-center font-medium">
              ✓ Entered
            </div>
          ) : isUpcoming ? (
            <div className="w-full bg-yellow-50 border border-yellow-200 text-yellow-800 py-2 px-4 rounded-md text-center font-medium">
              Starts {new Date(giveaway.startDate).toLocaleDateString()}
            </div>
          ) : isCompleted ? (
            <div className="w-full bg-gray-50 border border-gray-200 text-gray-600 py-2 px-4 rounded-md text-center font-medium">
              Giveaway Ended
            </div>
          ) : (
            <div className="w-full bg-red-50 border border-red-200 text-red-600 py-2 px-4 rounded-md text-center font-medium">
              Cancelled
            </div>
          )}
        </div>
      </div>
      <GiveawayWinnerDialog
        isOpen={isWinnerDialogVisible}
        onClose={() => setIsWinnerDialogVisible(false)}
        giveaway={giveaway}
      />
    </>
  );
}
