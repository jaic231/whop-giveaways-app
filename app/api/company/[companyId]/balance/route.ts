import { NextRequest, NextResponse } from "next/server";
import { whopApi } from "@/lib/whop-api";
import { verifyUserToken } from "@whop/api";
import { headers } from "next/headers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params;

    // Get user ID from headers
    const headersList = await headers();
    const { userId } = await verifyUserToken(headersList);

    const result = await whopApi
      .withCompany(companyId)
      .withUser(userId)
      .getCompanyLedgerAccount({ companyId });

    const balanceCaches =
      result.company?.ledgerAccount?.balanceCaches?.nodes || [];

    const totalBalance = balanceCaches.reduce(
      (sum, cache) => sum + (cache?.balance || 0),
      0
    );

    return NextResponse.json({ balance: totalBalance });
  } catch (error) {
    console.error("Failed to get company balance:", error);
    return NextResponse.json(
      { error: "Failed to get company balance" },
      { status: 500 }
    );
  }
}
