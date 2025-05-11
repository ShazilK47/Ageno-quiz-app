"use client";

import { useState, useEffect } from "react";
import { updateUserProfile } from "@/lib/actions/auth.actions";

interface ProfileInfoProps {
  user: any; // Replace with proper user type
  onMessage: (
    message: { type: "success" | "error"; text: string } | null
  ) => void;
}

export default function ProfileInfo({ user, onMessage }: ProfileInfoProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [displayName, setDisplayName] = useState("");

  // Update states based on user data
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
    }
  }, [user]);

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    try {
      setIsSubmitting(true);
      onMessage(null);

      const result = await updateUserProfile(user, { displayName });

      if (result === true) {
        onMessage({
          type: "success",
          text: "Profile updated successfully!",
        });
      } else {
        onMessage({
          type: "error",
          text: result.error || "Failed to update profile. Please try again.",
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
      <h2 className="text-2xl font-semibold mb-6">Profile Information</h2>
      <form onSubmit={handleProfileUpdate}>
        <div className="mb-4">
          <label
            htmlFor="displayName"
            className="block text-sm font-medium mb-1"
          >
            Display Name
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition duration-200 disabled:bg-blue-400"
        >
          {isSubmitting ? "Updating..." : "Update Profile"}
        </button>
      </form>
    </div>
  );
}
