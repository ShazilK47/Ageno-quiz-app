"use client";

// Format timestamp to readable date
export const formatDate = (timestamp: Date | { toDate(): Date } | number | undefined) => {
  if (!timestamp) return "N/A";

  try {
    // Handle Firestore Timestamp
    const date = typeof timestamp === 'object' && 'toDate' in timestamp 
      ? timestamp.toDate() 
      : new Date(timestamp as number);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short", 
      day: "numeric",
    });
    } catch (
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _
    ) {
    return "Invalid date";
  }
};
