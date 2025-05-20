// utils/difficulty-helpers.ts
import { Quiz } from "@/firebase/firestore";

/**
 * Gets the duration for the specified difficulty level with proper error handling
 * @param quiz The quiz object
 * @param difficulty The difficulty level (easy, medium, hard)
 * @returns Duration in minutes for the specified difficulty, or the quiz's general duration as fallback
 */
export function getDifficultyDuration(
  quiz: Quiz | null,
  difficulty: string
): number {
  if (!quiz) {
    return 30; // Default duration if no quiz is provided
  }

  const defaultDuration = quiz.duration || 30; // Default to 30 minutes if quiz.duration is not set

  if (
    quiz.difficultySettings &&
    quiz.difficultySettings[
      difficulty as keyof typeof quiz.difficultySettings
    ] &&
    quiz.difficultySettings[difficulty as keyof typeof quiz.difficultySettings]
      ?.duration
  ) {
    return quiz.difficultySettings[
      difficulty as keyof typeof quiz.difficultySettings
    ]!.duration;
  }

  // Fall back to the quiz's general duration
  return defaultDuration;
}

/**
 * Gets the point multiplier for the specified difficulty level with proper error handling
 * @param quiz The quiz object
 * @param difficulty The difficulty level (easy, medium, hard)
 * @returns Point multiplier for the specified difficulty, or 1.0 as fallback
 */
export function getDifficultyMultiplier(
  quiz: Quiz | null,
  difficulty: string
): number {
  if (!quiz) {
    return 1.0; // Default multiplier if no quiz is provided
  }

  if (
    quiz.difficultySettings &&
    quiz.difficultySettings[
      difficulty as keyof typeof quiz.difficultySettings
    ] &&
    quiz.difficultySettings[difficulty as keyof typeof quiz.difficultySettings]
      ?.pointsMultiplier
  ) {
    return quiz.difficultySettings[
      difficulty as keyof typeof quiz.difficultySettings
    ]!.pointsMultiplier;
  }

  // Default multiplier is 1.0
  return 1.0;
}

/**
 * Applies the difficulty multiplier to a raw score with proper error handling and capping
 * @param rawScore The raw score (0-100)
 * @param quiz The quiz object containing difficulty settings
 * @param difficulty The selected difficulty level
 * @returns The adjusted score, capped at 100
 */
export function applyDifficultyMultiplier(
  rawScore: number,
  quiz: Quiz | null,
  difficulty: string
): number {
  const multiplier = getDifficultyMultiplier(quiz, difficulty);

  // Apply multiplier and ensure score doesn't exceed 100
  return Math.min(100, Math.round(rawScore * multiplier));
}

/**
 * Checks if a quiz has multiple difficulty levels configured
 * @param quiz The quiz object
 * @returns Boolean indicating if the quiz has multiple available difficulties
 */
export function hasMultipleDifficulties(quiz: Quiz | null): boolean {
  if (!quiz || !quiz.availableDifficulties) {
    return false;
  }

  return quiz.availableDifficulties.length > 1;
}

/**
 * Gets difficulty details for display in UI
 * @param quiz The quiz object
 * @param difficulty The selected difficulty level
 * @returns Object containing formatted duration and multiplier info
 */
export function getDifficultyDisplayInfo(
  quiz: Quiz | null,
  difficulty: string
) {
  if (!quiz) {
    return {
      duration: "30 minutes",
      multiplier: "1x",
      hasCustomSettings: false,
    };
  }

  const duration = getDifficultyDuration(quiz, difficulty);
  const multiplier = getDifficultyMultiplier(quiz, difficulty);
  const hasCustomSettings = Boolean(
    quiz.difficultySettings &&
      quiz.difficultySettings[
        difficulty as keyof typeof quiz.difficultySettings
      ]
  );

  return {
    duration: `${duration} minutes`,
    multiplier: `${multiplier}x`,
    hasCustomSettings,
  };
}
