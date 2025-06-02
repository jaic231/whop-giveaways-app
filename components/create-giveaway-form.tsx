"use client";

import { useState, useEffect } from "react";
import { getCompanyBalance } from "@/lib/payment-service";
import { DateTimePicker } from "./date-time-picker";

interface GiveawayFormData {
  title: string;
  prizeAmount: number;
  startDate: Date;
  endDate: Date;
}

interface GiveawayFormErrors {
  title?: string;
  prizeAmount?: string;
  startDate?: string;
  endDate?: string;
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
    prizeAmount: 1.0,
    startDate: new Date(),
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Default to tomorrow
  });

  const [errors, setErrors] = useState<GiveawayFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prizeAmountDisplay, setPrizeAmountDisplay] = useState("1.00"); // Separate display state

  // Company balance state
  const [companyBalance, setCompanyBalance] = useState<number | null>(null);
  const [companyBalanceLoading, setCompanyBalanceLoading] = useState(false);
  const [companyBalanceError, setCompanyBalanceError] = useState<string | null>(
    null
  );

  const fetchCompanyBalance = async () => {
    try {
      setCompanyBalanceLoading(true);
      setCompanyBalanceError(null);
      const balance = await getCompanyBalance(companyId);
      setCompanyBalance(balance);
    } catch (error) {
      console.error("Error fetching company balance:", error);
      setCompanyBalanceError("Failed to fetch company balance");
    } finally {
      setCompanyBalanceLoading(false);
    }
  };

  // Fetch company balance when component mounts
  useEffect(() => {
    fetchCompanyBalance();
  }, [experienceId]);

  const validateForm = (): boolean => {
    const newErrors: GiveawayFormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (formData.prizeAmount <= 0) {
      newErrors.prizeAmount = "Prize amount must be positive";
    }

    // // Check if company has sufficient balance
    // if (companyBalance !== null && formData.prizeAmount > companyBalance) {
    //   newErrors.prizeAmount = "Prize amount exceeds company balance";
    // }

    if (formData.startDate >= formData.endDate) {
      newErrors.endDate = "End date must be after start date";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const giveawayData = {
        title: formData.title,
        prizeAmount: formData.prizeAmount,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString(),
        creatorId: currentUser.id,
        companyId,
        creatorName: currentUser.name || "Temp User",
      };

      const response = await fetch("/api/giveaways", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(giveawayData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create giveaway");
      }

      // Success! Show success message and reset form
      alert(`${result.message}! Giveaway ID: ${result.giveaway.id}`);

      // Reset form
      setFormData({
        title: "",
        prizeAmount: 1.0,
        startDate: new Date(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      });
      setPrizeAmountDisplay("1.00");

      // TODO: Navigate back to giveaways list or show success page
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error("Error creating giveaway:", error);
      alert(
        `Failed to create giveaway: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsSubmitting(false);
    }
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
    setFormData((prev) => ({ ...prev, prizeAmount: numericValue }));

    // Clear error
    if (errors.prizeAmount) {
      setErrors((prev) => ({ ...prev, prizeAmount: undefined }));
    }
  };

  const handlePrizeAmountBlur = () => {
    // Format properly on blur if there's a value
    if (prizeAmountDisplay && !isNaN(parseFloat(prizeAmountDisplay))) {
      const formatted = parseFloat(prizeAmountDisplay).toFixed(2);
      setPrizeAmountDisplay(formatted);
      setFormData((prev) => ({ ...prev, prizeAmount: parseFloat(formatted) }));
    } else if (!prizeAmountDisplay) {
      // If empty, set to minimum
      setPrizeAmountDisplay("0.01");
      setFormData((prev) => ({ ...prev, prizeAmount: 0.01 }));
    }
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

      {/* Company Balance Display */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
        <h3 className="text-sm font-medium text-gray-700 mb-2">
          Company Balance
        </h3>
        {companyBalanceLoading ? (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Loading balance...</span>
          </div>
        ) : companyBalanceError ? (
          <div className="flex items-center space-x-2 text-red-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm">{companyBalanceError}</span>
            <button
              onClick={fetchCompanyBalance}
              className="text-xs text-blue-600 hover:text-blue-700 underline"
            >
              Retry
            </button>
          </div>
        ) : (
          <div className="text-lg font-semibold text-green-600">
            ${companyBalance?.toFixed(2) || "0.00"}
          </div>
        )}
      </div>

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
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
              className={`w-full pl-7 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
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
        <DateTimePicker
          id="startDate"
          name="startDate"
          value={formData.startDate}
          onChange={handleStartDateChange}
          label="Start Date & Time *"
          error={errors.startDate}
          minDate={new Date()}
          placeholderText="Select when the giveaway starts..."
        />

        {/* End Date */}
        <DateTimePicker
          id="endDate"
          name="endDate"
          value={formData.endDate}
          onChange={handleEndDateChange}
          label="End Date & Time *"
          error={errors.endDate}
          minDate={formData.startDate}
          placeholderText="Select when the giveaway ends..."
        />

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || companyBalanceLoading}
          className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
            isSubmitting || companyBalanceLoading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700"
          } text-white`}
        >
          {isSubmitting ? "Creating..." : "Create Giveaway"}
        </button>
      </form>
    </div>
  );
}
