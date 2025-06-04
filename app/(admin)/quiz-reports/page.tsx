/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  getDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/firebase/client";
import QuizScoreDistribution from "@/components/analytics/QuizScoreDistribution";
import QuizTimeDistribution from "@/components/analytics/QuizTimeDistribution";
import { FiFilter, FiDownload } from "react-icons/fi";

interface QuizResponse {
  id: string;
  quizId: string;
  userId: string;
  startedAt: any;
  submittedAt: any;
  score: number;
  tabSwitchCount: number;
  cameraFlags: string[];
  userName?: string;
  quizTitle?: string;
}

export default function QuizReportsPage() {
  const [responses, setResponses] = useState<QuizResponse[]>([]);
  const [filteredResponses, setFilteredResponses] = useState<QuizResponse[]>(
    []
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [quizOptions, setQuizOptions] = useState<
    { id: string; title: string }[]
  >([]);
  const [selectedQuiz, setSelectedQuiz] = useState<string>("all");
  const [dateRange, setDateRange] = useState<"all" | "week" | "month">("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

  useEffect(() => {
    fetchReportsData();
  }, []);

  useEffect(() => {
    filterResponses();
  }, [responses, selectedQuiz, dateRange, sortOrder]);

  const fetchReportsData = async () => {
    try {
      setIsLoading(true);

      // Fetch all responses
      const responsesRef = collection(db, "responses");
      const q = query(responsesRef, orderBy("submittedAt", "desc"));
      const querySnapshot = await getDocs(q);

      const responsesList: QuizResponse[] = [];
      const quizzesMap = new Map<string, { id: string; title: string }>();
      const usersCache = new Map<string, string>(); // userId -> userName

      // Process each response
      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data() as Omit<QuizResponse, "id">;

        // Skip if no quizId or userId
        if (!data.quizId || !data.userId) continue;

        let quizTitle = "Unknown Quiz";
        let userName = "Unknown User";

        // Get quiz information (using cache if available)
        if (!quizzesMap.has(data.quizId)) {
          try {
            const quizDoc = await getDoc(doc(db, "quizzes", data.quizId));
            if (quizDoc.exists()) {
              quizTitle = quizDoc.data().title || quizTitle;
              quizzesMap.set(data.quizId, {
                id: data.quizId,
                title: quizTitle,
              });
            }
          } catch (error) {
            console.error("Error fetching quiz:", error);
          }
        } else {
          quizTitle = quizzesMap.get(data.quizId)!.title;
        }

        // Get user information (using cache if available)
        if (!usersCache.has(data.userId)) {
          try {
            const userDoc = await getDoc(doc(db, "users", data.userId));
            if (userDoc.exists()) {
              userName =
                userDoc.data().displayName || userDoc.data().email || userName;
              usersCache.set(data.userId, userName);
            }
          } catch (error) {
            console.error("Error fetching user:", error);
          }
        } else {
          userName = usersCache.get(data.userId)!;
        }

        responsesList.push({
          id: docSnapshot.id,
          ...data,
          quizTitle,
          userName,
        });
      }

      setResponses(responsesList);
      setQuizOptions(Array.from(quizzesMap.values()));
    } catch (error) {
      console.error("Error fetching reports data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterResponses = () => {
    let filtered = [...responses];

    // Filter by quiz
    if (selectedQuiz !== "all") {
      filtered = filtered.filter(
        (response) => response.quizId === selectedQuiz
      );
    }

    // Filter by date range
    if (dateRange !== "all") {
      const now = new Date();
      const cutoffDate = new Date();

      if (dateRange === "week") {
        cutoffDate.setDate(now.getDate() - 7); // Last 7 days
      } else if (dateRange === "month") {
        cutoffDate.setMonth(now.getMonth() - 1); // Last 30 days
      }

      filtered = filtered.filter((response) => {
        const submittedDate = response.submittedAt?.toDate
          ? response.submittedAt.toDate()
          : new Date(response.submittedAt);
        return submittedDate >= cutoffDate;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const dateA = a.submittedAt?.toDate
        ? a.submittedAt.toDate()
        : new Date(a.submittedAt || 0);
      const dateB = b.submittedAt?.toDate
        ? b.submittedAt.toDate()
        : new Date(b.submittedAt || 0);
      return sortOrder === "asc"
        ? dateA.getTime() - dateB.getTime()
        : dateB.getTime() - dateA.getTime();
    });

    setFilteredResponses(filtered);
  };

  // Format date to readable string
  const formatDate = (timestamp: any): string => {
    if (!timestamp) return "Unknown";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    });
  };

  // Calculate time taken in minutes and seconds
  const calculateTimeTaken = (startTime: any, endTime: any): string => {
    if (!startTime || !endTime) return "Unknown";

    const start = startTime.toDate ? startTime.toDate() : new Date(startTime);
    const end = endTime.toDate ? endTime.toDate() : new Date(endTime);

    const diffSeconds = Math.floor((end.getTime() - start.getTime()) / 1000);
    const minutes = Math.floor(diffSeconds / 60);
    const seconds = diffSeconds % 60;

    return `${minutes}m ${seconds}s`;
  };

  // Calculate stats
  const calculateStats = () => {
    if (filteredResponses.length === 0) {
      return {
        avgScore: 0,
        highestScore: 0,
        lowestScore: 0,
        avgTime: "0m 0s",
        totalAttempts: 0,
      };
    }

    let totalScore = 0;
    let highestScore = 0;
    let lowestScore = 100;
    let totalTimeSeconds = 0;

    filteredResponses.forEach((response) => {
      // Process scores
      if (response.score !== null && response.score !== undefined) {
        totalScore += response.score;
        highestScore = Math.max(highestScore, response.score);
        lowestScore = Math.min(lowestScore, response.score);
      }

      // Process time taken
      if (response.startedAt && response.submittedAt) {
        const start = response.startedAt.toDate
          ? response.startedAt.toDate()
          : new Date(response.startedAt);
        const end = response.submittedAt.toDate
          ? response.submittedAt.toDate()
          : new Date(response.submittedAt);
        totalTimeSeconds += Math.floor(
          (end.getTime() - start.getTime()) / 1000
        );
      }
    });

    const avgScore = Math.round(totalScore / filteredResponses.length);
    const avgTimeSeconds = Math.floor(
      totalTimeSeconds / filteredResponses.length
    );
    const avgMinutes = Math.floor(avgTimeSeconds / 60);
    const avgSeconds = avgTimeSeconds % 60;

    return {
      avgScore,
      highestScore,
      lowestScore: Math.min(lowestScore, 100), // In case there are no valid scores
      avgTime: `${avgMinutes}m ${avgSeconds}s`,
      totalAttempts: filteredResponses.length,
    };
  };

  const stats = calculateStats();

  // Export data to CSV
  const exportToCSV = () => {
    if (filteredResponses.length === 0) return;

    const headers = [
      "Quiz Title",
      "User Name",
      "Score (%)",
      "Time Taken",
      "Submitted At",
      "Tab Switches",
      "Camera Flags",
    ];

    const rows = filteredResponses.map((response) => [
      response.quizTitle || "Unknown Quiz",
      response.userName || "Unknown User",
      response.score !== null && response.score !== undefined
        ? response.score
        : "N/A",
      calculateTimeTaken(response.startedAt, response.submittedAt),
      formatDate(response.submittedAt),
      response.tabSwitchCount || 0,
      (response.cameraFlags || []).length,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "quiz-reports.csv");
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quiz Reports</h1>
          <p className="text-gray-600">
            View and analyze quiz performance data
          </p>
        </div>

        <button
          onClick={exportToCSV}
          disabled={filteredResponses.length === 0}
          className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium ${
            filteredResponses.length === 0
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          }`}
        >
          <FiDownload className="mr-2" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center flex-grow">
            <FiFilter className="mr-2 text-gray-400" />
            <div className="w-full md:w-64 md:mr-4">
              <select
                value={selectedQuiz}
                onChange={(e) => setSelectedQuiz(e.target.value)}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              >
                <option value="all">All Quizzes</option>
                {quizOptions.map((quiz) => (
                  <option key={quiz.id} value={quiz.id}>
                    {quiz.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="w-full md:w-auto">
              <select
                value={dateRange}
                onChange={(e) =>
                  setDateRange(e.target.value as "all" | "week" | "month")
                }
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              >
                <option value="all">All Time</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>

            <div className="w-full md:w-auto">
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as "desc" | "asc")}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm font-medium text-gray-500">Total Attempts</p>
          <p className="mt-1 text-3xl font-semibold text-gray-900">
            {stats.totalAttempts}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm font-medium text-gray-500">Average Score</p>
          <p className="mt-1 text-3xl font-semibold text-purple-600">
            {stats.avgScore}%
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm font-medium text-gray-500">Highest Score</p>
          <p className="mt-1 text-3xl font-semibold text-green-600">
            {stats.highestScore}%
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm font-medium text-gray-500">Lowest Score</p>
          <p className="mt-1 text-3xl font-semibold text-red-600">
            {stats.lowestScore}%
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm font-medium text-gray-500">Average Time</p>
          <p className="mt-1 text-3xl font-semibold text-blue-600">
            {stats.avgTime}
          </p>
        </div>
      </div>

      {/* Visualizations */}
      {filteredResponses.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Score Distribution
            </h3>
            <QuizScoreDistribution responses={filteredResponses} />
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Completion Time
            </h3>
            <QuizTimeDistribution responses={filteredResponses} />
          </div>
        </div>
      )}

      {/* Responses Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Quiz Attempts</h3>
        </div>

        {isLoading ? (
          <div className="p-6 text-center">
            <div className="inline-block animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
            <p className="mt-2 text-gray-600">Loading reports...</p>
          </div>
        ) : filteredResponses.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-600">
              No quiz attempts found for the selected filters.
            </p>
            <button
              onClick={() => {
                setSelectedQuiz("all");
                setDateRange("all");
              }}
              className="mt-2 text-purple-600 hover:text-purple-800 underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quiz
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time Taken
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tab Switches
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Camera Issues
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredResponses.map((response) => (
                  <tr key={response.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {response.quizTitle || "Unknown Quiz"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {response.userName || "Unknown User"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {response.score !== null &&
                      response.score !== undefined ? (
                        <div
                          className={`text-sm font-medium ${
                            response.score >= 70
                              ? "text-green-600"
                              : response.score >= 40
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {response.score}%
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">Not Graded</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {calculateTimeTaken(
                        response.startedAt,
                        response.submittedAt
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(response.submittedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {response.tabSwitchCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(response.cameraFlags || []).length > 0 ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {response.cameraFlags.length} issues
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          None
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
