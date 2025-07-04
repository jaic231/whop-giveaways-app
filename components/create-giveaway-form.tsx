"use client";

import React, { useState, useEffect } from "react";
import { DateTimePicker } from "./date-time-picker";
import { useCallback } from "react";
import { iframeSdk } from "@/lib/iframe";

interface GiveawayFormData {
  title: string;
  prizeAmount: string;
  startDate: Date;
  endDate: Date;
}

interface GiveawayFormErrors {
  title?: string;
  prizeAmount?: string;
  startDate?: string;
  endDate?: string;
  general?: string;
}

interface CreateGiveawayFormProps {
  experienceId: string;
  companyId: string;
  currentUser: {
    id: string;
    name: string | null;
    username: string;
    isAdmin: boolean;
  };
  onSuccess?: () => void; // Callback for successful giveaway creation
}

export function CreateGiveawayForm({
  experienceId,
  companyId,
  currentUser,
  onSuccess,
}: CreateGiveawayFormProps) {
  const [formData, setFormData] = useState<GiveawayFormData>({
    title: "",
    prizeAmount: "1.00",
    startDate: new Date(),
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Default to tomorrow
  });

  const [errors, setErrors] = useState<GiveawayFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prizeAmountDisplay, setPrizeAmountDisplay] = useState("1.00"); // Separate display state

  const [isCreating, setIsCreating] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: GiveawayFormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (formData.prizeAmount.trim() === "") {
      newErrors.prizeAmount = "Prize amount is required";
    } else if (parseFloat(formData.prizeAmount) < 1) {
      newErrors.prizeAmount = "Prize amount must be at least $1.00";
    }

    if (formData.startDate >= formData.endDate) {
      newErrors.endDate = "End date must be after start date";
    } else {
      // Check if giveaway duration exceeds 7 days (1 week)
      const timeDiff =
        formData.endDate.getTime() - formData.startDate.getTime();
      const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

      if (daysDiff > 7) {
        newErrors.endDate = "Giveaway duration cannot exceed 7 days";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      setIsCreating(true);
      const prizeAmountNumber = parseFloat(formData.prizeAmount);

      // Always require deposit before creating giveaway
      await handleDeposit(prizeAmountNumber);

      // Proceed with creating giveaway
      await createGiveaway();
    } catch (error) {
      console.error("Error in create giveaway flow:", error);
      setErrors({ general: "Failed to process request" });
    } finally {
      setIsCreating(false);
      setIsSubmitting(false);
    }
  };

  const handleDeposit = async (prizeAmount: number) => {
    try {
      setIsDepositing(true);

      // Create charge on server
      const response = await fetch("/api/giveaways/deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: currentUser.id, // Using experienceId as userId for now
          experienceId,
          amount: prizeAmount.toString(),
          giveawayTitle: formData.title,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create deposit charge");
      }

      const inAppPurchase = await response.json();

      // Redirect to Whop checkout page
      const res = await iframeSdk.inAppPurchase(inAppPurchase);

      if (res.status === "ok") {
        console.log("Deposit successful");
      } else {
        throw new Error("Failed to process in-app purchase in iframe");
      }
    } catch (error) {
      console.error("Deposit error:", error);
      setErrors({ general: "Failed to process deposit" });
      setIsDepositing(false);
    }
  };

  const createGiveaway = async () => {
    const response = await fetch("/api/giveaways", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: formData.title,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString(),
        prizeAmount: formData.prizeAmount,
        experienceId,
        companyId,
        creatorId: currentUser.id,
        creatorName: currentUser.name,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to create giveaway");
    }

    onSuccess?.();
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, title: e.target.value }));
    if (errors.title) {
      setErrors((prev) => ({ ...prev, title: undefined }));
    }
  };

  const handlePrizeAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    // Remove any non-digit, non-decimal characters
    const cleanValue = value.replace(/[^0-9.]/g, "");

    // Handle multiple decimal points - only allow one
    const parts = cleanValue.split(".");
    if (parts.length > 2) {
      return; // Don't update if more than one decimal point
    }

    // If there's a decimal part, limit to 2 digits
    if (parts.length === 2 && parts[1].length > 2) {
      return; // Don't update if more than 2 decimal places
    }

    // Handle edge cases
    let processedValue = cleanValue;

    // Don't allow multiple leading zeros before decimal
    if (processedValue.match(/^0+[0-9]/)) {
      processedValue = processedValue.replace(/^0+/, "0");
    }

    // Don't allow starting with decimal point - prepend 0
    if (processedValue.startsWith(".")) {
      processedValue = "0" + processedValue;
    }

    // Update display value
    setPrizeAmountDisplay(processedValue);

    // Update numeric value
    const numericValue = parseFloat(processedValue) || 0;
    setFormData((prev) => ({ ...prev, prizeAmount: numericValue.toString() }));

    // Clear error
    if (errors.prizeAmount) {
      setErrors((prev) => ({ ...prev, prizeAmount: undefined }));
    }
  };

  const handlePrizeAmountBlur = () => {
    let numericValue = parseFloat(prizeAmountDisplay);

    if (isNaN(numericValue) || numericValue < 1) {
      numericValue = 1;
    }

    const formatted = numericValue.toFixed(2);
    setPrizeAmountDisplay(formatted);
    setFormData((prev) => ({ ...prev, prizeAmount: formatted }));
  };

  const handlePrizeAmountFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Select all text when focused for easy editing
    e.target.select();
  };

  const handleStartDateChange = (date: Date) => {
    setFormData((prev) => ({ ...prev, startDate: date }));
    if (errors.startDate) {
      setErrors((prev) => ({ ...prev, startDate: undefined }));
    }
  };

  const handleEndDateChange = (date: Date) => {
    setFormData((prev) => ({ ...prev, endDate: date }));
    if (errors.endDate) {
      setErrors((prev) => ({ ...prev, endDate: undefined }));
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Create New Giveaway
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Giveaway Title *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleTitleChange}
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500 ${
              errors.title ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter giveaway title"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
        </div>

        {/* Prize Amount */}
        <div>
          <label
            htmlFor="prizeAmount"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Prize Amount *
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="text"
              id="prizeAmount"
              name="prizeAmount"
              value={prizeAmountDisplay}
              onChange={handlePrizeAmountChange}
              onBlur={handlePrizeAmountBlur}
              onFocus={handlePrizeAmountFocus}
              className={`w-full pl-7 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 placeholder-gray-500 ${
                errors.prizeAmount ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="0.00"
            />
          </div>
          {errors.prizeAmount && (
            <p className="mt-1 text-sm text-red-600">{errors.prizeAmount}</p>
          )}
        </div>

        {/* Start Date */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <DateTimePicker
              id="start-date"
              name="start-date"
              label="Start Date & Time"
              value={formData.startDate}
              onChange={handleStartDateChange}
              error={errors.startDate}
              minDate={new Date()}
              timeIntervals={1}
            />
          </div>
          <div>
            <DateTimePicker
              id="end-date"
              name="end-date"
              label="End Date & Time"
              value={formData.endDate}
              onChange={handleEndDateChange}
              error={errors.endDate}
              minDate={formData.startDate}
              timeIntervals={1}
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isCreating || isDepositing}
          className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
            isCreating || isDepositing
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          } text-white`}
        >
          {isDepositing
            ? "Processing Deposit..."
            : isCreating
            ? "Creating Giveaway..."
            : `Deposit $${formData.prizeAmount} & Create Giveaway`}
        </button>
      </form>
    </div>
  );
}
