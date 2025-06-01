import { whopApi } from "./whop-api";
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
 * Create a charge for giveaway deposit - returns checkout URL for user to complete payment
 */
export async function createDepositCharge(
  userId: string,
  amountInCents: number,
  giveawayTitle: string,
  redirectUrl: string
): Promise<DepositResult> {
  try {
    const result = await whopApi.chargeUser({
      input: {
        amount: amountInCents,
        currency: "usd",
        userId: userId,
        description: `Giveaway deposit for "${giveawayTitle}" - $${(
          amountInCents / 100
        ).toFixed(2)}`,
        metadata: {
          type: "giveaway_deposit",
          amount: amountInCents.toString(),
          giveawayTitle: giveawayTitle,
        },
        redirectUrl: redirectUrl,
      },
    });

    return {
      success: true,
      chargeId: result.chargeUser?.checkoutSession?.id,
      checkoutUrl: result.chargeUser?.checkoutSession?.purchaseUrl,
    };
  } catch (error) {
    console.error("Failed to create deposit charge:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Pay out winnings to a user
 */
export async function payoutToWinner(
  userId: string,
  amountInCents: number,
  companyId: string,
  giveawayTitle: string
): Promise<PayoutResult> {
  try {
    // Get company ledger account first
    const ledgerResult = await whopApi.getCompanyLedgerAccount({ companyId });

    if (!ledgerResult.company?.ledgerAccount?.id) {
      throw new Error("Company ledger account not found");
    }
    // Generate unique idempotency key
    const idempotenceKey = `giveaway_payout_${crypto.randomUUID()}`;

    const result = await whopApi.transferFunds({
      input: {
        amount: amountInCents,
        currency: "usd",
        destinationId: userId,
        ledgerAccountId: ledgerResult.company.ledgerAccount.id,
        transferFee: ledgerResult.company.ledgerAccount.transferFee || 0,
        idempotenceKey: idempotenceKey,
        notes: `Giveaway winnings for "${giveawayTitle}" - $${(
          amountInCents / 100
        ).toFixed(2)}`,
      },
    });

    return {
      success: true,
      payoutId: result.transferFunds ? idempotenceKey : undefined,
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
    const result = await whopApi.getUserLedgerAccount();
    const balanceCaches =
      result.viewer.user?.ledgerAccount?.balanceCaches?.nodes || [];
    const totalBalance = balanceCaches.reduce(
      (sum, cache) => sum + (cache?.balance || 0),
      0
    );
    return totalBalance;
  } catch (error) {
    console.error("Failed to get user balance:", error);
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
      giveawayTitle
    );

    if (payoutResult.success) {
      // Update giveaway with payout information
      await prisma.giveaway.update({
        where: { id: giveawayId },
        data: {
          payoutId: payoutResult.payoutId,
        },
      });
    }

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
