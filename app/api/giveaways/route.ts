import { NextRequest, NextResponse } from "next/server";
import {
  getGiveawaysWithStats,
  updateGiveawayStatuses,
} from "@/lib/giveaway-service";

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
