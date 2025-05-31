"use client";

import { useState } from "react";
import type { CreateGiveawayData } from "@/lib/types";

interface CreateGiveawayFormProps {
  creatorId: string;
  creatorName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateGiveawayForm({
  creatorId,
  creatorName,
  onSuccess,
  onCancel,
}: CreateGiveawayFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateGiveawayData>({
    title: "",
    prizeAmount: 0,
    startDate: new Date(),
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Default to tomorrow
  });
  const [prizeAmountDisplay, setPrizeAmountDisplay] = useState(""); // Separate state for display
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Mock Whop balance - in real app this would come from Whop API
  const whopBalance = 15000; // $150.00 in cents

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (formData.prizeAmount <= 0) {
      newErrors.prizeAmount = "Prize amount must be greater than $0";
    }

    if (formData.prizeAmount > whopBalance) {
      newErrors.prizeAmount = `Prize amount cannot exceed your Whop balance of $${(
        whopBalance / 100
      ).toFixed(2)}`;
    }

    if (formData.startDate >= formData.endDate) {
      newErrors.endDate = "End date must be after start date";
    }

    if (formData.startDate < new Date()) {
      newErrors.startDate = "Start date cannot be in the past";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/giveaways", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          creatorId,
          creatorName,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create giveaway");
      }

      onSuccess();
    } catch (error) {
      console.error("Failed to create giveaway:", error);
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : "Failed to create giveaway. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePrizeAmountChange = (value: string) => {
    // Allow only numbers and one decimal point
    const cleanValue = value.replace(/[^0-9.]/g, "");

    // Prevent multiple decimal points
    const parts = cleanValue.split(".");
    if (parts.length > 2) {
      return; // Don't update if more than one decimal point
    }

    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return; // Don't update if more than 2 decimal places
    }

    setPrizeAmountDisplay(cleanValue);

    // Convert to cents for storage
    const dollars = parseFloat(cleanValue) || 0;
    setFormData((prev) => ({
      ...prev,
      prizeAmount: Math.round(dollars * 100),
    }));
  };

  const handlePrizeAmountBlur = () => {
    // Format properly on blur if there's a value
    if (prizeAmountDisplay && !isNaN(parseFloat(prizeAmountDisplay))) {
      const formatted = parseFloat(prizeAmountDisplay).toFixed(2);
      setPrizeAmountDisplay(formatted);
    } else if (!prizeAmountDisplay) {
      // If empty, set to 0
      setPrizeAmountDisplay("");
      setFormData((prev) => ({ ...prev, prizeAmount: 0 }));
    }
  };

  const formatDateForInput = (date: Date): string => {
    // Check if date is valid (keep this for safety)
    if (!date || isNaN(date.getTime())) {
      return "";
    }

    // Format date in local timezone for datetime-local input
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleDateChange = (field: "startDate" | "endDate", value: string) => {
    // Datepicker always provides valid dates, so we can simplify this
    const newDate = new Date(value);
    setFormData((prev) => ({
      ...prev,
      [field]: newDate,
    }));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
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
              Giveaway Name *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter giveaway name..."
            />
            {errors.title && (
              <p className="text-red-600 text-sm mt-1">{errors.title}</p>
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
                value={prizeAmountDisplay}
                onChange={(e) => handlePrizeAmountChange(e.target.value)}
                onBlur={handlePrizeAmountBlur}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Available balance: ${(whopBalance / 100).toFixed(2)}
            </p>
            {errors.prizeAmount && (
              <p className="text-red-600 text-sm mt-1">{errors.prizeAmount}</p>
            )}
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date & Time *
            </label>
            <input
              type="datetime-local"
              id="startDate"
              value={formatDateForInput(formData.startDate)}
              onChange={(e) => handleDateChange("startDate", e.target.value)}
              onKeyDown={(e) => e.preventDefault()}
              onFocus={(e) => e.target.showPicker?.()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
            />
            {errors.startDate && (
              <p className="text-red-600 text-sm mt-1">{errors.startDate}</p>
            )}
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date & Time *
            </label>
            <input
              type="datetime-local"
              id="endDate"
              value={formatDateForInput(formData.endDate)}
              onChange={(e) => handleDateChange("endDate", e.target.value)}
              onKeyDown={(e) => e.preventDefault()}
              onFocus={(e) => e.target.showPicker?.()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
            />
            {errors.endDate && (
              <p className="text-red-600 text-sm mt-1">{errors.endDate}</p>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {loading ? "Creating..." : "Create Giveaway"}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
