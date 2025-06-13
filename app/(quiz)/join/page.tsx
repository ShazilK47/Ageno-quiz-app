/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import QuizCard from "@/components/QuizCard";
import { getActiveQuizzes, getQuizByCode, Quiz } from "@/firebase/firestore";
import { onAuthChange } from "@/lib/actions/auth.actions";
import { motion } from "framer-motion";

export default function JoinQuiz() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessCode, setAccessCode] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredQuizzes, setFilteredQuizzes] = useState<Quiz[]>([]);
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [userAuthenticated, setUserAuthenticated] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUserAuthenticated(!!user);
      setAuthChecked(true);
    });

    const timeout = setTimeout(() => {
      if (!authChecked) {
        console.log("Join Quiz: Auth check timed out, continuing anyway");
        setAuthChecked(true);
      }
    }, 2000);

    return () => {
      unsubscribe();
      clearTimeout(timeout);
    };
  }, [authChecked]);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const activeQuizzes = await getActiveQuizzes();

        if (activeQuizzes.length === 0) {
          console.warn("No quizzes found or there might be permission issues");
        }

        setQuizzes(activeQuizzes);
        setFilteredQuizzes(activeQuizzes);
      } catch (err) {
        console.error("Error fetching quizzes:", err);

        if (err instanceof Error && err.message.includes("permission")) {
          setError(
            "Firestore permission denied. Please check Firebase security rules."
          );
        } else {
          setError("Failed to load quizzes. Please try again.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  // Filter quizzes based on search term
  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredQuizzes(quizzes);
    } else {
      const lowercasedFilter = searchTerm.toLowerCase();
      setFilteredQuizzes(
        quizzes.filter(
          (quiz) =>
            quiz.title?.toLowerCase().includes(lowercasedFilter) ||
            quiz.description?.toLowerCase().includes(lowercasedFilter) ||
            (quiz.accessCode &&
              quiz.accessCode.toLowerCase().includes(lowercasedFilter))
        )
      );
    }
  }, [searchTerm, quizzes]);

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredQuizzes(quizzes);
    } else {
      const lowercasedFilter = searchTerm.toLowerCase();
      setFilteredQuizzes(
        quizzes.filter((quiz) =>
          quiz.title.toLowerCase().includes(lowercasedFilter)
        )
      );
    }
  }, [searchTerm, quizzes]);

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const codeToCheck = accessCode || searchTerm;

    if (!codeToCheck.trim()) {
      setError("Please enter a quiz access code");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const quiz = await getQuizByCode(codeToCheck.trim());

      if (!quiz) {
        setError(
          "No active quiz found with this code. Please check and try again."
        );
        return;
      }

      router.push(`/${quiz.accessCode}`);
    } catch (err) {
      console.error("Error joining quiz:", err);

      if (err instanceof Error && err.message.includes("permission")) {
        setError(
          "Firestore permission denied. Please check Firebase security rules."
        );
      } else {
        setError("Failed to join quiz. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 },
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-indigo-50/30">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold mb-3 text-gray-800 tracking-tight">
              Join a Quiz
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Search for a quiz below or enter a specific access code to join
              directly.
            </p>
          </motion.div>

          {authChecked && userAuthenticated && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mb-8 flex justify-center"
            >
              <div className="bg-green-50 text-green-700 px-4 py-2 rounded-full flex items-center shadow-sm border border-green-100">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>
                  You&apos;re signed in! Your quiz progress will be saved.
                </span>
              </div>
            </motion.div>
          )}

          <motion.div
            variants={itemVariants}
            initial="hidden"
            animate="show"
            className="bg-white p-5 rounded-xl shadow-md mb-8 border border-indigo-50 max-w-3xl mx-auto"
          >
            <div className="flex items-center mb-3">
              <div className="bg-indigo-100 text-indigo-700 p-2 rounded-full mr-3">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h2 className="text-lg font-medium text-gray-800">
                Search Quizzes
              </h2>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-grow">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search quizzes by title or description"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent shadow-sm font-medium text-base transition-all duration-200"
                  aria-label="Search quizzes"
                />
                {searchTerm && (
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setSearchTerm("")}
                    aria-label="Clear search"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>

              <div className="flex items-center">
                <div className="text-sm text-indigo-600 font-medium ml-2 hidden sm:block">
                  {filteredQuizzes.length}{" "}
                  {filteredQuizzes.length === 1 ? "quiz" : "quizzes"} found
                </div>
              </div>
            </div>

            <div className="text-sm text-indigo-600 font-medium mt-2 sm:hidden text-center">
              {filteredQuizzes.length}{" "}
              {filteredQuizzes.length === 1 ? "quiz" : "quizzes"} found
            </div>

            {accessCode && (
              <div className="flex items-center justify-between mt-3 p-2 bg-indigo-50 rounded-lg">
                <div className="flex items-center">
                  <div className="bg-indigo-100 text-indigo-700 p-1.5 rounded-full mr-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium">
                    Join with code:{" "}
                    <span className="font-bold">{accessCode}</span>
                  </span>
                </div>
                <motion.button
                  type="button"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-1.5 px-3 text-sm rounded shadow-sm hover:shadow-md transition-all duration-300 flex items-center"
                  onClick={(e) => {
                    e.preventDefault();
                    handleJoinByCode(e as React.FormEvent<HTMLButtonElement>);
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                >
                  {isLoading ? "Joining..." : "Join"}
                </motion.button>
              </div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 bg-red-50 text-red-600 p-2 rounded-lg border border-red-100 flex items-center text-sm"
              >
                <svg
                  className="w-4 h-4 mr-2 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p>{error}</p>
              </motion.div>
            )}
          </motion.div>

          <motion.div
            className="mb-6"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            <div className="flex items-center mb-6">
              <div className="bg-indigo-100 text-indigo-700 p-2 rounded-full mr-3">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">
                Available Quizzes
              </h2>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="flex flex-col items-center">
                  <svg
                    className="animate-spin h-12 w-12 text-indigo-500"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  <span className="mt-4 text-indigo-600 font-medium">
                    Loading quizzes...
                  </span>
                </div>
              </div>
            ) : error ? (
              <motion.div
                variants={itemVariants}
                className="bg-white p-8 rounded-xl shadow-md border border-red-50 text-center"
              >
                <div className="inline-flex items-center justify-center bg-red-100 rounded-full p-3 mb-4">
                  <svg
                    className="w-8 h-8 text-red-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <p className="text-red-600 font-medium text-lg">{error}</p>
                <p className="text-gray-500 mt-2">
                  Please try again later or contact support if the issue
                  persists.
                </p>
              </motion.div>
            ) : filteredQuizzes.length > 0 ? (
              <div>
                {filteredQuizzes.some(
                  (quiz) => quiz.requiresAccessCode === false
                ) && (
                  <motion.div variants={itemVariants} className="mb-12">
                    <h3 className="text-lg font-medium mb-6 text-indigo-700 border-b border-indigo-100 pb-2 flex items-center">
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                        />
                      </svg>
                      Open Access Quizzes
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {filteredQuizzes
                        .filter((quiz) => quiz.requiresAccessCode === false)
                        .map((quiz) => (
                          <motion.div key={quiz.id} variants={itemVariants}>
                            <QuizCard quiz={quiz} />
                          </motion.div>
                        ))}
                    </div>
                  </motion.div>
                )}

                {filteredQuizzes.some(
                  (quiz) => quiz.requiresAccessCode !== false
                ) && (
                  <motion.div variants={itemVariants}>
                    <h3 className="text-lg font-medium mb-6 text-indigo-700 border-b border-indigo-100 pb-2 flex items-center">
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      Access Code Required
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {filteredQuizzes
                        .filter((quiz) => quiz.requiresAccessCode !== false)
                        .map((quiz) => (
                          <motion.div key={quiz.id} variants={itemVariants}>
                            <QuizCard quiz={quiz} />
                          </motion.div>
                        ))}
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <motion.div
                variants={itemVariants}
                className="bg-white p-8 rounded-xl shadow-md border border-gray-100 text-center"
              >
                <div className="inline-flex items-center justify-center bg-blue-100 rounded-full p-3 mb-4">
                  <svg
                    className="w-8 h-8 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                {searchTerm ? (
                  <>
                    <p className="text-gray-700 font-medium text-lg">
                      No quizzes match your search.
                    </p>
                    <p className="text-gray-500 mt-2">
                      Try a different search term or browse all available
                      quizzes.
                    </p>
                    <button
                      onClick={() => setSearchTerm("")}
                      className="mt-4 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-300"
                    >
                      Clear Search
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-gray-700 font-medium text-lg">
                      No quizzes available at the moment.
                    </p>
                    <p className="text-gray-500 mt-2">
                      Check back later for new quizzes.
                    </p>
                  </>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
