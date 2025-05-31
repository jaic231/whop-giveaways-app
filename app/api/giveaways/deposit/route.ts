import { NextRequest, NextResponse } from "next/server";
import { whopApi } from "@/lib/whop-api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, amount, giveawayTitle, experienceId } = body;

    if (!userId || !amount || !giveawayTitle || !experienceId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      );
    }

    // Create charge using Whop's API
    const result = await whopApi.chargeUser({
      input: {
        amount: amount, // amount in cents
        currency: "usd",
        userId: userId,
        description: `Giveaway deposit for "${giveawayTitle}" - $${(
          amount / 100
        ).toFixed(2)}`,
        metadata: {
          type: "giveaway_deposit",
          amount: amount.toString(),
          giveawayTitle: giveawayTitle,
        },
        redirectUrl: `https://whop.com/jai-chawla/giveaways-app-srV7sBfhef1GKO/app/`,
      },
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: result.chargeUser?.checkoutSession?.purchaseUrl,
      chargeId: result.chargeUser?.checkoutSession?.id,
    });
  } catch (error) {
    console.error("Failed to create deposit charge:", error);
    return NextResponse.json(
      { error: "Failed to create deposit charge" },
      { status: 500 }
    );
  }
}
