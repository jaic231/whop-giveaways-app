import { NextRequest, NextResponse } from "next/server";
import { createGiveaway } from "@/lib/giveaway-service";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      prizeAmount,
      startDate,
      endDate,
      creatorId,
      creatorName,
      companyId,
    } = body;

    // Validation
    if (
      !title ||
      !prizeAmount ||
      !startDate ||
      !endDate ||
      !creatorId ||
      !companyId
    ) {
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

    // Create the giveaway with company information
    const giveaway = await createGiveaway(
      {
        title,
        prizeAmount,
        startDate: start,
        endDate: end,
      },
      creatorId,
      companyId,
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
