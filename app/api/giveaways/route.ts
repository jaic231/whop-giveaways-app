import { NextRequest, NextResponse } from "next/server";
import {
  getGiveawaysWithStats,
  updateGiveawayStatuses,
} from "@/lib/giveaway-service";

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

    // Update giveaway statuses before fetching (filtered by company)
    await updateGiveawayStatuses(companyId);

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
