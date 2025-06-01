"use client";

import { useState, useMemo, useEffect } from "react";
import type { CreateGiveawayData } from "@/lib/types";
import { DateTimePicker } from "./date-time-picker";
import { getUserBalance } from "@/lib/payment-service";

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
  const [error, setError] = useState<string | null>(null);
  const [showDepositInfo, setShowDepositInfo] = useState(false);

  // User balance state
  const [whopBalance, setWhopBalance] = useState<number>(0);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [balanceError, setBalanceError] = useState<string | null>(null);

  // Fetch user balance on component mount
  useEffect(() => {
    const fetchBalance = async () => {
      try {
        setBalanceLoading(true);
        setBalanceError(null);
        const balance = await getUserBalance();
        setWhopBalance(balance);
      } catch (error) {
        console.error("Failed to fetch user balance:", error);
        setBalanceError("Failed to load balance");
        setWhopBalance(0); // Fallback to 0
      } finally {
        setBalanceLoading(false);
      }
    };

    fetchBalance();
  }, []);

  // Memoize form validation to prevent infinite re-renders
  const isFormValid = useMemo(() => {
    if (!formData.title.trim()) return false;
    if (formData.prizeAmount <= 0) return false;
    if (formData.prizeAmount > whopBalance) return false;
    if (formData.startDate >= formData.endDate) return false;
    if (formData.startDate < new Date()) return false;
    return true;
  }, [formData, whopBalance]);

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

    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      // Create deposit charge first
      const depositResponse = await fetch("/api/giveaways/deposit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: creatorId,
          amount: formData.prizeAmount,
          giveawayTitle: formData.title,
          experienceId: window.location.pathname.split("/")[2], // Extract from URL
        }),
      });

      if (!depositResponse.ok) {
        const error = await depositResponse.json();
        throw new Error(error.error || "Failed to create deposit charge");
      }

      const { checkoutUrl, chargeId } = await depositResponse.json();

      if (!checkoutUrl) {
        throw new Error("No checkout URL received");
      }

      // Store giveaway data in localStorage to create after payment
      localStorage.setItem(
        "pendingGiveaway",
        JSON.stringify({
          title: formData.title,
          prizeAmount: formData.prizeAmount,
          startDate: formData.startDate.toISOString(),
          endDate: formData.endDate.toISOString(),
          creatorId,
          creatorName,
          depositChargeId: chargeId,
        })
      );

      // Redirect to Whop checkout
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error("Failed to create giveaway:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create giveaway"
      );
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
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
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                placeholder="0.00"
                disabled={balanceLoading}
              />
            </div>
            {balanceLoading ? (
              <p className="text-sm text-gray-500 mt-1">Loading balance...</p>
            ) : balanceError ? (
              <p className="text-sm text-red-500 mt-1">{balanceError}</p>
            ) : (
              <p className="text-sm text-gray-500 mt-1">
                Available balance: ${(whopBalance / 100).toFixed(2)}
              </p>
            )}
            {errors.prizeAmount && (
              <p className="text-red-600 text-sm mt-1">{errors.prizeAmount}</p>
            )}
          </div>

          {/* Start Date */}
          <DateTimePicker
            id="startDate"
            name="startDate"
            value={formData.startDate}
            onChange={(date) =>
              setFormData((prev) => ({ ...prev, startDate: date }))
            }
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
            onChange={(date) =>
              setFormData((prev) => ({ ...prev, endDate: date }))
            }
            label="End Date & Time *"
            error={errors.endDate}
            minDate={formData.startDate}
            placeholderText="Select when the giveaway ends..."
          />

          {/* Submit Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 bg-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-400 transition-colors font-medium disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => setShowDepositInfo(!showDepositInfo)}
              className="px-4 py-3 text-blue-600 hover:text-blue-700 font-medium"
              title="Learn about deposits"
            >
              ℹ️
            </button>

            <button
              type="submit"
              disabled={loading || !isFormValid || balanceLoading}
              className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? "Processing..."
                : `Create & Pay Deposit ($${(
                    formData.prizeAmount / 100
                  ).toFixed(2)})`}
            </button>
          </div>
        </form>

        {/* Deposit Info */}
        {showDepositInfo && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">About Deposits</h4>
            <p className="text-sm text-blue-800 mb-2">
              To ensure fair giveaways, you must deposit the full prize amount
              when creating a giveaway.
            </p>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Your deposit is held securely by Whop</li>
              <li>• Prize money is automatically paid to the winner</li>
              <li>• If no one enters, your deposit is refunded</li>
              <li>• You cannot enter your own giveaway</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
