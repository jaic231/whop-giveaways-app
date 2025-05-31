import { whopApi } from "@/lib/whop-api";
import { verifyUserToken } from "@whop/api";
import { headers } from "next/headers";
import { GiveawaysApp } from "@/components/giveaways-app";
import { CustomerGiveawaysView } from "@/components/customer-giveaways-view";

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  try {
    // The headers contains the user token
    const headersList = await headers();

    // The experienceId is a path param
    const { experienceId } = await params;

    // The user token is in the headers
    const { userId } = await verifyUserToken(headersList);

    const result = await whopApi.checkIfUserHasAccessToExperience({
      userId,
      experienceId,
    });

    if (!result.hasAccessToExperience.hasAccess) {
      return (
        <div className="flex justify-center items-center h-screen px-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Access Denied
            </h1>
            <p className="text-gray-600">
              You do not have access to this experience.
            </p>
          </div>
        </div>
      );
    }

    const user = (await whopApi.getUser({ userId })).publicUser;

    // Either: 'admin' | 'customer' | 'no_access';
    // 'admin' means the user is an admin of the whop, such as an owner or moderator
    // 'customer' means the user is a common member in this whop
    const { accessLevel } = result.hasAccessToExperience;

    const currentUser = {
      id: userId,
      name: user.name ?? null,
      username: user.username,
      isAdmin: accessLevel === "admin",
    };

    // Show full admin dashboard for admins, simplified view for customers
    if (accessLevel === "admin") {
      return <GiveawaysApp currentUser={currentUser} />;
    } else {
      return <CustomerGiveawaysView currentUser={currentUser} />;
    }
  } catch (error) {
    console.error("Authentication error:", error);
    return (
      <div className="flex justify-center items-center h-screen px-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Authentication Error
          </h1>
          <p className="text-gray-600">
            Unable to verify your access. Please try again later.
          </p>
        </div>
      </div>
    );
  }
}
