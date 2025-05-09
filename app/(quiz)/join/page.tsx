"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import QuizCard from "@/components/QuizCard";
import { getActiveQuizzes, getQuizByCode, Quiz } from "@/firebase/firestore";
import { onAuthChange } from "@/lib/actions/auth.actions";

export default function JoinQuiz() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accessCode, setAccessCode] = useState("");
  const router = useRouter();

  // Check auth status
  // Check auth status
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      // Auth state is tracked but not currently used in this component
      console.log("Auth state changed:", !!user);
    });

    return () => unsubscribe();
  }, []);
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
      } catch (err) {
        console.error("Error fetching quizzes:", err);

        // Provide specific error message for permissions issue
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

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!accessCode.trim()) {
      setError("Please enter a quiz access code");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const quiz = await getQuizByCode(accessCode.trim());

      if (!quiz) {
        setError(
          "No active quiz found with this code. Please check and try again."
        );
        return;
      }

      // Redirect to the quiz page with the access code
      router.push(`/${quiz.accessCode}`);
    } catch (err) {
      console.error("Error joining quiz:", err);

      // Provide specific error message for permissions issue
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Join a Quiz</h1>

          {/* Quiz code form */}
          <div className="bg-white p-6 rounded-xl shadow-sm mb-10">
            <h2 className="text-xl font-semibold mb-4">
              Enter Quiz Access Code
            </h2>

            <form
              onSubmit={handleJoinByCode}
              className="flex flex-col sm:flex-row gap-3"
            >
              <input
                type="text"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Enter quiz access code"
                className="flex-grow border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent-primary shadow-sm"
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-purple-primary to-tech-blue-light text-black font-medium py-3 px-8 rounded-lg hover:shadow-md hover:shadow-purple-primary/20 transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    Joining...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg
                      className="w-5 h-5 mr-2"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M15 5L21 12M21 12L15 19M21 12H3"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Join Quiz
                  </span>
                )}
              </button>
            </form>

            {error && <p className="mt-3 text-red-500 text-sm">{error}</p>}
          </div>

          {/* Available quizzes */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Available Quizzes</h2>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-pulse">Loading quizzes...</div>
              </div>
            ) : error ? (
              <div className="bg-white p-8 rounded-xl text-center">
                <p className="text-red-500">{error}</p>
                <p className="text-gray-500 text-sm mt-2">
                  Please try again later or contact support if the issue
                  persists.
                </p>
              </div>
            ) : quizzes.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {quizzes.map((quiz) => (
                  <QuizCard key={quiz.id} quiz={quiz} />
                ))}
              </div>
            ) : (
              <div className="bg-white p-8 rounded-xl text-center">
                <p className="text-gray-500">
                  No quizzes available at the moment.
                </p>
                <p className="text-gray-500 text-sm mt-2">
                  Enter a quiz access code above or check back later.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
