import { NextRequest, NextResponse } from "next/server";
import { whopApi } from "@/lib/whop-api";
import { verifyUserToken } from "@whop/api";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { winnerId, amountInCents, companyId, giveawayTitle, giveawayId } =
      body;

    if (
      !winnerId ||
      !amountInCents ||
      !companyId ||
      !giveawayTitle ||
      !giveawayId
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get user ID from headers
    const headersList = await headers();
    const { userId } = await verifyUserToken(headersList);

    // Get company ledger account first with company and user context
    const ledgerResult = await whopApi
      .withCompany(companyId)
      .withUser(userId)
      .getCompanyLedgerAccount({ companyId });

    if (!ledgerResult.company?.ledgerAccount?.id) {
      return NextResponse.json(
        { error: "Company ledger account not found" },
        { status: 404 }
      );
    }

    // Generate unique idempotency key
    const idempotenceKey = `giveaway_payout_${crypto.randomUUID()}`;

    const result = await whopApi
      .withCompany(companyId)
      .withUser(userId)
      .transferFunds({
        input: {
          amount: amountInCents,
          currency: "usd",
          destinationId: winnerId,
          ledgerAccountId: ledgerResult.company.ledgerAccount.id,
          transferFee: ledgerResult.company.ledgerAccount.transferFee || 0,
          idempotenceKey: idempotenceKey,
          notes: `Giveaway winnings for "${giveawayTitle}" - $${(
            amountInCents / 100
          ).toFixed(2)}`,
        },
      });

    if (result.transferFunds) {
      // Update giveaway with payout information
      await prisma.giveaway.update({
        where: { id: giveawayId },
        data: {
          payoutId: idempotenceKey,
        },
      });
    }

    return NextResponse.json({
      success: true,
      payoutId: result.transferFunds ? idempotenceKey : undefined,
    });
  } catch (error) {
    console.error("Failed to process payout:", error);
    return NextResponse.json(
      { error: "Failed to process payout" },
      { status: 500 }
    );
  }
}
