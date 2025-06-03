"use client";

import { useAuth } from "@/contexts/auth-context";

export interface UserRankProps {
  currentUserEntry: {
    id: string;
    username: string;
    quizTitle: string;
    score: number;
    completedAt: Date;
    timeTaken: number;
    rank?: number;
    normalizedScore?: number;
  } | null;
  isLoading: boolean;
  isGlobalRanking?: boolean;
}

export default function UserRank({
  currentUserEntry,
  isLoading,
  isGlobalRanking = false,
}: UserRankProps) {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm mb-6 animate-pulse">
        <div className="h-16 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (!currentUserEntry) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm mb-6">
        <div className="text-center">
          <p className="text-gray-500">
            You haven&apos;t taken any quizzes yet, or your results don&apos;t
            match the current filters.
          </p>
          <p className="text-sm text-gray-400 mt-1">
            Complete a quiz to appear on the leaderboard!
          </p>
        </div>
      </div>
    );
  }
  // UI for when we have the user's entry
  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl shadow-sm mb-6 border border-indigo-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-indigo-600 text-white w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg">
            #{currentUserEntry.rank}
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Your Current Ranking</h3>
            <p className="text-sm text-gray-500">
              {isGlobalRanking
                ? "Based on your overall performance across all quizzes"
                : `Based on your performance in ${currentUserEntry.quizTitle}`}
            </p>
          </div>
        </div>

        <div className="flex gap-6">
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              {isGlobalRanking ? "Avg. Score" : "Score"}
            </p>
            <p className="text-lg font-bold text-indigo-700">
              {currentUserEntry.score}%
            </p>
            {isGlobalRanking && currentUserEntry.normalizedScore && (
              <p className="text-xs text-gray-500">
                Total: {currentUserEntry.normalizedScore.toFixed(0)} pts
              </p>
            )}
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              {isGlobalRanking ? "Best Time" : "Time"}
            </p>
            <p className="text-lg font-medium">
              {formatTime(currentUserEntry.timeTaken)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              {isGlobalRanking ? "Latest Quiz" : "Completed On"}
            </p>
            <p className="text-lg font-medium">
              {formatDate(currentUserEntry.completedAt)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSecs = seconds % 60;
  return `${minutes}m ${remainingSecs}s`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}
