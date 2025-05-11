"use client";

import React from "react";

interface AttemptDetailsProps {
  attempt: {
    id: string;
    quizId: string;
    quizTitle: string;
    userId: string;
    userName: string;
    userEmail: string;
    score: number;
    totalQuestions: number;
    timestamp: any;
    timeSpent: number;
    percentageScore?: number;
    tabSwitchCount?: number;
    answers?: Array<{
      questionId: string;
      questionText?: string;
      selectedAnswer?: string;
      correctAnswer?: string;
      isCorrect?: boolean;
    }>;
  };
  onClose: () => void;
}

export default function AttemptDetails({
  attempt,
  onClose,
}: AttemptDetailsProps) {
  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString() + " " + date.toLocaleTimeString();
    } catch (e) {
      return "Invalid date";
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "N/A";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              Quiz Attempt Details
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <svg
                className="h-6 w-6"
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
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Main Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Quiz</h3>
              <p className="text-lg font-semibold mb-4">{attempt.quizTitle}</p>

              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Taken By
              </h3>
              <p className="text-lg font-semibold mb-4">{attempt.userName}</p>

              <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
              <p className="text-lg font-semibold">{attempt.userEmail}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Date & Time
              </h3>
              <p className="text-lg font-semibold mb-4">
                {formatDate(attempt.timestamp)}
              </p>

              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Duration
              </h3>
              <p className="text-lg font-semibold mb-4">
                {formatDuration(attempt.timeSpent)}
              </p>

              <h3 className="text-sm font-medium text-gray-500 mb-1">
                Tab Switches
              </h3>
              <p className="text-lg font-semibold">
                {attempt.tabSwitchCount !== undefined
                  ? attempt.tabSwitchCount
                  : "N/A"}
              </p>
            </div>
          </div>

          {/* Score Section */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Score Summary</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="text-sm font-medium text-gray-500 mb-1">
                  Raw Score
                </h4>
                <p className="text-xl font-bold">
                  {attempt.score} / {attempt.totalQuestions}
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="text-sm font-medium text-gray-500 mb-1">
                  Percentage
                </h4>
                <p
                  className={`text-xl font-bold ${
                    (attempt.percentageScore || 0) >= 70
                      ? "text-green-600"
                      : (attempt.percentageScore || 0) >= 40
                      ? "text-yellow-600"
                      : "text-red-600"
                  }`}
                >
                  {attempt.percentageScore || 0}%
                </p>
              </div>

              <div className="bg-white p-4 rounded-lg shadow-sm">
                <h4 className="text-sm font-medium text-gray-500 mb-1">
                  Status
                </h4>
                <p
                  className={`text-xl font-bold ${
                    (attempt.percentageScore || 0) >= 60
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {(attempt.percentageScore || 0) >= 60 ? "Passed" : "Failed"}
                </p>
              </div>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Score Breakdown</h3>
            <div className="h-4 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  (attempt.percentageScore || 0) >= 70
                    ? "bg-green-500"
                    : (attempt.percentageScore || 0) >= 40
                    ? "bg-yellow-500"
                    : "bg-red-500"
                }`}
                style={{ width: `${attempt.percentageScore || 0}%` }}
              />
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Answers Section */}
          {attempt.answers && attempt.answers.length > 0 ? (
            <div>
              <h3 className="text-lg font-semibold mb-4">Question Responses</h3>
              <div className="space-y-4">
                {attempt.answers.map((answer, index) => (
                  <div
                    key={answer.questionId || index}
                    className={`p-4 rounded-lg border ${
                      answer.isCorrect
                        ? "border-green-200 bg-green-50"
                        : "border-red-200 bg-red-50"
                    }`}
                  >
                    <div className="flex justify-between mb-2">
                      <h4 className="font-medium">Question {index + 1}</h4>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          answer.isCorrect
                            ? "bg-green-200 text-green-800"
                            : "bg-red-200 text-red-800"
                        }`}
                      >
                        {answer.isCorrect ? "Correct" : "Incorrect"}
                      </span>
                    </div>

                    {answer.questionText && (
                      <p className="text-gray-700 mb-3">
                        {answer.questionText}
                      </p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs font-medium text-gray-500 mb-1">
                          Selected Answer
                        </p>
                        <p className="text-sm">
                          {answer.selectedAnswer || "No selection"}
                        </p>
                      </div>

                      {!answer.isCorrect && answer.correctAnswer && (
                        <div>
                          <p className="text-xs font-medium text-gray-500 mb-1">
                            Correct Answer
                          </p>
                          <p className="text-sm">{answer.correctAnswer}</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <p>
                Detailed answer information is not available for this attempt.
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
