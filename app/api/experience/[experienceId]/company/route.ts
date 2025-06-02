import { NextRequest, NextResponse } from "next/server";
import { whopApi } from "@/lib/whop-api";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ experienceId: string }> }
) {
  try {
    const { experienceId } = await params;

    const result = await whopApi.getExperience({ experienceId });
    const companyId = result.experience?.company?.id;
    const companyTitle = result.experience?.company?.title;

    if (!companyId) {
      return NextResponse.json(
        { error: "Company not found for this experience" },
        { status: 404 }
      );
    }

    return NextResponse.json({ companyId, companyTitle });
  } catch (error) {
    console.error("Failed to get company from experience:", error);
    return NextResponse.json(
      { error: "Failed to get company from experience" },
      { status: 500 }
    );
  }
}
