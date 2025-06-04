"use client";

import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import { QuizResponse } from "@/types/quiz";

interface QuizTimeDistributionProps {
  responses: QuizResponse[];
}

export default function QuizTimeDistribution({
  responses,
}: QuizTimeDistributionProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  useEffect(() => {
    if (!chartRef.current || responses.length === 0) return;

    // Clean up any existing chart
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // Calculate time ranges (in seconds)
    const ranges = {
      "< 1 min": 0,
      "1-3 min": 0,
      "3-5 min": 0,
      "5-10 min": 0,
      "> 10 min": 0,
    };

    responses.forEach((response) => {
      if (!response.startedAt || !response.submittedAt) return;

      let startTime: Date;
      if (typeof response.startedAt === "number") {
        startTime = new Date(response.startedAt);
      } else if (response.startedAt instanceof Date) {
        startTime = response.startedAt;
      } else if (
        "toDate" in response.startedAt &&
        typeof response.startedAt.toDate === "function"
      ) {
        startTime = response.startedAt.toDate();
      } else {
        // Handle other cases or use a fallback
        return;
      }

      let endTime: Date;
      if (typeof response.submittedAt === "number") {
        endTime = new Date(response.submittedAt);
      } else if (response.submittedAt instanceof Date) {
        endTime = response.submittedAt;
      } else if (
        "toDate" in response.submittedAt &&
        typeof response.submittedAt.toDate === "function"
      ) {
        endTime = response.submittedAt.toDate();
      } else {
        // Handle other cases or use a fallback
        return;
      }

      const timeInSeconds = Math.floor(
        (endTime.getTime() - startTime.getTime()) / 1000
      );

      if (timeInSeconds < 60) ranges["< 1 min"]++;
      else if (timeInSeconds < 180) ranges["1-3 min"]++;
      else if (timeInSeconds < 300) ranges["3-5 min"]++;
      else if (timeInSeconds < 600) ranges["5-10 min"]++;
      else ranges["> 10 min"]++;
    });

    // Create the chart
    const ctx = chartRef.current.getContext("2d");

    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: "bar",
        data: {
          labels: Object.keys(ranges),
          datasets: [
            {
              label: "Number of Attempts",
              data: Object.values(ranges),
              backgroundColor: [
                "rgba(75, 192, 192, 0.7)", // Teal
                "rgba(54, 162, 235, 0.7)", // Blue
                "rgba(153, 102, 255, 0.7)", // Purple
                "rgba(255, 159, 64, 0.7)", // Orange
                "rgba(255, 99, 132, 0.7)", // Red
              ],
              borderColor: [
                "rgb(75, 192, 192)",
                "rgb(54, 162, 235)",
                "rgb(153, 102, 255)",
                "rgb(255, 159, 64)",
                "rgb(255, 99, 132)",
              ],
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: "Quiz Completion Time",
            },
            legend: {
              display: false,
            },
            tooltip: {
              callbacks: {
                label: function (context) {
                  return `${context.parsed.y} attempt${
                    context.parsed.y !== 1 ? "s" : ""
                  }`;
                },
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0,
              },
              title: {
                display: true,
                text: "Number of Attempts",
              },
            },
            x: {
              title: {
                display: true,
                text: "Time Taken",
              },
            },
          },
        },
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [responses]);

  if (responses.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">No data available</div>
    );
  }
  return (
    <div style={{ height: "300px" }}>
      <canvas ref={chartRef} />
    </div>
  );
}
