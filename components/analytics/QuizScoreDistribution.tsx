"use client";

import React, { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import { QuizResponse } from "@/types/quiz";

interface QuizScoreDistributionProps {
  responses: QuizResponse[];
  title?: string;
}

interface ScoreDistribution {
  "0-20%": number;
  "21-40%": number;
  "41-60%": number;
  "61-80%": number;
  "81-100%": number;
}

export default function QuizScoreDistribution({
  responses,
  title = "Score Distribution",
}: QuizScoreDistributionProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [distribution, setDistribution] = useState<ScoreDistribution>({
    "0-20%": 0,
    "21-40%": 0,
    "41-60%": 0,
    "61-80%": 0,
    "81-100%": 0,
  });

  // Function to render chart
  const renderChart = (distribution: ScoreDistribution) => {
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    if (!chartRef.current) return;

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    const labels = Object.keys(distribution);
    const data = Object.values(distribution);

    chartInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [
          {
            label: "Number of Attempts",
            data,
            backgroundColor: [
              "rgba(239, 68, 68, 0.7)", // red-500
              "rgba(249, 115, 22, 0.7)", // orange-500
              "rgba(234, 179, 8, 0.7)", // yellow-500
              "rgba(59, 130, 246, 0.7)", // blue-500
              "rgba(34, 197, 94, 0.7)", // green-500
            ],
            borderColor: [
              "rgba(239, 68, 68, 1)",
              "rgba(249, 115, 22, 1)",
              "rgba(234, 179, 8, 1)",
              "rgba(59, 130, 246, 1)",
              "rgba(34, 197, 94, 1)",
            ],
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              precision: 0,
            },
          },
        },
        plugins: {
          legend: {
            display: false,
          },
        },
      },
    });
  };

  useEffect(() => {
    if (!responses?.length) return;

    // Calculate score ranges
    const ranges = {
      "0-20%": 0,
      "21-40%": 0,
      "41-60%": 0,
      "61-80%": 0,
      "81-100%": 0,
    };
    responses.forEach((response) => {
      // Calculate score percentage - use percentageScore if available,
      // otherwise calculate based on score and totalQuestions if available,
      // or default to the raw score value (assuming it's already a percentage)
      let scorePercentage = response.percentageScore;

      if (scorePercentage === undefined) {
        if (
          response.totalQuestions &&
          response.totalQuestions > 0 &&
          response.score !== undefined
        ) {
          scorePercentage = Math.round(
            (response.score / response.totalQuestions) * 100
          );
        } else if (response.score !== undefined) {
          // Assume score is already a percentage if totalQuestions is not available
          scorePercentage = response.score;
        } else {
          // Skip this response if we can't determine a score
          return;
        }
      }

      // Make sure we have a valid number between 0-100
      scorePercentage = Math.max(0, Math.min(100, scorePercentage));

      if (scorePercentage <= 20) ranges["0-20%"]++;
      else if (scorePercentage <= 40) ranges["21-40%"]++;
      else if (scorePercentage <= 60) ranges["41-60%"]++;
      else if (scorePercentage <= 80) ranges["61-80%"]++;
      else ranges["81-100%"]++;
    });
    setDistribution(ranges);

    // Render the chart after updating the distribution
    renderChart(ranges);
  }, [responses]);

  // Clean up chart instance on unmount
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>

      {responses?.length ? (
        <>
          {/* Chart visualization */}
          <div className="mb-6 w-full h-60">
            <canvas ref={chartRef} />
          </div>

          {/* Bar visualization */}
          <div className="space-y-4">
            {Object.entries(distribution).map(([range, count]) => {
              // Calculate percentage for bar width
              const percentage = responses.length
                ? Math.round((count / responses.length) * 100)
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
                      {count} attempt{count !== 1 ? "s" : ""} ({percentage}%)
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
        </>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>No data available for score distribution</p>
          <p className="text-sm mt-2">
            Complete quiz attempts will appear here
          </p>
        </div>
      )}
    </div>
  );
}
