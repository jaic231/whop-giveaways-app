import { NextResponse } from "next/server";
import { whopApi } from "@/lib/whop-api";

export async function GET() {
  try {
    const result = await whopApi.getUserLedgerAccount();
    const balanceCaches =
      result.viewer.user?.ledgerAccount?.balanceCaches?.nodes || [];
    const totalBalance = balanceCaches.reduce(
      (sum, cache) => sum + (cache?.balance || 0),
      0
    );

    return NextResponse.json({ balance: totalBalance });
  } catch (error) {
    console.error("Failed to get user balance:", error);
    return NextResponse.json(
      { error: "Failed to get user balance" },
      { status: 500 }
    );
  }
}
