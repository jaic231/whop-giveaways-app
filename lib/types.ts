import type { Giveaway, Entry } from "@prisma/client";

// Derived status type (computed from dates)
export type DerivedGiveawayStatus = "UPCOMING" | "ACTIVE" | "COMPLETED";

// Extended types with relations
export type GiveawayWithEntries = Giveaway & {
  entries: Entry[];
};

export type GiveawayWithStats = Giveaway & {
  entries: Entry[];
  participantCount: number;
  timeRemaining: number | null; // milliseconds until end, null if ended
  hasUserEntered: boolean; // will be set based on current user
  status: DerivedGiveawayStatus; // derived from dates
};

// Form types for creating giveaways
export interface CreateGiveawayData {
  title: string;
  prizeAmount: number; // in cents
  startDate: Date;
  endDate: Date;
}

// Utility functions based on dates instead of status
export const isGiveawayActive = (giveaway: Giveaway): boolean => {
  const now = new Date();
  const startDate = new Date(giveaway.startDate);
  const endDate = new Date(giveaway.endDate);

  return startDate <= now && endDate > now;
};

export const isGiveawayUpcoming = (giveaway: Giveaway): boolean => {
  const now = new Date();
  const startDate = new Date(giveaway.startDate);
  return startDate > now;
};

export const isGiveawayCompleted = (giveaway: Giveaway): boolean => {
  const now = new Date();
  const endDate = new Date(giveaway.endDate);
  return endDate <= now;
};

export const getTimeRemaining = (endDate: Date): number | null => {
  const now = new Date();
  const remaining = endDate.getTime() - now.getTime();
  return remaining > 0 ? remaining : null;
};

export const formatPrizeAmount = (amountInCents: number): string => {
  return `$${(amountInCents / 100).toFixed(2)}`;
};

export const formatTimeRemaining = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  } else if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
};
