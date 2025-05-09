"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { getQuizByCode, Quiz, submitQuizResponse } from "@/firebase/firestore";

interface UserAnswer {
  questionId: string;
  selectedOptionIndex: number | null;
}

export default function QuizPage({
  params,
}: {
  params: Promise<{ code: string }> | { code: string };
}) {
  const unwrappedParams = use(params as Promise<{ code: string }>);
  const { code } = unwrappedParams;
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Quiz session state
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState<Date | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [responseId, setResponseId] = useState<string | null>(null);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);

  // Track tab visibility changes for proctoring
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (
        quizStarted &&
        !quizSubmitted &&
        document.visibilityState === "hidden"
      ) {
        setTabSwitchCount((prev) => prev + 1);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [quizStarted, quizSubmitted]);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!code) return;

      try {
        setIsLoading(true);
        const quizData = await getQuizByCode(code);

        if (!quizData) {
          setError("Quiz not found or no longer active");
          return;
        }

        // Enhanced debugging to understand the data structure
        console.log("Quiz data loaded:", JSON.stringify(quizData, null, 2));
        if (quizData.questions) {
          quizData.questions.forEach((q, i) => {
            console.log(`Question ${i + 1} options:`, q.options);
            console.log(`Question ${i + 1} raw data:`, q);
          });
        } else {
          console.log("No questions found in quiz data");
        }

        // Temporary fix: If a question has the options property but it's an empty array,
        // let's check if there are other properties that might contain the options
        if (quizData.questions) {
          quizData.questions = quizData.questions.map((q) => {
            // If options is empty but there are numbered properties (0, 1, 2, etc.)
            // that might contain option text, let's create a new options array
            if (
              (!q.options || q.options.length === 0) &&
              Object.keys(q).some((key) => !isNaN(Number(key)))
            ) {
              const numericKeys = Object.keys(q).filter(
                (key) => !isNaN(Number(key))
              );
              // Create proper option objects with id and text properties
              const newOptions = numericKeys.map((key) => ({
                id: key,
                text: String(q[key as keyof typeof q]),
              }));
              console.log("Created options from numeric keys:", newOptions);
              return { ...q, options: newOptions };
            }
            return q;
          });
        }

        setQuiz(quizData);
      } catch (err) {
        setError("Failed to load quiz. Please try again.");
        console.error("Error fetching quiz:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuiz();
  }, [code]);

  // Timer effect for the quiz
  useEffect(() => {
    let timerInterval: NodeJS.Timeout | null = null;

    if (quizStarted && quiz && !quizSubmitted) {
      // Set initial time in seconds
      setTimeRemaining(quiz.duration * 60);

      timerInterval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 0) {
            // Auto-submit when time is up
            if (timerInterval) clearInterval(timerInterval);
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerInterval) clearInterval(timerInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizStarted, quiz, quizSubmitted]);

  const handleStartQuiz = () => {
    // Initialize user answers array with empty answers
    if (quiz && quiz.questions) {
      const initialAnswers = quiz.questions.map((q) => ({
        questionId: q.id,
        selectedOptionIndex: null,
      }));
      setUserAnswers(initialAnswers);
      setQuizStarted(true);
      setQuizStartTime(new Date());
    }
  };

  const handleSelectOption = (questionIndex: number, optionIndex: number) => {
    setUserAnswers((prev) => {
      const updated = [...prev];
      updated[questionIndex] = {
        ...updated[questionIndex],
        selectedOptionIndex: optionIndex,
      };
      return updated;
    });
  };

  const handleNextQuestion = () => {
    if (quiz?.questions && currentQuestionIndex < quiz.questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const handleSubmitQuiz = async () => {
    if (!quiz || !quiz.questions || !quizStartTime) return;

    try {
      setIsSubmitting(true);

      // Calculate local score
      let correctAnswers = 0;
      userAnswers.forEach((answer, index) => {
        const question = quiz.questions?.[index];
        if (question && answer.selectedOptionIndex === question.correctIndex) {
          correctAnswers++;
        }
      });

      const calculatedScore = Math.round(
        (correctAnswers / quiz.questions.length) * 100
      );
      setScore(calculatedScore);

      // Try to submit to Firebase
      try {
        const response = await submitQuizResponse(
          quiz.id,
          userAnswers,
          quizStartTime,
          tabSwitchCount,
          [] // No camera flags for now
        );

        if (response) {
          setResponseId(response);
          console.log(
            "Quiz response submitted successfully with ID:",
            response
          );
        } else {
          throw new Error("Failed to get response ID");
        }
      } catch (firebaseError) {
        console.error("Error submitting quiz:", firebaseError);

        // Fallback to local storage if Firebase submission fails
        const localResponseId = `local-${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 9)}`;
        setResponseId(localResponseId);

        // Store response data in localStorage
        const responseData = {
          quizId: quiz.id,
          quizTitle: quiz.title,
          accessCode: quiz.accessCode,
          startTime: quizStartTime.toISOString(),
          endTime: new Date().toISOString(),
          score: calculatedScore,
          answers: userAnswers,
          tabSwitchCount: tabSwitchCount,
        };

        try {
          // Save in local storage
          const existingResponses = JSON.parse(
            localStorage.getItem("quizResponses") || "[]"
          );
          existingResponses.push({
            id: localResponseId,
            ...responseData,
          });
          localStorage.setItem(
            "quizResponses",
            JSON.stringify(existingResponses)
          );
          console.log("Quiz response saved locally with ID:", localResponseId);
        } catch (localStorageError) {
          console.error("Failed to save to local storage:", localStorageError);
        }
      }

      setQuizSubmitted(true);
    } catch (error) {
      console.error("Error processing quiz submission:", error);
      // Show error but still allow viewing results
      setQuizSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format time remaining as mm:ss
  const formatTimeRemaining = () => {
    if (timeRemaining === null) return "--:--";
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Render current question or results
  const renderQuizContent = () => {
    if (!quiz || !quiz.questions) return null;

    // If quiz is submitted, show results
    if (quizSubmitted) {
      return (
        <div className="bg-white p-8 rounded-xl shadow-md max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6">
            Quiz Completed!
          </h2>

          <div className="text-center mb-8">
            <div className="text-6xl font-bold text-indigo-600 mb-2">
              {score}%
            </div>
            <p className="text-gray-600">
              You answered{" "}
              {
                userAnswers.filter(
                  (a, i) =>
                    a.selectedOptionIndex === quiz.questions?.[i].correctIndex
                ).length
              }{" "}
              out of {quiz.questions.length} questions correctly
            </p>

            {responseId && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Response ID</p>
                <p className="font-mono text-xs">{responseId}</p>
              </div>
            )}
          </div>

          <div className="flex justify-center gap-4">
            <button
              onClick={() => router.push("/join")}
              className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Back to Quizzes
            </button>
            <button
              onClick={() => {
                setQuizStarted(false);
                setQuizSubmitted(false);
                setCurrentQuestionIndex(0);
                setScore(null);
                setResponseId(null);
                setTabSwitchCount(0);
              }}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Retry Quiz
            </button>
          </div>
        </div>
      );
    }

    if (isSubmitting) {
      return (
        <div className="bg-white p-8 rounded-xl shadow-md max-w-2xl mx-auto text-center">
          <div className="animate-pulse">
            <h2 className="text-2xl font-bold mb-6">
              Submitting Your Answers...
            </h2>
            <div className="flex justify-center">
              <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-600 mt-4">
              Please wait while we save your responses.
            </p>
          </div>
        </div>
      );
    }

    // Show current question
    const currentQuestion = quiz.questions[currentQuestionIndex];

    // Debug the current question to see its structure
    console.log("Current question:", currentQuestion);
    console.log(
      "Options type:",
      Array.isArray(currentQuestion.options)
        ? "Array"
        : typeof currentQuestion.options
    );
    console.log(
      "Options length:",
      Array.isArray(currentQuestion.options)
        ? currentQuestion.options.length
        : "N/A"
    );

    // Safety check
    if (!currentQuestion) {
      return (
        <div className="bg-white p-8 rounded-xl shadow-md max-w-2xl mx-auto">
          <div className="text-red-500">Question not found</div>
        </div>
      );
    }

    // If no options available after our fix, show an error
    if (
      !currentQuestion.options ||
      !Array.isArray(currentQuestion.options) ||
      currentQuestion.options.length === 0
    ) {
      return (
        <div className="bg-white p-8 rounded-xl shadow-md max-w-2xl mx-auto">
          <h3 className="text-xl font-semibold mb-4">{currentQuestion.text}</h3>
          <div className="p-4 border border-red-300 bg-red-50 rounded-lg">
            <p className="text-red-600">
              No options available for this question.
            </p>
            <p className="text-sm text-gray-600 mt-2">
              Question data: {JSON.stringify(currentQuestion)}
            </p>
          </div>

          <div className="flex justify-between mt-6">
            <button
              onClick={handlePreviousQuestion}
              disabled={currentQuestionIndex === 0}
              className={`px-4 py-2 rounded-lg ${
                currentQuestionIndex === 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              } transition-colors`}
            >
              Previous
            </button>

            {currentQuestionIndex < quiz.questions.length - 1 ? (
              <button
                onClick={handleNextQuestion}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Next Question
              </button>
            ) : (
              <button
                onClick={handleSubmitQuiz}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Submit Answers
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white p-4 sm:p-8 rounded-xl shadow-md max-w-2xl mx-auto">
        <div className="flex flex-wrap sm:flex-nowrap justify-between items-center mb-6 gap-2">
          <div className="bg-indigo-100 text-indigo-800 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap">
            Question {currentQuestionIndex + 1} of {quiz.questions.length}
          </div>
          <div
            className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              timeRemaining && timeRemaining < 60
                ? "bg-red-100 text-red-800 animate-pulse"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            Time: {formatTimeRemaining()}
          </div>
        </div>

        <h3 className="text-xl font-semibold mb-4">{currentQuestion.text}</h3>

        <div className="space-y-3 mb-8">
          {currentQuestion.options.map((option, optionIndex) => (
            <div
              key={optionIndex}
              className={`p-4 border rounded-lg cursor-pointer ${
                userAnswers[currentQuestionIndex]?.selectedOptionIndex ===
                optionIndex
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50"
              }`}
              onClick={() =>
                handleSelectOption(currentQuestionIndex, optionIndex)
              }
            >
              <div className="flex items-center">
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 flex-shrink-0 ${
                    userAnswers[currentQuestionIndex]?.selectedOptionIndex ===
                    optionIndex
                      ? "border-indigo-600 bg-indigo-600"
                      : "border-gray-400"
                  }`}
                >
                  {userAnswers[currentQuestionIndex]?.selectedOptionIndex ===
                    optionIndex && (
                    <div className="w-2 h-2 rounded-full bg-white"></div>
                  )}
                </div>
                <span className="text-sm sm:text-base">
                  {typeof option === "string"
                    ? option
                    : option.text || `Option ${optionIndex + 1}`}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between">
          <button
            onClick={handlePreviousQuestion}
            disabled={currentQuestionIndex === 0}
            className={`px-3 sm:px-4 py-2 rounded-lg ${
              currentQuestionIndex === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-gray-200 text-gray-800 active:bg-gray-300"
            }`}
          >
            Previous
          </button>

          {currentQuestionIndex < quiz.questions.length - 1 ? (
            <button
              onClick={handleNextQuestion}
              className="px-4 sm:px-6 py-2 bg-indigo-600 text-white rounded-lg active:bg-indigo-700"
            >
              Next Question
            </button>
          ) : (
            <button
              onClick={handleSubmitQuiz}
              className="px-4 sm:px-6 py-2 bg-indigo-600 text-white rounded-lg active:bg-indigo-700"
            >
              Submit Answers
            </button>
          )}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading quiz...</div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50">
        <Header />
        <main className="container mx-auto px-4 py-12">
          <div className="max-w-md mx-auto bg-white p-8 rounded-xl shadow-sm text-center">
            <h1 className="text-2xl font-bold text-red-500 mb-4">
              Quiz Not Available
            </h1>
            <p className="text-gray-600 mb-6">{error || "Quiz not found"}</p>
            <button
              onClick={() => router.push("/quiz/join")}
              className="bg-primary text-white font-medium py-2 px-6 rounded-lg hover:bg-primary/90 transition-colors"
            >
              Back to Join Page
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Quiz started - show the quiz interface
  if (quizStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50">
        <Header />
        <main className="container mx-auto px-4 py-12">
          {renderQuizContent()}

          {tabSwitchCount > 0 && !quizSubmitted && (
            <div className="max-w-2xl mx-auto mt-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-yellow-800 text-sm">
                <p>⚠️ Tab switching detected: {tabSwitchCount} times</p>
                <p className="text-xs mt-1">
                  Excessive tab switching may be flagged for review.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Quiz not started yet - show the intro screen
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-neutral-50">
      <Header />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow-sm">
          <h1 className="text-3xl font-bold mb-2">{quiz.title}</h1>
          <p className="text-gray-600 mb-6">{quiz.description}</p>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-primary/10 p-4 rounded-lg">
              <h3 className="font-medium mb-1">Duration</h3>
              <p className="text-xl">{quiz.duration} minutes</p>
            </div>
            <div className="bg-primary/10 p-4 rounded-lg">
              <h3 className="font-medium mb-1">Questions</h3>
              <p className="text-xl">{quiz.questions?.length || 0} questions</p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-8">
            <h3 className="font-medium mb-2">Access Code:</h3>
            <div className="flex items-center justify-center">
              <span className="text-xl font-mono bg-gray-100 px-6 py-3 rounded-lg">
                {quiz.accessCode}
              </span>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-8">
            <h3 className="font-medium mb-2">Before You Begin:</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Ensure you have a stable internet connection</li>
              <li>
                You will have {quiz.duration} minutes to complete the quiz
              </li>
              <li>
                Quiz has {quiz.questions?.length || 0} questions to answer
              </li>
              <li>All answers are final after submission</li>
              <li className="text-yellow-600">
                Switching tabs during the quiz will be monitored
              </li>
            </ul>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleStartQuiz}
              className="bg-blue-700 text-white font-medium py-3 px-10 text-lg rounded-lg hover:bg-primary/90 transition-colors"
            >
              Start Quiz
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
