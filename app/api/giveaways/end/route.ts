import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { whopApi } from "@/lib/whop-api";
import { sendNotification } from "@/lib/notification-service";

export async function POST(request: NextRequest) {
  try {
    const { giveawayId, experienceId, prizeAmount, title, companyId } =
      await request.json();

    console.log("giveawayId", giveawayId);
    console.log("experienceId", experienceId);
    console.log("prizeAmount", prizeAmount);
    console.log("title", title);
    console.log("companyId", companyId);

    if (!giveawayId || !experienceId || !prizeAmount || !companyId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const giveaway = await prisma.giveaway.findUnique({
      where: {
        id: giveawayId,
      },
    });

    if (!giveaway) {
      return NextResponse.json(
        { error: "Giveaway not found" },
        { status: 404 }
      );
    }

    const userId = giveaway.creatorId;

    // Get all entries for this giveaway
    const entries = await prisma.entry.findMany({
      where: {
        giveawayId: giveawayId,
      },
    });

    console.log("entries", entries);

    if (entries.length === 0) {
      // Send notification about no entries
      await sendNotification({
        experienceId,
        title,
        message: `Giveaway "${title}" has ended with no entries.`,
        type: "end",
      });

      return NextResponse.json({
        success: true,
        message: "Giveaway ended with no entries",
        winner: null,
      });
    }

    // Select random winner
    const randomIndex = Math.floor(Math.random() * entries.length);
    const winnerEntry = entries[randomIndex];

    console.log(
      `Selected winner: ${winnerEntry.userName} (ID: ${winnerEntry.userId}) for giveaway: ${title}`
    );

    // Get the company's ledger account ID
    const companyLedgerAccount = await whopApi
      .withCompany(companyId)
      .withUser(userId)
      .getCompanyLedgerAccount({ companyId });

    if (!companyLedgerAccount?.company?.ledgerAccount?.id) {
      console.error("Failed to fetch company ledger account");
      return NextResponse.json(
        { error: "Failed to fetch company ledger account" },
        { status: 500 }
      );
    }
    const ledgerAccountId = companyLedgerAccount.company.ledgerAccount.id;

    // Process payment to winner using Whop SDK
    const note = `Giveaway prize for "${title}"`;
    const paymentResult = await whopApi
      .withCompany(companyId)
      .withUser(userId)
      .payUser({
        input: {
          amount: parseFloat(prizeAmount),
          currency: "usd",
          destinationId: winnerEntry.userId,
          idempotenceKey: giveawayId, // Use giveawayId to prevent duplicate payments
          notes: note.length > 50 ? note.substring(0, 49) : note,
          reason: "creator_to_user",
          ledgerAccountId: ledgerAccountId,
        },
      });

    if (!paymentResult.transferFunds) {
      console.error("Whop SDK payment error: Failed to transfer funds");
      return NextResponse.json(
        { error: "Failed to process payment to winner via Whop SDK" },
        { status: 500 }
      );
    }

    // Mark the winner in the entry
    await prisma.entry.update({
      where: { id: winnerEntry.id },
      data: { isWinner: true },
    });

    // Send notification about winner
    await sendNotification({
      experienceId,
      title,
      message: `🏆 Giveaway "${title}" has ended! Congratulations to @${
        winnerEntry.userName || winnerEntry.userId
      } for winning $${prizeAmount}!`,
      type: "end",
    });

    console.log(
      `Giveaway completed: ${title}, Winner: ${
        winnerEntry.userName || winnerEntry.userId
      }, Payment successful.`
    );

    return NextResponse.json({
      success: true,
      winner: {
        id: winnerEntry.userId,
        username: winnerEntry.userName,
      },
      message: "Giveaway ended successfully and winner paid",
    });
  } catch (error) {
    console.error("Error ending giveaway:", error);

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
