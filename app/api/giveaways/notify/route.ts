import { NextRequest, NextResponse } from "next/server";
import { sendNotification } from "@/lib/notification-service";

export async function POST(request: NextRequest) {
  try {
    const { experienceId, title, message, type } = await request.json();

    if (!experienceId || !title || !message || !type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    await sendNotification({
      experienceId,
      title,
      message,
      type,
    });

    return NextResponse.json({
      success: true,
      message: `Notification sent successfully`,
    });
  } catch (error) {
    // The error is already logged in the service, but we can log it here too for context
    console.error("Error in /api/giveaways/notify route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
