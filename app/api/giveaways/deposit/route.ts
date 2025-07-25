import { NextRequest, NextResponse } from "next/server";
import { whopApi } from "@/lib/whop-api";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, experienceId, amount, giveawayTitle } = body;

    // Validate required fields
    if (!userId || !experienceId || !amount) {
      return NextResponse.json(
        { error: "Missing required fields: userId, experienceId, amount" },
        { status: 400 }
      );
    }

    // Validate amount is positive
    if (amount <= 0) {
      return NextResponse.json(
        { error: "Deposit amount must be positive" },
        { status: 400 }
      );
    }

    // Convert amount to float
    const floatAmount = parseFloat(amount);

    // Create the charge using Whop API
    const result = await whopApi.chargeUser({
      input: {
        amount: floatAmount, // Convert to float
        currency: "usd",
        userId: userId,
        // Metadata for tracking this deposit
        metadata: {
          type: "giveaway_deposit",
          depositAmount: floatAmount,
          experienceId: experienceId,
          giveawayTitle: giveawayTitle || "Giveaway Deposit",
        },
      },
    });

    if (!result?.chargeUser?.inAppPurchase) {
      throw new Error("Failed to create checkout session");
    }

    return NextResponse.json(result.chargeUser.inAppPurchase);
  } catch (error) {
    console.error("Failed to create deposit charge:", error);
    return NextResponse.json(
      { error: "Failed to create deposit charge" },
      { status: 500 }
    );
  }
}
