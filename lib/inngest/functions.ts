import { inngest } from "./client";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    return { message: `Hello ${event.data.email}!` };
  }
);

export const scheduleGiveaway = inngest.createFunction(
  { id: "schedule-giveaway" },
  { event: "giveaways/schedule" },
  async ({ event, step }) => {
    const {
      giveawayId,
      startDate,
      endDate,
      experienceId,
      prizeAmount,
      title,
      companyId,
    } = event.data;

    // Wait until the giveaway start time
    await step.sleepUntil("wait-for-giveaway-start", new Date(startDate));

    // Send push notification when giveaway starts
    await step.run("send-start-notification", async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/giveaways/notify`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            experienceId,
            title,
            message: `🎉 Giveaway "${title}" has started! Enter now for a chance to win $${prizeAmount}!`,
            type: "start",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to send start notification: ${response.statusText}`
        );
      }

      return await response.json();
    });

    // Wait until the giveaway end time
    await step.sleepUntil("wait-for-giveaway-end", new Date(endDate));

    // Select winner and pay prize
    await step.run("select-winner-and-pay", async () => {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/giveaways/end`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            giveawayId,
            experienceId,
            prizeAmount,
            title,
            companyId,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to end giveaway: ${response.statusText}`);
      }

      return await response.json();
    });

    return { message: `Giveaway "${title}" completed successfully` };
  }
);
