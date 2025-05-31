import { prisma } from "./prisma";
import type {
  CreateGiveawayData,
  GiveawayWithEntries,
  GiveawayWithStats,
} from "./types";
import { getTimeRemaining } from "./types";

// Giveaway CRUD operations
export async function createGiveaway(
  data: CreateGiveawayData,
  creatorId: string,
  creatorName?: string
) {
  return await prisma.giveaway.create({
    data: {
      ...data,
      creatorId,
      creatorName,
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

export async function getGiveawaysByStatus(
  status: "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED"
) {
  return await prisma.giveaway.findMany({
    where: { status },
    include: {
      entries: true,
    },
    orderBy: {
      startDate: "asc",
    },
  });
}

export async function getGiveawaysWithStats(
  userId?: string
): Promise<GiveawayWithStats[]> {
  const giveaways = await getAllGiveaways();

  return giveaways.map((giveaway) => ({
    ...giveaway,
    participantCount: giveaway.entries.length,
    timeRemaining: getTimeRemaining(giveaway.endDate),
    hasUserEntered: userId
      ? giveaway.entries.some((entry) => entry.userId === userId)
      : false,
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

// Status management
export async function updateGiveawayStatus(
  id: string,
  status: "UPCOMING" | "ACTIVE" | "COMPLETED" | "CANCELLED"
) {
  return await prisma.giveaway.update({
    where: { id },
    data: { status },
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

  // Update giveaway status to completed
  await updateGiveawayStatus(giveawayId, "COMPLETED");

  return winnerEntry;
}

// Auto-update giveaway statuses based on dates
export async function updateGiveawayStatuses() {
  const now = new Date();

  // Update upcoming giveaways to active if start date has passed
  await prisma.giveaway.updateMany({
    where: {
      status: "UPCOMING",
      startDate: {
        lte: now,
      },
      endDate: {
        gt: now,
      },
    },
    data: {
      status: "ACTIVE",
    },
  });

  // Update active giveaways to completed if end date has passed
  const expiredGiveaways = await prisma.giveaway.findMany({
    where: {
      status: "ACTIVE",
      endDate: {
        lte: now,
      },
    },
  });

  // For each expired giveaway, select a winner if there are entries
  for (const giveaway of expiredGiveaways) {
    const entries = await getGiveawayEntries(giveaway.id);
    if (entries.length > 0) {
      await selectRandomWinner(giveaway.id);
    } else {
      await updateGiveawayStatus(giveaway.id, "COMPLETED");
    }
  }
}
