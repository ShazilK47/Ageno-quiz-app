"use client";

import React from "react";

interface DifficultySettingProps {
  difficulty: string;
  duration: number;
  pointsMultiplier: number;
  onDurationChange: (difficulty: string, duration: number) => void;
  onMultiplierChange: (difficulty: string, multiplier: number) => void;
}

interface DifficultySettingsProps {
  availableDifficulties: string[];
  difficultySettings: {
    easy: { duration: number; pointsMultiplier: number };
    medium: { duration: number; pointsMultiplier: number };
    hard: { duration: number; pointsMultiplier: number };
  };
  onDurationChange: (difficulty: string, duration: number) => void;
  onMultiplierChange: (difficulty: string, multiplier: number) => void;
}

const DifficultySettingItem: React.FC<DifficultySettingProps> = ({
  difficulty,
  duration,
  pointsMultiplier,
  onDurationChange,
  onMultiplierChange,
}) => {
  return (
    <div className="p-4 bg-white border rounded-md shadow-sm">
      <h4 className="text-lg font-semibold capitalize mb-3">
        {difficulty} Difficulty
      </h4>

      <div className="space-y-4">
        <div>
          <label
            htmlFor={`duration-${difficulty}`}
            className="block text-sm font-medium text-gray-700"
          >
            Time Limit (minutes)
          </label>
          <input
            id={`duration-${difficulty}`}
            type="number"
            min="1"
            max="180"
            value={duration}
            onChange={(e) =>
              onDurationChange(difficulty, parseInt(e.target.value) || 1)
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50"
          />
        </div>

        <div>
          <label
            htmlFor={`multiplier-${difficulty}`}
            className="block text-sm font-medium text-gray-700"
          >
            Points Multiplier
          </label>
          <input
            id={`multiplier-${difficulty}`}
            type="number"
            min="0.1"
            max="5"
            step="0.1"
            value={pointsMultiplier}
            onChange={(e) =>
              onMultiplierChange(difficulty, parseFloat(e.target.value) || 1)
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring focus:ring-purple-500 focus:ring-opacity-50"
          />
          <p className="mt-1 text-sm text-gray-500">
            {pointsMultiplier === 1
              ? "Standard scoring (1x)"
              : pointsMultiplier < 1
              ? `Reduced scoring (${pointsMultiplier}x)`
              : `Bonus scoring (${pointsMultiplier}x)`}
          </p>
        </div>
      </div>
    </div>
  );
};

const DifficultySettings: React.FC<DifficultySettingsProps> = ({
  availableDifficulties,
  difficultySettings,
  onDurationChange,
  onMultiplierChange,
}) => {
  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-md">
      <h3 className="text-lg font-semibold mb-4">Difficulty Settings</h3>
      <p className="text-sm text-gray-600 mb-4">
        Customize time limits and point multipliers for each difficulty level.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {availableDifficulties.includes("easy") && (
          <DifficultySettingItem
            difficulty="easy"
            duration={difficultySettings.easy.duration}
            pointsMultiplier={difficultySettings.easy.pointsMultiplier}
            onDurationChange={onDurationChange}
            onMultiplierChange={onMultiplierChange}
          />
        )}

        {availableDifficulties.includes("medium") && (
          <DifficultySettingItem
            difficulty="medium"
            duration={difficultySettings.medium.duration}
            pointsMultiplier={difficultySettings.medium.pointsMultiplier}
            onDurationChange={onDurationChange}
            onMultiplierChange={onMultiplierChange}
          />
        )}

        {availableDifficulties.includes("hard") && (
          <DifficultySettingItem
            difficulty="hard"
            duration={difficultySettings.hard.duration}
            pointsMultiplier={difficultySettings.hard.pointsMultiplier}
            onDurationChange={onDurationChange}
            onMultiplierChange={onMultiplierChange}
          />
        )}
      </div>
    </div>
  );
};

export default DifficultySettings;
