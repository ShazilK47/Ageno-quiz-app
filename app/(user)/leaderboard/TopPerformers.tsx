"use client";

interface TopPerformersProps {
  topEntries: Array<{
    id: string;
    username: string;
    quizTitle: string;
    score: number;
    timeTaken: number;
    completedAt: Date;
    rank?: number;
    normalizedScore?: number;
  }>;
  showGlobalRanking?: boolean;
}

export default function TopPerformers({
  topEntries,
  showGlobalRanking = false,
}: TopPerformersProps) {
  if (!topEntries || topEntries.length === 0) {
    return null;
  }
  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold mb-2 text-gray-800">Top Performers</h2>
      <p className="text-gray-600 mb-6">
        {showGlobalRanking
          ? "Overall ranking based on combined scores across all quizzes, difficulty levels, and completion time"
          : "Top performers for this specific quiz based on score, difficulty, and completion time"}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {topEntries.slice(0, 3).map((entry, index) => (
          <div
            key={entry.id}
            className={`bg-white p-6 rounded-xl shadow-sm border-t-4 transition-transform hover:scale-[1.01] ${
              index === 0
                ? "border-yellow-500"
                : index === 1
                ? "border-gray-400"
                : "border-amber-700"
            }`}
          >
            <div className="flex items-center mb-4">
              <div
                className={`w-12 h-12 flex items-center justify-center rounded-full text-2xl mr-4 ${
                  index === 0
                    ? "bg-yellow-100 text-yellow-700"
                    : index === 1
                    ? "bg-gray-100 text-gray-600"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
              </div>
              <div>
                <h3 className="font-bold text-lg line-clamp-1">
                  {entry.username}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-1">
                  {showGlobalRanking ? entry.quizTitle : entry.quizTitle}
                </p>
              </div>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <div>
                <p className="font-medium">
                  {showGlobalRanking ? "Avg. Score" : "Score"}
                </p>
                <p className="text-xl font-bold text-indigo-600">
                  {entry.score}%
                </p>
                {showGlobalRanking && entry.normalizedScore && (
                  <p className="text-xs text-gray-500">
                    Total: {entry.normalizedScore.toFixed(0)} pts
                  </p>
                )}
              </div>
              <div>
                <p className="font-medium">
                  {showGlobalRanking ? "Best Time" : "Time"}
                </p>
                <p className="text-lg">{formatTime(entry.timeTaken)}</p>
              </div>
              <div>
                <p className="font-medium">
                  {showGlobalRanking ? "Latest" : "Date"}
                </p>
                <p>{formatDate(entry.completedAt)}</p>
              </div>
            </div>
          </div>
        ))}
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
