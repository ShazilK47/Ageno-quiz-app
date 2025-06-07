// components/QuizCard.tsx
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { FirebaseTimestamp, Quiz } from "@/firebase/firestore";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { hasMultipleDifficulties } from "@/utils/difficulty-helpers";

interface QuizCardProps {
  quiz: Quiz;
}

// Utility function to handle Firebase Timestamp or Date objects
function getDateValue(dateField: Date | FirebaseTimestamp): Date {
  // If it's already a Date object, return it
  if (dateField instanceof Date) {
    return dateField;
  }

  // If it's a Firebase server timestamp (not yet resolved), return current date
  // This is a fallback since server timestamps are not actual dates until written to the database
  return new Date();
}

export default function QuizCard({ quiz }: QuizCardProps) {
  const [showAccessCodeInput, setShowAccessCodeInput] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const router = useRouter();

  // Get detailed info about time variations across difficulty levels
  const getTimeInfo = () => {
    if (!quiz.difficultySettings || !quiz.availableDifficulties || quiz.availableDifficulties.length <= 1) {
      return {
        hasDifferentDurations: false,
        displayText: `${quiz.duration} min`,
        tooltip: `${quiz.duration} minutes for this quiz`,
        formattedDuration: `${quiz.duration} minutes`
      };
    }
    
    // Track durations for each difficulty and determine if they differ
    const durationByDifficulty: Record<string, number> = {};
    let allSame = true;
    let firstDuration: number | null = null;
    
    // Collect durations for each difficulty
    quiz.availableDifficulties.forEach(diff => {
      const duration = quiz.difficultySettings?.[diff as keyof typeof quiz.difficultySettings]?.duration || quiz.duration;
      durationByDifficulty[diff] = duration;
      
      if (firstDuration === null) {
        firstDuration = duration;
      } else if (duration !== firstDuration) {
        allSame = false;
      }
    });
    
    // If all durations are the same, just return that single value
    if (allSame) {
      const duration = firstDuration || quiz.duration;
      return {
        hasDifferentDurations: false,
        displayText: `${duration} min`,
        tooltip: `${duration} minutes for all difficulty levels`,
        formattedDuration: `${duration} minutes`
      };
    }
    
    // Calculate the range for display text
    const min = Math.min(...Object.values(durationByDifficulty));
    const max = Math.max(...Object.values(durationByDifficulty));
    
    // Build a detailed tooltip with sorted difficulty levels
    const tooltipParts = quiz.availableDifficulties
      .sort((a, b) => {
        const order = { easy: 1, medium: 2, hard: 3 };
        return (order[a as keyof typeof order] || 99) - (order[b as keyof typeof order] || 99);
      })
      .map(diff => {
        const duration = durationByDifficulty[diff];
        return `${diff.charAt(0).toUpperCase() + diff.slice(1)}: ${duration} min`;
      });
    
    return {
      hasDifferentDurations: true,
      displayText: `${min}-${max} min`,
      tooltip: tooltipParts.join(' • '),
      formattedDuration: `${min}-${max} minutes (varies by difficulty)`,
      durations: durationByDifficulty
    };
  };

  const handleJoinClick = (e: React.MouseEvent) => {
    e.preventDefault();

    // If quiz doesn't require access code, redirect directly
    if (quiz.requiresAccessCode === false) {
      router.push(`/${quiz.accessCode}`);
      return;
    }

    // Otherwise show access code input
    setShowAccessCodeInput(true);
  };

  const handleCancel = () => {
    setShowAccessCodeInput(false);
    setAccessCode("");
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsVerifying(true);

    // Verify the access code matches the quiz's access code
    if (accessCode.trim() === quiz.accessCode.trim()) {
      // Redirect to the quiz page
      router.push(`/${quiz.accessCode}`);
    } else {
      setError("Incorrect access code. Please try again.");
      setIsVerifying(false);
    }
  };

  // Helper function to render difficulty badges with tooltips for time info
  const renderDifficultyBadges = () => {
    if (!quiz.availableDifficulties || quiz.availableDifficulties.length === 0) {
      // Show a default badge if no difficulties are specified
      return (
        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-xs bg-yellow-100 text-yellow-800">
          Medium
        </span>
      );
    }

    return (
      <div className="flex flex-col gap-1">
        {quiz.availableDifficulties
          .sort((a, b) => {
            const order = { easy: 1, medium: 2, hard: 3 };
            return (order[a as keyof typeof order] || 99) - (order[b as keyof typeof order] || 99);
          })
          .map((diff) => {
            const colorClass = diff === "easy"
              ? "bg-green-100 text-green-800"
              : diff === "hard"
              ? "bg-red-100 text-red-800"
              : "bg-yellow-100 text-yellow-800";
            
            // Get the duration for this difficulty
            const duration = quiz.difficultySettings?.[diff as keyof typeof quiz.difficultySettings]?.duration || quiz.duration;
            
            return (
              <span
                key={diff}
                className={`inline-flex items-center justify-center w-full px-1.5 py-0.5 rounded-md text-xs ${colorClass} transition-all`}
                title={`${diff.charAt(0).toUpperCase() + diff.slice(1)}: ${duration} min`}
              >
                {diff.charAt(0).toUpperCase() + diff.slice(1)}
              </span>
            );
          })}
      </div>
    );
  };
  
  // Get information about question count, potentially varying by difficulty
  const getQuestionInfo = () => {
    const baseQuestionCount = quiz.questions && Array.isArray(quiz.questions) 
      ? quiz.questions.length 
      : 1;
    
    // In the future, if we implement per-difficulty question sets, we can enhance this function
    // to show variable question counts like we do with duration
    
    const tooltip = hasMultipleDifficulties(quiz) 
      ? `${baseQuestionCount} questions${timeInfo.hasDifferentDurations ? ' with time limits varying by difficulty level' : ''}`
      : `${baseQuestionCount} questions in this quiz (${timeInfo.formattedDuration})`;
      
    return {
      hasVariableCount: false, // Will be true when per-difficulty question sets are implemented
      displayText: `${baseQuestionCount}`,
      tooltip
    };
  };

  const hasMultipleDiffs = hasMultipleDifficulties(quiz);
  const timeInfo = getTimeInfo();
  const questionInfo = getQuestionInfo();

  return (
    <motion.div
      className="h-full rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 bg-white border border-gray-100 group relative"
      whileHover={{ y: -5 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Subtle background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-tr from-indigo-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

      <div className="flex flex-col h-full relative z-10">
        <div className="p-6 pb-4 border-b border-gray-100 flex justify-between items-start">
          <h3 className="text-xl font-bold text-gray-800 line-clamp-1 group-hover:text-indigo-700 transition-colors duration-300 tracking-tight relative before:content-[''] before:absolute before:-bottom-1 before:left-0 before:w-0 before:h-0.5 before:bg-indigo-500 group-hover:before:w-16 before:transition-all before:duration-300 pb-1">
            {quiz.title}
          </h3>
          {quiz.requiresAccessCode !== false && (
            <span className="px-3 py-1.5 bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700 text-xs font-semibold rounded-full flex-shrink-0 ml-2 shadow-sm border border-indigo-100">
              {quiz.accessCode}
            </span>
          )}
        </div>

        <div className="p-6 flex-grow">
          <p className="text-gray-600 mb-5 line-clamp-2 text-sm leading-relaxed">
            {quiz.description}
          </p>

          <div className="grid grid-cols-3 gap-3 mb-5">
            {/* Time Limit */}
            <div 
              className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-3 flex flex-col items-center shadow-sm border border-gray-100 cursor-help"
              title={timeInfo.tooltip}
            >
              <span className="text-xs text-gray-500 mb-1">Time Limit</span>
              <span className="font-semibold text-gray-800 flex items-center gap-1">
                {timeInfo.displayText}
                {timeInfo.hasDifferentDurations && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-1 rounded-sm whitespace-nowrap">
                    by level
                  </span>
                )}
              </span>
            </div>

            {/* Difficulty */}
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-3 flex flex-col items-center shadow-sm border border-gray-100">
              <span className="text-xs text-gray-500 mb-1">Difficulty</span>
              <div className="w-full">
                {renderDifficultyBadges()}
              </div>
            </div>

            {/* Questions */}
            <div 
              className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-3 flex flex-col items-center shadow-sm border border-gray-100 cursor-help"
              title={questionInfo.tooltip}
            >
              <span className="text-xs text-gray-500 mb-1">Questions</span>
              <span className="font-semibold text-gray-800 flex items-center gap-1">
                {questionInfo.displayText}
                {hasMultipleDiffs && questionInfo.hasVariableCount && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-1 rounded-sm whitespace-nowrap">
                    by level
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 pt-4 bg-gradient-to-b from-white to-gray-50 flex flex-col gap-2 mt-auto border-t border-gray-100">
          <div className="flex justify-between items-center w-full">
            <span className="text-xs text-gray-500">
              {formatDistanceToNow(getDateValue(quiz.createdAt), { addSuffix: true })}
            </span>

            <div className="flex flex-col gap-1">
              {hasMultipleDiffs && (
                <div 
                  className="text-xs text-gray-500 italic mb-1 flex items-center gap-1 cursor-help"
                  title={`This quiz offers ${quiz.availableDifficulties?.length} difficulty levels. ${timeInfo.hasDifferentDurations ? 'Time limit varies by selected difficulty.' : ''}`}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" 
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Select difficulty after joining
                </div>
              )}
              <motion.div whileTap={{ scale: 0.97 }}>
                <button
                onClick={handleJoinClick}
                className="py-2.5 px-5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm font-medium rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-300 flex items-center gap-1 shadow-md hover:shadow-lg"
              >
                {quiz.requiresAccessCode === false ? "Start Quiz" : "Join Quiz"}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="ml-1"
                >
                  <path
                    d="M5 12H19M19 12L12 5M19 12L12 19"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Access Code Modal */}
      {showAccessCodeInput && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-[2px] flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl border border-gray-100"
            initial={{ scale: 0.95, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ duration: 0.25, type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center mb-4 space-x-3">
              <div className="bg-indigo-100 text-indigo-700 size-10 rounded-full flex items-center justify-center">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect
                    x="7"
                    y="11"
                    width="10"
                    height="8"
                    rx="2"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M12 11V7C12 5.89543 12.8954 5 14 5V5C15.1046 5 16 5.89543 16 7V11"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-800">
                  Access Code Required
                </h2>
                <p className="text-gray-600 text-sm">
                  For &quot;{quiz.title}&quot;
                </p>
              </div>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-full"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M18 6L6 18M6 6l12 12"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="Enter access code"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-center font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                  autoFocus
                />

                {error && (
                  <motion.p
                    className="text-red-500 text-xs mt-2 bg-red-50 p-1.5 rounded-md border border-red-100"
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <span className="font-medium">Error:</span> {error}
                  </motion.p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-sm font-medium rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition-all duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center"
                  disabled={isVerifying}
                >
                  {isVerifying ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-3 w-3 text-white"
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
                      Verifying
                    </span>
                  ) : (
                    "Submit"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
