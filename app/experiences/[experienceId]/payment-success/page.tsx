"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function PaymentSuccessPage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing"
  );
  const [error, setError] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const createGiveawayAfterPayment = async () => {
      try {
        // Get pending giveaway data from localStorage
        const pendingData = localStorage.getItem("pendingGiveaway");
        if (!pendingData) {
          throw new Error("No pending giveaway data found");
        }

        const giveawayData = JSON.parse(pendingData);

        // Create the giveaway
        const response = await fetch("/api/giveaways/create-after-deposit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(giveawayData),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to create giveaway");
        }

        // Clear the pending data
        localStorage.removeItem("pendingGiveaway");

        setStatus("success");

        // Redirect back to the experience after 3 seconds
        const resolvedParams = await params;
        setTimeout(() => {
          router.push(`/experiences/${resolvedParams.experienceId}`);
        }, 3000);
      } catch (error) {
        console.error("Failed to create giveaway after payment:", error);
        setError(error instanceof Error ? error.message : "Unknown error");
        setStatus("error");
      }
    };

    createGiveawayAfterPayment();
  }, [router, params]);

  if (status === "processing") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto text-center">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Payment Successful!
            </h1>
            <p className="text-gray-600">Creating your giveaway now...</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-auto text-center">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Error Creating Giveaway
            </h1>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={() =>
                router.push(`/experiences/${(params as any).experienceId}`)
              }
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-auto text-center">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">
            Giveaway Created Successfully!
          </h1>
          <p className="text-gray-600 mb-4">
            Your deposit has been received and your giveaway is now live.
          </p>
          <p className="text-sm text-gray-500">
            Redirecting you back in a few seconds...
          </p>
        </div>
      </div>
    </div>
  );
}
