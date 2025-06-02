import { prisma } from "./prisma";
import type {
  CreateGiveawayData,
  GiveawayWithEntries,
  GiveawayWithStats,
} from "./types";
import { getTimeRemaining } from "./types";

// Helper function to derive giveaway status from dates
export function deriveGiveawayStatus(
  startDate: Date,
  endDate: Date
): "UPCOMING" | "ACTIVE" | "COMPLETED" {
  const now = new Date();

  if (now < startDate) {
    return "UPCOMING";
  } else if (now >= startDate && now < endDate) {
    return "ACTIVE";
  } else {
    return "COMPLETED";
  }
}

// Giveaway CRUD operations
export async function createGiveaway(
  data: CreateGiveawayData,
  creatorId: string,
  companyId: string,
  creatorName?: string
) {
  return await prisma.giveaway.create({
    data: {
      title: data.title,
      prizeAmount: data.prizeAmount,
      startDate: data.startDate,
      endDate: data.endDate,
      creatorId,
      creatorName,
      companyId,
    },
    include: {
      entries: true,
    },
  });
}

export async function getGiveawayById(
  id: string
): Promise<GiveawayWithEntries | null> {
  return await prisma.giveaway.findUnique({
    where: { id },
    include: {
      entries: true,
    },
  });
}

export async function getAllGiveaways(): Promise<GiveawayWithEntries[]> {
  return await prisma.giveaway.findMany({
    include: {
      entries: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getGiveawaysByCompanyId(
  companyId: string
): Promise<GiveawayWithEntries[]> {
  return await prisma.giveaway.findMany({
    where: { companyId },
    include: {
      entries: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

// Get giveaways by derived status
export async function getGiveawaysByDerivedStatus(
  status: "UPCOMING" | "ACTIVE" | "COMPLETED",
  companyId: string
): Promise<GiveawayWithEntries[]> {
  const now = new Date();
  let whereCondition: any = { companyId };

  switch (status) {
    case "UPCOMING":
      whereCondition.startDate = { gt: now };
      break;
    case "ACTIVE":
      whereCondition.startDate = { lte: now };
      whereCondition.endDate = { gt: now };
      break;
    case "COMPLETED":
      whereCondition.endDate = { lte: now };
      break;
  }

  return await prisma.giveaway.findMany({
    where: whereCondition,
    include: {
      entries: true,
    },
    orderBy: {
      startDate: "asc",
    },
  });
}

export async function getGiveawaysWithStats(
  companyId: string,
  userId?: string
): Promise<GiveawayWithStats[]> {
  const giveaways = await getGiveawaysByCompanyId(companyId);

  return giveaways.map((giveaway) => ({
    ...giveaway,
    participantCount: giveaway.entries.length,
    timeRemaining: getTimeRemaining(giveaway.endDate),
    hasUserEntered: userId
      ? giveaway.entries.some((entry) => entry.userId === userId)
      : false,
    status: deriveGiveawayStatus(giveaway.startDate, giveaway.endDate),
  }));
}

// Entry operations
export async function enterGiveaway(
  giveawayId: string,
  userId: string,
  userName?: string
) {
  try {
    return await prisma.entry.create({
      data: {
        giveawayId,
        userId,
        userName,
      },
    });
  } catch (error) {
    // Handle unique constraint violation (user already entered)
    throw new Error("User has already entered this giveaway");
  }
}

export async function getUserEntry(giveawayId: string, userId: string) {
  return await prisma.entry.findUnique({
    where: {
      userId_giveawayId: {
        userId,
        giveawayId,
      },
    },
  });
}

export async function getGiveawayEntries(giveawayId: string) {
  return await prisma.entry.findMany({
    where: { giveawayId },
    orderBy: { enteredAt: "asc" },
  });
}

// Winner selection
export async function selectRandomWinner(giveawayId: string) {
  const entries = await getGiveawayEntries(giveawayId);

  if (entries.length === 0) {
    throw new Error("No entries found for this giveaway");
  }

  // Select random winner
  const randomIndex = Math.floor(Math.random() * entries.length);
  const winnerEntry = entries[randomIndex];

  // Update entry as winner
  await prisma.entry.update({
    where: { id: winnerEntry.id },
    data: { isWinner: true },
  });

  return winnerEntry;
}

// Process completed giveaways to select winners
export async function processCompletedGiveaways(companyId: string) {
  const now = new Date();

  // Find giveaways that have ended but don't have a winner yet
  const completedGiveaways = await prisma.giveaway.findMany({
    where: {
      companyId,
      endDate: {
        lte: now,
      },
      entries: {
        none: {
          isWinner: true,
        },
      },
    },
    include: {
      entries: true,
    },
  });

  // For each completed giveaway, select a winner if there are entries
  for (const giveaway of completedGiveaways) {
    if (giveaway.entries.length > 0) {
      await selectRandomWinner(giveaway.id);
    }
  }
}
