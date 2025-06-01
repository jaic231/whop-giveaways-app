import { NextRequest, NextResponse } from "next/server";
import { enterGiveaway, getGiveawayById } from "@/lib/giveaway-service";
import { isGiveawayActive } from "@/lib/types";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { userId, userName } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Check if giveaway exists and is active
    const giveaway = await getGiveawayById(id);
    if (!giveaway) {
      return NextResponse.json(
        { error: "Giveaway not found" },
        { status: 404 }
      );
    }

    if (!isGiveawayActive(giveaway)) {
      return NextResponse.json(
        { error: "Giveaway is not currently active" },
        { status: 400 }
      );
    }

    // Prevent creators from entering their own giveaways
    if (giveaway.creatorId === userId) {
      return NextResponse.json(
        { error: "Creators cannot enter their own giveaways" },
        { status: 403 }
      );
    }

    const entry = await enterGiveaway(id, userId, userName);

    return NextResponse.json({ entry });
  } catch (error) {
    console.error("Failed to enter giveaway:", error);

    if (error instanceof Error && error.message.includes("already entered")) {
      return NextResponse.json(
        { error: "User has already entered this giveaway" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Failed to enter giveaway" },
      { status: 500 }
    );
  }
}
