"use client";

// Format timestamp to readable date
export const formatDate = (timestamp: any) => {
  if (!timestamp) return "N/A";

  try {
    // Handle Firestore Timestamp
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (err) {
    return "Invalid date";
  }
};
