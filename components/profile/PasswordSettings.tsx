"use client";

import { useState } from "react";
import { updateUserPassword } from "@/lib/actions/auth.actions";

interface PasswordSettingsProps {
  user: any; // Replace with proper user type
  onMessage: (
    message: { type: "success" | "error"; text: string } | null
  ) => void;
}

export default function PasswordSettings({
  user,
  onMessage,
}: PasswordSettingsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Handle password update
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    // Validate password match
    if (newPassword !== confirmPassword) {
      onMessage({
        type: "error",
        text: "New passwords do not match.",
      });
      return;
    }

    // Validate password strength
    if (newPassword.length < 8) {
      onMessage({
        type: "error",
        text: "Password must be at least 8 characters long.",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      onMessage(null);

      const result = await updateUserPassword(
        user,
        currentPassword,
        newPassword
      );

      if (result === true) {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        onMessage({
          type: "success",
          text: "Password updated successfully!",
        });
      } else {
        onMessage({
          type: "error",
          text: result.error || "Failed to update password. Please try again.",
        });
      }
    } catch (error) {
      onMessage({
        type: "error",
        text: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Password Settings</h2>

      <form onSubmit={handlePasswordUpdate}>
        <div className="mb-4">
          <label
            htmlFor="currentPassword"
            className="block text-sm font-medium mb-1"
          >
            Current Password
          </label>
          <input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-4">
          <label
            htmlFor="newPassword"
            className="block text-sm font-medium mb-1"
          >
            New Password
          </label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            minLength={8}
          />
          <p className="text-xs text-gray-500 mt-1">
            Must be at least 8 characters long
          </p>
        </div>

        <div className="mb-6">
          <label
            htmlFor="confirmPassword"
            className="block text-sm font-medium mb-1"
          >
            Confirm New Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-200 disabled:bg-blue-400"
        >
          {isSubmitting ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}
