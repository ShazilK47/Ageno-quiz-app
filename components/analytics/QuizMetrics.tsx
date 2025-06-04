"use client";

import React from "react";
import { QuizResponse } from "@/types/quiz";

interface QuizMetricsProps {
  attempts: QuizResponse[];
  className?: string;
}

export default function QuizMetrics({
  attempts,
  className = "",
}: QuizMetricsProps) {
  if (!attempts || attempts.length === 0) return null;

  interface QuizMetricsData {
    quizId: string;
    quizTitle: string;
    attemptCount: number;
    totalScore: number;
    totalTime: number;
    passingCount: number;
    avgScore?: number;
    avgTime?: number;
    passRate?: number;
  }

  // Group attempts by quiz
  const quizData = attempts.reduce((acc, attempt) => {
    const quizId = attempt.quizId || "unknown";
    if (!acc[quizId]) {
      acc[quizId] = {
        quizId,
        quizTitle: attempt.quizTitle || "Unknown Quiz",
        attemptCount: 0,
        totalScore: 0,
        totalTime: 0,
        passingCount: 0, // 60% or higher is considered passing
      };
    }

    acc[quizId].attemptCount += 1;
    acc[quizId].totalScore += attempt.percentageScore || 0;
    acc[quizId].totalTime += attempt.timeSpent || 0;

    if ((attempt.percentageScore || 0) >= 60) {
      acc[quizId].passingCount += 1;
    }

    return acc;
  }, {} as Record<string, QuizMetricsData>);

  // Convert to array and sort by attempt count
  const quizMetrics = Object.values(quizData)
    .map((quiz) => ({
      ...quiz,
      avgScore: Math.round(quiz.totalScore / quiz.attemptCount),
      avgTime: Math.round(quiz.totalTime / quiz.attemptCount),
      passRate: Math.round((quiz.passingCount / quiz.attemptCount) * 100),
    }))
    .sort((a, b) => b.attemptCount - a.attemptCount);

  // Calculate total statistics
  const totalAttempts = attempts.length;
  const totalPassingAttempts = attempts.filter(
    (a) => (a.percentageScore || 0) >= 60
  ).length;
  const overallPassRate = Math.round(
    (totalPassingAttempts / totalAttempts) * 100
  );
  const avgScore = Math.round(
    attempts.reduce((acc, a) => acc + (a.percentageScore || 0), 0) /
      totalAttempts
  );
  const avgTime = Math.round(
    attempts.reduce((acc, a) => acc + (a.timeSpent || 0), 0) / totalAttempts
  );

  return (
    <div
      className={`bg-white p-6 rounded-lg shadow-sm border border-gray-200 ${className}`}
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Quiz Performance Metrics
      </h3>

      {/* Overall metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-purple-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-purple-700">
            Overall Pass Rate
          </p>
          <p className="text-2xl font-bold text-purple-800">
            {overallPassRate}%
          </p>
          <div className="mt-2 bg-white h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500"
              style={{ width: `${overallPassRate}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-blue-700">Average Score</p>
          <p className="text-2xl font-bold text-blue-800">{avgScore}%</p>
          <div className="mt-2 bg-white h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500"
              style={{ width: `${avgScore}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm font-medium text-green-700">Average Time</p>
          <p className="text-2xl font-bold text-green-800">
            {Math.floor(avgTime / 60)}m {avgTime % 60}s
          </p>
          <div className="mt-2 bg-white h-2 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-500"
              style={{ width: `${Math.min(100, (avgTime / 600) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Individual quiz metrics */}
      {quizMetrics.length > 0 && (
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">
            Performance by Quiz
          </h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quiz
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Attempts
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg. Score
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg. Time
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pass Rate
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {quizMetrics.map((quiz) => (
                  <tr key={quiz.quizId} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {quiz.quizTitle}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {quiz.attemptCount}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      <div
                        className={`font-medium ${
                          quiz.avgScore >= 70
                            ? "text-green-600"
                            : quiz.avgScore >= 40
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {quiz.avgScore}%
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                      {Math.floor(quiz.avgTime / 60)}m {quiz.avgTime % 60}s
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm">
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-2.5 mr-2">
                          <div
                            className={`h-2.5 rounded-full ${
                              quiz.passRate >= 70
                                ? "bg-green-500"
                                : quiz.passRate >= 40
                                ? "bg-yellow-500"
                                : "bg-red-500"
                            }`}
                            style={{ width: `${quiz.passRate}%` }}
                          ></div>
                        </div>
                        <span>{quiz.passRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
