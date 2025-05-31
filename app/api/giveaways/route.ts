import { NextRequest, NextResponse } from "next/server";
import {
  createGiveaway,
  getGiveawaysWithStats,
  updateGiveawayStatuses,
} from "@/lib/giveaway-service";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Update giveaway statuses before fetching
    await updateGiveawayStatuses();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    const giveaways = await getGiveawaysWithStats(userId || undefined);

    return NextResponse.json({ giveaways });
  } catch (error) {
    console.error("Failed to fetch giveaways:", error);
    return NextResponse.json(
      { error: "Failed to fetch giveaways" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, prizeAmount, startDate, endDate, creatorId, creatorName } =
      body;

    // Validation
    if (!title || !prizeAmount || !startDate || !endDate || !creatorId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (prizeAmount <= 0) {
      return NextResponse.json(
        { error: "Prize amount must be greater than 0" },
        { status: 400 }
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    if (start < new Date()) {
      return NextResponse.json(
        { error: "Start date cannot be in the past" },
        { status: 400 }
      );
    }

    const giveaway = await createGiveaway(
      {
        title,
        prizeAmount,
        startDate: start,
        endDate: end,
      },
      creatorId,
      creatorName
    );

    return NextResponse.json({ giveaway });
  } catch (error) {
    console.error("Failed to create giveaway:", error);
    return NextResponse.json(
      { error: "Failed to create giveaway" },
      { status: 500 }
    );
  }
}
