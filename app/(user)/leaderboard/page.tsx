"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  getDoc,
  doc,
} from "firebase/firestore";
import { db } from "@/firebase/client";

type LeaderboardEntry = {
  id: string;
  username: string;
  quizTitle: string;
  score: number;
  completedAt: Date;
  timeTaken: number; // in seconds
  rank?: number;
  quizId?: string;
};

const LeaderboardPage = () => {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFrame, setTimeFrame] = useState<"all" | "week" | "month">("all");
  // Removed unused state variable

  // Add a state for user info cache
  const [userInfoCache, setUserInfoCache] = useState<Record<string, string>>(
    {}
  );
  const [quizInfoCache, setQuizInfoCache] = useState<Record<string, string>>(
    {}
  );

  // New function to fetch user display names wrapped in useCallback
  const fetchUserInfo = useCallback(
    async (userIds: string[]) => {
      try {
        const uniqueIds = [...new Set(userIds)].filter(
          (id) => !userInfoCache[id]
        );
        if (uniqueIds.length === 0) return;

        const userInfo: Record<string, string> = {};

        // Could be replaced with a batch get if you have a users collection
        // For now, we'll just use user IDs as display names
        uniqueIds.forEach((id) => {
          userInfo[id] = `User ${id.substring(0, 6)}`;
        });

        setUserInfoCache((prev) => ({ ...prev, ...userInfo }));
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    },
    [userInfoCache]
  );

  // New function to fetch quiz titles - improved version wrapped in useCallback
  const fetchQuizInfo = useCallback(
    async (quizIds: string[]) => {
      try {
        const uniqueIds = [...new Set(quizIds)].filter(
          (id) => !quizInfoCache[id] && id
        );
        if (uniqueIds.length === 0) return;

        console.log("Fetching quiz info for IDs:", uniqueIds);

        // Fetch quiz titles from Firestore
        const quizInfo: Record<string, string> = {};

        // Make one request per quiz ID for now
        for (const quizId of uniqueIds) {
          try {
            if (!quizId) continue;

            console.log("Fetching quiz title for ID:", quizId);
            const quizDoc = await getDoc(doc(db, "quizzes", quizId));

            if (quizDoc.exists()) {
              const quizData = quizDoc.data();
              console.log("Quiz data retrieved:", quizData);
              quizInfo[quizId] =
                quizData.title || `Quiz ${quizId.substring(0, 6)}`;
            } else {
              console.log("Quiz document does not exist:", quizId);
              quizInfo[quizId] = `Quiz ${quizId.substring(0, 6)}`;
            }
          } catch (err) {
            console.error(`Error fetching quiz ${quizId}:`, err);
            quizInfo[quizId] = `Quiz ${quizId.substring(0, 6)}`;
          }
        }

        console.log("Quiz info retrieved:", quizInfo);
        setQuizInfoCache((prev) => ({ ...prev, ...quizInfo }));
      } catch (error) {
        console.error("Error fetching quiz info:", error);
      }
    },
    [quizInfoCache]
  );

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log("Attempting to fetch leaderboard data...");

        // Use 'responses' collection instead of 'quizResponses'
        const responsesRef = collection(db, "responses");

        // Filter by time frame if needed
        let leaderboardQuery;
        if (timeFrame === "week" || timeFrame === "month") {
          const dateLimit = new Date();
          if (timeFrame === "week") {
            dateLimit.setDate(dateLimit.getDate() - 7);
          } else {
            dateLimit.setMonth(dateLimit.getMonth() - 1);
          }

          leaderboardQuery = query(
            responsesRef,
            // where("submittedAt", ">=", dateLimit),
            orderBy("score", "desc"), // First order by score
            limit(100) // Fetch more entries to sort by time later
          );
        } else {
          leaderboardQuery = query(
            responsesRef,
            orderBy("score", "desc"), // First order by score
            limit(100) // Fetch more entries to sort by time later
          );
        }

        console.log("Executing query...");
        const querySnapshot = await getDocs(leaderboardQuery);
        console.log(`Query returned ${querySnapshot.size} documents`);

        // Debug the first document if available
        if (querySnapshot.size > 0) {
          const firstDoc = querySnapshot.docs[0];
          console.log("Sample document data:", firstDoc.data());
        }

        const entries: LeaderboardEntry[] = [];
        const userIds: string[] = [];
        const quizIds: string[] = [];

        querySnapshot.forEach((doc) => {
          const data = doc.data();

          // Only add valid user and quiz IDs to the arrays
          if (data.userId) userIds.push(data.userId);
          if (data.quizId) quizIds.push(data.quizId);

          // Calculate time taken in seconds
          const timeTaken =
            data.startedAt && data.submittedAt
              ? Math.floor(
                  (data.submittedAt.toDate().getTime() -
                    data.startedAt.toDate().getTime()) /
                    1000
                )
              : 0;

          // Map the fields from your actual response collection to leaderboard entries
          entries.push({
            id: doc.id,
            username: data.userId || "Anonymous User",
            quizTitle: data.quizId || "Unknown Quiz",
            score: typeof data.score === "number" ? data.score : 0,
            completedAt: data.submittedAt?.toDate() || new Date(),
            timeTaken: timeTaken,
            quizId: data.quizId || "",
            // Rank will be assigned after sorting
          });
        });

        // First fetch quiz information
        await fetchQuizInfo(quizIds);
        await fetchUserInfo(userIds);

        // Group entries by quiz ID to rank within each quiz type
        const entriesByQuiz: Record<string, LeaderboardEntry[]> = {};

        entries.forEach((entry) => {
          const quizId = entry.quizId || "unknown";
          if (!entriesByQuiz[quizId]) {
            entriesByQuiz[quizId] = [];
          }
          entriesByQuiz[quizId].push(entry);
        });

        // For each quiz, sort by score and then by time taken
        Object.keys(entriesByQuiz).forEach((quizId) => {
          entriesByQuiz[quizId].sort((a, b) => {
            // First sort by score (highest first)
            if (b.score !== a.score) {
              return b.score - a.score;
            }
            // If scores are the same, sort by time taken (lowest first)
            return a.timeTaken - b.timeTaken;
          });

          // Assign ranks within each quiz group
          entriesByQuiz[quizId].forEach((entry, index) => {
            entry.rank = index + 1;
          });
        });

        // Combine all entries back and sort for overall ranking
        let allSortedEntries = entries.sort((a, b) => {
          // First sort by score (highest first)
          if (b.score !== a.score) {
            return b.score - a.score;
          }
          // If scores are the same, sort by time taken (lowest first)
          return a.timeTaken - b.timeTaken;
        });

        // Assign overall ranks
        allSortedEntries.forEach((entry, index) => {
          entry.rank = index + 1;
        });

        // Limit to 50 entries for display
        allSortedEntries = allSortedEntries.slice(0, 50);

        // Then apply the quiz titles to the entries
        console.log("Quiz info cache after fetch:", quizInfoCache);

        // Create updated entries with quiz titles and usernames from cache
        const updatedEntries = allSortedEntries.map((entry) => {
          // Map quiz IDs to quiz titles using the cache
          let quizTitle = entry.quizTitle;
          if (quizInfoCache[entry.quizTitle]) {
            quizTitle = quizInfoCache[entry.quizTitle];
            console.log(`Mapped ${entry.quizTitle} to ${quizTitle}`);
          } else {
            console.log(`No quiz title found for ID: ${entry.quizTitle}`);
          }

          // Map user IDs to usernames using the cache
          let username = entry.username;
          if (userInfoCache[entry.username]) {
            username = userInfoCache[entry.username];
          }

          return {
            ...entry,
            username: username,
            quizTitle: quizTitle,
          };
        });

        console.log(
          `Processed ${updatedEntries.length} leaderboard entries:`,
          updatedEntries
        );
        setLeaderboardData(updatedEntries);
      } catch (err) {
        console.error("Error fetching leaderboard data:", err);
        if (err instanceof Error) {
          // More specific error message based on error type
          if (err.message.includes("permission-denied")) {
            setError(
              "Permission denied: Please check Firestore security rules for the 'responses' collection."
            );
          } else {
            setError(`Failed to load leaderboard data: ${err.message}`);
          }
        } else {
          setError("Failed to load leaderboard data. Please try again later.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchLeaderboardData();
  }, [timeFrame, quizInfoCache, userInfoCache, fetchQuizInfo, fetchUserInfo]);

  // Format the date to a readable string
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(date);
  };

  // Format seconds into minutes and seconds
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50">
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl text-black font-bold mb-4 bg-clip-text  bg-gradient-to-r from-purple-primary to-tech-blue-light">
              Leaderboard
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              See how you stack up against other quiz-takers. The top performers
              are showcased here based on their scores and completion time.
            </p>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-xl shadow-sm mb-6 flex flex-wrap gap-4 justify-between items-center">
            <div className="flex items-center gap-4">
              <span className="text-gray-700 font-medium">Time Period:</span>
              <div className="flex bg-gray-100 rounded-lg overflow-hidden">
                <button
                  onClick={() => setTimeFrame("all")}
                  className={`px-4 py-2 text-sm ${
                    timeFrame === "all"
                      ? "bg-indigo-600 text-white"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All Time
                </button>
                <button
                  onClick={() => setTimeFrame("month")}
                  className={`px-4 py-2 text-sm ${
                    timeFrame === "month"
                      ? "bg-indigo-600 text-white"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  This Month
                </button>
                <button
                  onClick={() => setTimeFrame("week")}
                  className={`px-4 py-2 text-sm ${
                    timeFrame === "week"
                      ? "bg-indigo-600 text-white"
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  This Week
                </button>
              </div>
            </div>
          </div>

          {/* Leaderboard table */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
                <span className="ml-3 text-gray-600">
                  Loading leaderboard data...
                </span>
              </div>
            ) : error ? (
              <div className="text-center py-20">
                <p className="text-red-500 mb-2">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Try again
                </button>
              </div>
            ) : leaderboardData.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-600">
                  No leaderboard data available yet.
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  Be the first to complete a quiz and claim the top spot!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="py-4 px-6 text-left text-gray-500 font-medium">
                        Rank
                      </th>
                      <th className="py-4 px-6 text-left text-gray-500 font-medium">
                        User
                      </th>
                      <th className="py-4 px-6 text-left text-gray-500 font-medium">
                        Quiz
                      </th>
                      <th className="py-4 px-6 text-left text-gray-500 font-medium">
                        Score
                      </th>
                      <th className="py-4 px-6 text-left text-gray-500 font-medium">
                        Time Taken
                      </th>
                      <th className="py-4 px-6 text-left text-gray-500 font-medium">
                        Completed On
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {leaderboardData.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            {entry.rank === 1 && (
                              <span className="text-2xl mr-2">🥇</span>
                            )}
                            {entry.rank === 2 && (
                              <span className="text-2xl mr-2">🥈</span>
                            )}
                            {entry.rank === 3 && (
                              <span className="text-2xl mr-2">🥉</span>
                            )}
                            {entry.rank && entry.rank > 3 ? (
                              <span className="font-bold text-gray-700">
                                {entry.rank}
                              </span>
                            ) : !entry.rank && entry.rank !== 0 ? (
                              <span className="font-bold text-gray-700">-</span>
                            ) : null}
                          </div>
                        </td>
                        <td className="py-4 px-6 font-medium">
                          {entry.username}
                        </td>
                        <td className="py-4 px-6 text-gray-700">
                          {entry.quizTitle}
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-bold text-indigo-600">
                            {entry.score}%
                          </span>
                        </td>
                        <td className="py-4 px-6 text-gray-700">
                          {formatTime(entry.timeTaken)}
                        </td>
                        <td className="py-4 px-6 text-gray-500">
                          {formatDate(entry.completedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Achievement section */}
          <div className="mt-10">
            <h2 className="text-2xl font-bold mb-6">Top Achievers</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {leaderboardData.slice(0, 3).map((entry, index) => (
                <div
                  key={entry.id}
                  className="bg-white p-6 rounded-xl shadow-sm border-t-4 border-indigo-600"
                >
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 flex items-center justify-center bg-indigo-100 rounded-full text-2xl mr-4">
                      {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{entry.username}</h3>
                      <p className="text-sm text-gray-500">{entry.quizTitle}</p>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <div>
                      <p className="font-medium">Score</p>
                      <p className="text-xl font-bold text-indigo-600">
                        {entry.score}%
                      </p>
                    </div>
                    <div>
                      <p className="font-medium">Time</p>
                      <p className="text-lg">{formatTime(entry.timeTaken)}</p>
                    </div>
                    <div>
                      <p className="font-medium">Date</p>
                      <p>{formatDate(entry.completedAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default LeaderboardPage;
