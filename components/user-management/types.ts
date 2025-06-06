"use client";

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
  createdAt: Date | { toDate(): Date } | number; // Firestore timestamp or Date
}
