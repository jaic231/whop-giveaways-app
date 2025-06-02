import { prisma } from "./prisma";

export interface DepositResult {
  success: boolean;
  chargeId?: string;
  checkoutUrl?: string;
  error?: string;
}

export interface PayoutResult {
  success: boolean;
  payoutId?: string;
  error?: string;
}

/**
 * Pay out winnings to a user via API route
 */
export async function payoutToWinner(
  winnerId: string,
  amountInCents: number,
  companyId: string,
  giveawayTitle: string,
  giveawayId: string
): Promise<PayoutResult> {
  try {
    const response = await fetch("/api/giveaways/payout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        winnerId,
        amountInCents,
        companyId,
        giveawayTitle,
        giveawayId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to process payout");
    }

    const data = await response.json();
    return {
      success: true,
      payoutId: data.payoutId,
    };
  } catch (error) {
    console.error("Failed to payout to winner:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Get user's ledger balance to check if they can afford the deposit
 */
export async function getUserBalance(): Promise<number> {
  try {
    const response = await fetch("/api/user/balance");

    if (!response.ok) {
      throw new Error("Failed to fetch user balance");
    }

    const data = await response.json();
    return data.balance || 0;
  } catch (error) {
    console.error("Failed to get user balance:", error);
    return 0;
  }
}

export async function getCompanyBalance(companyId: string): Promise<number> {
  try {
    const response = await fetch(`/api/company/${companyId}/balance`);

    if (!response.ok) {
      throw new Error("Failed to fetch company balance");
    }

    const data = await response.json();
    return data.balance || 0;
  } catch (error) {
    console.error("Failed to get company balance:", error);
    return 0;
  }
}

/**
 * Process payout to giveaway winner
 */
export async function processWinnerPayout(
  giveawayId: string,
  winnerId: string,
  prizeAmount: number,
  companyId: string,
  giveawayTitle: string
): Promise<PayoutResult> {
  try {
    const payoutResult = await payoutToWinner(
      winnerId,
      prizeAmount,
      companyId,
      giveawayTitle,
      giveawayId
    );

    return payoutResult;
  } catch (error) {
    console.error("Failed to process winner payout:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to process payout",
    };
  }
}
