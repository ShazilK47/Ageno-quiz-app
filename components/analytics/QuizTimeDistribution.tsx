"use client";

import React, { useState, useEffect } from "react";

interface QuizTimeDistributionProps {
  attempts: {
    id: string;
    timeSpent: number;
  }[];
  title?: string;
}

export default function QuizTimeDistribution({
  attempts,
  title = "Completion Time Distribution",
}: QuizTimeDistributionProps) {
  const [distribution, setDistribution] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!attempts?.length) return;

    // Calculate time ranges (in seconds)
    const ranges = {
      "< 1 min": 0,
      "1-2 min": 0,
      "2-5 min": 0,
      "5-10 min": 0,
      "> 10 min": 0,
    };

    attempts.forEach((attempt) => {
      const timeInSeconds = attempt.timeSpent || 0;

      if (timeInSeconds < 60) ranges["< 1 min"]++;
      else if (timeInSeconds < 120) ranges["1-2 min"]++;
      else if (timeInSeconds < 300) ranges["2-5 min"]++;
      else if (timeInSeconds < 600) ranges["5-10 min"]++;
      else ranges["> 10 min"]++;
    });

    setDistribution(ranges);
  }, [attempts]);

  const formatTimeBracket = (bracket: string) => {
    return bracket;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

      <div className="space-y-4">
        {Object.entries(distribution).map(([range, count]) => {
          // Calculate percentage for bar width
          const percentage = attempts?.length
            ? Math.round((count / attempts.length) * 100)
            : 0;

          // Use a gradient from blue (fast) to purple (slow)
          let barColor;
          if (range === "< 1 min") barColor = "bg-blue-500";
          else if (range === "1-2 min") barColor = "bg-blue-600";
          else if (range === "2-5 min") barColor = "bg-indigo-500";
          else if (range === "5-10 min") barColor = "bg-purple-500";
          else barColor = "bg-purple-600";

          return (
            <div key={range} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-gray-700">
                  {formatTimeBracket(range)}
                </span>
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
          No data available for time distribution
        </div>
      )}
    </div>
  );
}
