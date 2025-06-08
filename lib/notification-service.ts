import { whopApi } from "@/lib/whop-api";

interface SendNotificationParams {
  experienceId: string;
  title: string;
  message: string;
  type: "start" | "end";
}

export async function sendNotification({
  experienceId,
  title,
  message,
  type,
}: SendNotificationParams) {
  try {
    const result = await whopApi.sendPushNotification({
      input: {
        experienceId: experienceId,
        title: type === "start" ? `🎉 ${title}` : `🏆 ${title}`,
        content: message,
        link: `/giveaways`,
      },
    });

    if (!result.sendNotification) {
      throw new Error("Failed to send notification via Whop SDK");
    }

    console.log(`${type} notification sent for giveaway: ${title}`);
    return { success: true };
  } catch (error) {
    console.error("Error sending notification:", error);
    // Re-throw the error to be handled by the calling function
    throw error;
  }
}
