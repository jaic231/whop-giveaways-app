"use client";

import React from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

interface DateTimePickerProps {
  id: string;
  name: string;
  value: Date;
  onChange: (date: Date) => void;
  label: string;
  error?: string;
  minDate?: Date;
  placeholderText?: string;
}

export function DateTimePicker({
  id,
  name,
  value,
  onChange,
  label,
  error,
  minDate,
  placeholderText = "Select date and time...",
}: DateTimePickerProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        {label}
      </label>
      <DatePicker
        id={id}
        name={name}
        selected={value}
        onChange={(date: Date | null) => {
          if (date) onChange(date);
        }}
        showTimeSelect
        timeFormat="h:mm aa"
        timeIntervals={15}
        timeCaption="Time"
        dateFormat="MMMM d, yyyy h:mm aa"
        minDate={minDate}
        placeholderText={placeholderText}
        autoComplete="off"
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
        calendarClassName="shadow-lg border-gray-200"
        popperClassName="z-50"
        popperPlacement="bottom-start"
        showPopperArrow={false}
      />
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}

      {/* Custom styles for the date picker */}
      <style jsx global>{`
        .react-datepicker-wrapper {
          width: 100%;
        }

        .react-datepicker__input-container {
          width: 100%;
        }

        .react-datepicker__input-container input {
          width: 100% !important;
        }

        .react-datepicker {
          font-family: inherit;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
            0 4px 6px -2px rgba(0, 0, 0, 0.05);
        }

        .react-datepicker__header {
          background-color: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          border-radius: 0.5rem 0.5rem 0 0;
        }

        .react-datepicker__current-month {
          color: #1f2937;
          font-weight: 600;
        }

        .react-datepicker__day-name {
          color: #6b7280;
          font-weight: 500;
        }

        .react-datepicker__day {
          color: #374151;
          border-radius: 0.25rem;
          margin: 0.125rem;
        }

        .react-datepicker__day:hover {
          background-color: #e5e7eb;
        }

        .react-datepicker__day--selected {
          background-color: #3b82f6 !important;
          color: white !important;
        }

        .react-datepicker__day--keyboard-selected {
          background-color: #dbeafe;
          color: #1e40af;
        }

        .react-datepicker__time-container {
          border-left: 1px solid #e5e7eb;
        }

        .react-datepicker__time-list-item {
          color: #374151;
        }

        .react-datepicker__time-list-item:hover {
          background-color: #f3f4f6;
        }

        .react-datepicker__time-list-item--selected {
          background-color: #3b82f6 !important;
          color: white !important;
        }

        .react-datepicker__navigation-icon::before {
          border-color: #6b7280;
        }

        .react-datepicker__navigation:hover
          .react-datepicker__navigation-icon::before {
          border-color: #374151;
        }
      `}</style>
    </div>
  );
}
