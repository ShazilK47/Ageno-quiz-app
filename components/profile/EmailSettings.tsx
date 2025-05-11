"use client";

import { useState } from "react";
import {
  updateUserEmail,
  sendVerificationEmail,
} from "@/lib/actions/auth.actions";

interface EmailSettingsProps {
  user: any; // Replace with proper user type
  onMessage: (
    message: { type: "success" | "error"; text: string } | null
  ) => void;
}

export default function EmailSettings({ user, onMessage }: EmailSettingsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailPassword, setEmailPassword] = useState("");

  // Handle email update
  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      setIsSubmitting(true);
      onMessage(null);

      const result = await updateUserEmail(user, newEmail, emailPassword);

      if (result === true) {
        // Send verification email to new address
        await sendVerificationEmail(user);

        setNewEmail("");
        setEmailPassword("");

        onMessage({
          type: "success",
          text: "Email updated successfully! Please check your new email for verification.",
        });
      } else {
        onMessage({
          type: "error",
          text: result.error || "Failed to update email. Please try again.",
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

  // Handle verification email resend
  const handleResendVerification = async () => {
    if (!user) return;

    try {
      setIsSubmitting(true);
      onMessage(null);

      await sendVerificationEmail(user);

      onMessage({
        type: "success",
        text: "Verification email sent successfully!",
      });
    } catch (error) {
      onMessage({
        type: "error",
        text: "Failed to send verification email. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Email Settings</h2>

      <div className="mb-6 p-4 border rounded-md">
        <p className="font-medium">Current Email</p>
        <p className="text-gray-600">{user?.email}</p>
        {user && !user.emailVerified && (
          <div className="mt-2">
            <p className="text-amber-600 text-sm">Email not verified</p>
            <button
              onClick={handleResendVerification}
              disabled={isSubmitting}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800"
            >
              Resend verification email
            </button>
          </div>
        )}
      </div>

      <form onSubmit={handleEmailUpdate}>
        <div className="mb-4">
          <label htmlFor="newEmail" className="block text-sm font-medium mb-1">
            New Email Address
          </label>
          <input
            id="newEmail"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="mb-6">
          <label
            htmlFor="emailPassword"
            className="block text-sm font-medium mb-1"
          >
            Current Password
          </label>
          <input
            id="emailPassword"
            type="password"
            value={emailPassword}
            onChange={(e) => setEmailPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-200 disabled:bg-blue-400"
        >
          {isSubmitting ? "Updating..." : "Update Email"}
        </button>
      </form>
    </div>
  );
}
