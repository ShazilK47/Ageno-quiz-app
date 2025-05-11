"use client";

import React from "react";
import QuizScoreDistribution from "@/components/analytics/QuizScoreDistribution";
import QuizTimeDistribution from "@/components/analytics/QuizTimeDistribution";
import QuizMetrics from "@/components/analytics/QuizMetrics";

interface QuizVisualizationsProps {
  attempts: {
    id: string;
    score: number;
    totalQuestions: number;
    timeSpent: number;
    percentageScore?: number;
    quizTitle?: string;
    quizId?: string;
  }[];
  className?: string;
}

export default function QuizVisualizations({
  attempts,
  className = "",
}: QuizVisualizationsProps) {
  const [showCharts, setShowCharts] = React.useState(true);

  if (!attempts?.length) {
    return null;
  }

  return (
    <div className={`${className}`}>
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">
          Performance Visualizations
        </h2>
        <button
          onClick={() => setShowCharts(!showCharts)}
          className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 flex items-center"
        >
          {showCharts ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              Hide Charts
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Show Charts
            </>
          )}
        </button>
      </div>

      {showCharts && (
        <>
          <QuizMetrics attempts={attempts} className="mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <QuizScoreDistribution attempts={attempts} />
            <QuizTimeDistribution attempts={attempts} />
          </div>
        </>
      )}
    </div>
  );
}
