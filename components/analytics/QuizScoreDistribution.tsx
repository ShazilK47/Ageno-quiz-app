"use client";

import React, { useState, useEffect } from "react";

interface QuizScoreDistributionProps {
  attempts: {
    id: string;
    score: number;
    totalQuestions: number;
    percentageScore?: number;
  }[];
  title?: string;
}

export default function QuizScoreDistribution({
  attempts,
  title = "Score Distribution",
}: QuizScoreDistributionProps) {
  const [distribution, setDistribution] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!attempts?.length) return;

    // Calculate score ranges
    const ranges = {
      "0-20%": 0,
      "21-40%": 0,
      "41-60%": 0,
      "61-80%": 0,
      "81-100%": 0,
    };

    attempts.forEach((attempt) => {
      const score =
        attempt.percentageScore ||
        Math.round((attempt.score / attempt.totalQuestions) * 100);

      if (score <= 20) ranges["0-20%"]++;
      else if (score <= 40) ranges["21-40%"]++;
      else if (score <= 60) ranges["41-60%"]++;
      else if (score <= 80) ranges["61-80%"]++;
      else ranges["81-100%"]++;
    });

    setDistribution(ranges);
  }, [attempts]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

      <div className="space-y-4">
        {Object.entries(distribution).map(([range, count]) => {
          // Calculate percentage for bar width
          const percentage = attempts?.length
            ? Math.round((count / attempts.length) * 100)
            : 0;

          // Determine color based on score range
          let barColor;
          if (range === "0-20%") barColor = "bg-red-500";
          else if (range === "21-40%") barColor = "bg-orange-500";
          else if (range === "41-60%") barColor = "bg-yellow-500";
          else if (range === "61-80%") barColor = "bg-blue-500";
          else barColor = "bg-green-500";

          return (
            <div key={range} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">{range}</span>
                <span className="text-gray-500">
                  {count} attempt{count !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${barColor}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {!attempts?.length && (
        <div className="text-center py-6 text-gray-500">
          No data available for score distribution
        </div>
      )}
    </div>
  );
}
