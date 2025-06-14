"use client";
import React, { useEffect, useMemo } from "react";

interface DifficultySelectProps {
  availableDifficulties: string[];
  selectedDifficulty: string;
  onSelectDifficulty: (difficulty: string) => void;
  difficultySettings?: {
    [key: string]: { 
      duration: number; 
      pointsMultiplier: number;
    };
  };
  baseDuration?: number; // Add the quiz's base duration as a prop
}

const DifficultySelect: React.FC<DifficultySelectProps> = ({
  availableDifficulties,
  selectedDifficulty,
  onSelectDifficulty,
  difficultySettings,
  baseDuration = 30, // Default to 30 minutes if not provided
}) => {
  // Ensure default selection if none provided
  useEffect(() => {
    if (!selectedDifficulty && availableDifficulties.length > 0) {
      // Prefer medium difficulty if available
      const defaultDifficulty = availableDifficulties.includes("medium")
        ? "medium"
        : availableDifficulties[0];

      console.log(
        `[DIFFICULTY-SELECT] No difficulty selected, defaulting to ${defaultDifficulty}`
      );
      onSelectDifficulty(defaultDifficulty);
    } else if (selectedDifficulty) {
      console.log(
        `[DIFFICULTY-SELECT] Using pre-selected difficulty: ${selectedDifficulty}`
      );
    }
  }, [selectedDifficulty, availableDifficulties, onSelectDifficulty]);
  // Generate difficulty information with custom time and points based on settings
  const difficultyInfo = useMemo(() => {
    // Log to debug the settings
    console.log('[DIFFICULTY-SELECT] Rendering with settings:', { difficultySettings, baseDuration });
    
    const baseInfo = {
      easy: {
        color: "green",
        label: "Easy",
        timeLabel: difficultySettings?.easy 
          ? `${difficultySettings.easy.duration} mins` 
          : `${baseDuration} mins`, // Use base duration instead of vague text
        pointsLabel: difficultySettings?.easy 
          ? `${difficultySettings.easy.pointsMultiplier}x points` 
          : "1.0x points",
        description: "Recommended for beginners",
      },
      medium: {
        color: "blue",
        label: "Medium",
        timeLabel: difficultySettings?.medium 
          ? `${difficultySettings.medium.duration} mins` 
          : `${baseDuration} mins`, // Use base duration instead of vague text
        pointsLabel: difficultySettings?.medium 
          ? `${difficultySettings.medium.pointsMultiplier}x points` 
          : "1.5x points",
        description: "Recommended default",
      },
      hard: {
        color: "red",
        label: "Hard",
        timeLabel: difficultySettings?.hard 
          ? `${difficultySettings.hard.duration} mins` 
          : `${baseDuration} mins`, // Use base duration instead of vague text
        pointsLabel: difficultySettings?.hard 
          ? `${difficultySettings.hard.pointsMultiplier}x points` 
          : "2.0x points",
        description: "For experts only",
      },
    };
      return baseInfo;
  }, [difficultySettings, baseDuration]);

  return (
    <div className="mb-6">
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes glow-green {
          0% {
            box-shadow: 0 0 5px rgba(34, 197, 94, 0.2);
          }
          50% {
            box-shadow: 0 0 15px rgba(34, 197, 94, 0.4);
          }
          100% {
            box-shadow: 0 0 5px rgba(34, 197, 94, 0.2);
          }
        }
        @keyframes glow-blue {
          0% {
            box-shadow: 0 0 5px rgba(59, 130, 246, 0.2);
          }
          50% {
            box-shadow: 0 0 15px rgba(59, 130, 246, 0.4);
          }
          100% {
            box-shadow: 0 0 5px rgba(59, 130, 246, 0.2);
          }
        }
        @keyframes glow-red {
          0% {
            box-shadow: 0 0 5px rgba(239, 68, 68, 0.2);
          }
          50% {
            box-shadow: 0 0 15px rgba(239, 68, 68, 0.4);
          }
          100% {
            box-shadow: 0 0 5px rgba(239, 68, 68, 0.2);
          }
        }
        .selected-difficulty-green {
          animation: glow-green 2s infinite;
        }
        .selected-difficulty-blue {
          animation: glow-blue 2s infinite;
        }
        .selected-difficulty-red {
          animation: glow-red 2s infinite;
        }
        @keyframes checkmarkAppear {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.5);
            opacity: 0.5;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        :root {
          --green-color: #16a34a;
          --blue-color: #2563eb;
          --red-color: #dc2626;
          --gray-color: #4b5563;
        }
      `}</style>{" "}
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-medium">Select Difficulty Level</h3>
        {selectedDifficulty && (
          <div
            className={`text-sm font-normal ${
              selectedDifficulty === "medium"
                ? "text-blue-600"
                : "text-indigo-600"
            } flex items-center`}
          >
            <span
              className={`w-2 h-2 ${
                selectedDifficulty === "medium"
                  ? "bg-blue-600"
                  : "bg-indigo-600"
              } rounded-full mr-2 animate-pulse`}
            ></span>
            {selectedDifficulty === "medium" ? (
              <>
                <span className="font-semibold">Medium</span> difficulty is
                auto-selected and pre-loaded
              </>
            ) : (
              <>Questions for {selectedDifficulty} difficulty are pre-loaded</>
            )}
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {availableDifficulties.map((difficulty, index) => {
          const info = difficultyInfo[
            difficulty as keyof typeof difficultyInfo
          ] || {
            color: "gray",
            label: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
            timeLabel: "Standard time",
            pointsLabel: "Standard points",
          };
          const colorClasses = {
            green: {
              selected: "border-green-500 bg-green-50 shadow",
              hover: "hover:border-green-300 hover:bg-green-50/50",
              dot: "bg-green-500",
              focus: "focus:ring-2 focus:ring-green-200 focus:outline-none",
            },
            blue: {
              selected: "border-blue-500 bg-blue-50 shadow",
              hover: "hover:border-blue-300 hover:bg-blue-50/50",
              dot: "bg-blue-500",
              focus: "focus:ring-2 focus:ring-blue-200 focus:outline-none",
            },
            red: {
              selected: "border-red-500 bg-red-50 shadow",
              hover: "hover:border-red-300 hover:bg-red-50/50",
              dot: "bg-red-500",
              focus: "focus:ring-2 focus:ring-red-200 focus:outline-none",
            },
            gray: {
              selected: "border-gray-500 bg-gray-50 shadow",
              hover: "hover:border-gray-300 hover:bg-gray-50/50",
              dot: "bg-gray-500",
              focus: "focus:ring-2 focus:ring-gray-200 focus:outline-none",
            },
          };

          const colors = colorClasses[info.color as keyof typeof colorClasses];

          return (
            <button
              key={difficulty}
              onClick={() => onSelectDifficulty(difficulty)}
              style={{
                animationDelay: `${index * 100}ms`,
                opacity: 0,
                animation: "fadeIn 0.5s ease forwards",
              }}
              className={`p-4 rounded-lg border-2 transition-all duration-300 ease-in-out transform hover:scale-105 hover:rotate-1 ${
                colors.focus
              } ${
                selectedDifficulty === difficulty
                  ? `${colors.selected} hover:shadow-lg selected-difficulty-${info.color}`
                  : `border-gray-200 ${colors.hover} hover:shadow-md`
              } ${
                difficulty === "medium" && !selectedDifficulty
                  ? "border-blue-300 shadow-sm"
                  : ""
              }`}
              aria-pressed={selectedDifficulty === difficulty}
              type="button"
            >
              <h3 className="text-lg font-medium flex items-center relative">
                <span
                  className={`w-3 h-3 ${colors.dot} rounded-full mr-2 ${
                    selectedDifficulty === difficulty ? "animate-pulse" : ""
                  }`}
                ></span>{" "}
                {info.label}{" "}
                {difficulty === "medium" && (
                  <span className="ml-1 text-xs font-normal text-blue-500 align-top">
                    (default)
                  </span>
                )}
                {selectedDifficulty === difficulty && (
                  <span
                    className="absolute -right-6 top-0 text-sm font-bold transition-opacity duration-300"
                    style={{
                      color: `var(--${info.color}-color, #16a34a)`,
                      animation: "checkmarkAppear 0.3s ease-out",
                    }}
                  >
                    ✓
                  </span>
                )}
              </h3>

              <div className="mt-2 flex justify-between items-center text-gray-500">
                <div className="flex flex-col">                  <div className="flex items-center text-sm font-semibold">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-1"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span className={difficultySettings && difficultySettings[difficulty] ? "font-bold" : ""}>
                      {info.timeLabel}
                    </span>
                    {difficultySettings && difficultySettings[difficulty] && (
                      <span className="ml-1 text-xs bg-indigo-100 text-indigo-800 rounded-full px-2 py-0.5">
                        {difficultySettings[difficulty].duration} min
                      </span>
                    )}
                  </div>
                  <div className="flex items-center mt-2 text-sm font-semibold">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="mr-1"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                    {info.pointsLabel}
                  </div>
                </div>
              </div>

              <p
                className="text-xs text-gray-400 mt-3"
                style={{ minHeight: "2.5rem" }}
              >
                {info.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DifficultySelect;
