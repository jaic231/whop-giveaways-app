import { NextRequest, NextResponse } from "next/server";
import { getGiveawaysWithStats, createGiveaway } from "@/lib/giveaway-service";
import { inngest } from "@/lib/inngest/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const companyId = searchParams.get("companyId");

    // Company ID is required for all giveaway queries
    if (!companyId) {
      return NextResponse.json(
        { error: "Company ID is required" },
        { status: 400 }
      );
    }

    const giveaways = await getGiveawaysWithStats(
      companyId,
      userId || undefined
    );

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
    const {
      title,
      prizeAmount,
      startDate,
      endDate,
      creatorId,
      companyId,
      creatorName,
      experienceId,
    } = body;

    // Validate required fields
    if (
      !title ||
      !prizeAmount ||
      !startDate ||
      !endDate ||
      !creatorId ||
      !companyId ||
      !experienceId
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate prize amount is positive
    if (prizeAmount <= 0) {
      return NextResponse.json(
        { error: "Prize amount must be positive" },
        { status: 400 }
      );
    }

    // Convert ISO strings back to Date objects
    const giveawayData = {
      title,
      prizeAmount: Math.round(prizeAmount * 100), // Convert to cents
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    };

    // Validate dates
    if (giveawayData.startDate >= giveawayData.endDate) {
      return NextResponse.json(
        { error: "End date must be after start date" },
        { status: 400 }
      );
    }

    const giveaway = await createGiveaway(
      giveawayData,
      creatorId,
      companyId,
      creatorName
    );

    // Schedule the giveaway lifecycle with Inngest
    await inngest.send({
      name: "giveaways/schedule",
      data: {
        giveawayId: giveaway.id,
        title: giveaway.title,
        startDate: giveaway.startDate.toISOString(),
        endDate: giveaway.endDate.toISOString(),
        experienceId: experienceId,
        prizeAmount: (giveaway.prizeAmount / 100).toFixed(2), // Convert back to dollars
        companyId: companyId,
      },
    });

    return NextResponse.json(
      {
        giveaway,
        message: "Giveaway created and scheduled successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create giveaway:", error);
    return NextResponse.json(
      { error: "Failed to create giveaway" },
      { status: 500 }
    );
  }
}
