// __tests__/difficulty-helpers.test.ts
import {
  getDifficultyDuration,
  getDifficultyMultiplier,
  applyDifficultyMultiplier,
  hasMultipleDifficulties,
  getDifficultyDisplayInfo,
  getRecommendedDifficulty,
} from "../utils/difficulty-helpers";
import { Quiz } from "../firebase/firestore";

// Mock console.log and console.warn to prevent noise in test output
global.console.log = jest.fn();
global.console.warn = jest.fn();

// Create mock quiz data for testing
const mockQuiz: Quiz = {
  id: "quiz123",
  title: "Test Quiz",
  description: "A quiz for testing difficulty helpers",
  duration: 30, // Base quiz duration
  availableDifficulties: ["easy", "medium", "hard"],
  difficultySettings: {
    easy: { duration: 45, pointsMultiplier: 1.0 },
    medium: { duration: 30, pointsMultiplier: 1.5 },
    hard: { duration: 20, pointsMultiplier: 2.0 },
  },
  questions: [],
  ownerId: "user123",
  active: true,
  code: "ABC123",
  createdAt: new Date(),
};

describe("Difficulty Helpers", () => {
  describe("getDifficultyDuration", () => {
    test("returns the correct duration for a specific difficulty", () => {
      expect(getDifficultyDuration(mockQuiz, "easy")).toBe(45);
      expect(getDifficultyDuration(mockQuiz, "medium")).toBe(30);
      expect(getDifficultyDuration(mockQuiz, "hard")).toBe(20);
    });

    test("fallbacks to quiz base duration if difficulty settings don't exist", () => {
      const quizWithoutDifficultySettings: Quiz = {
        ...mockQuiz,
        difficultySettings: undefined,
      };
      expect(getDifficultyDuration(quizWithoutDifficultySettings, "easy")).toBe(30);
    });

    test("fallbacks to quiz base duration if specific difficulty doesn't exist", () => {
      const quizWithIncompleteSettings: Quiz = {
        ...mockQuiz,
        difficultySettings: {
          easy: { duration: 45, pointsMultiplier: 1.0 },
          // Missing medium and hard
        },
      };
      expect(getDifficultyDuration(quizWithIncompleteSettings, "medium")).toBe(30);
    });

    test("returns 30 minutes as ultimate fallback if no quiz data is provided", () => {
      expect(getDifficultyDuration(null, "medium")).toBe(30);
    });
  });

  describe("getDifficultyMultiplier", () => {
    test("returns the correct multiplier for a specific difficulty", () => {
      expect(getDifficultyMultiplier(mockQuiz, "easy")).toBe(1.0);
      expect(getDifficultyMultiplier(mockQuiz, "medium")).toBe(1.5);
      expect(getDifficultyMultiplier(mockQuiz, "hard")).toBe(2.0);
    });

    test("fallbacks to 1.0 if difficulty settings don't exist", () => {
      const quizWithoutDifficultySettings: Quiz = {
        ...mockQuiz,
        difficultySettings: undefined,
      };
      expect(getDifficultyMultiplier(quizWithoutDifficultySettings, "easy")).toBe(1.0);
    });

    test("fallbacks to 1.0 if specific difficulty doesn't exist", () => {
      const quizWithIncompleteSettings: Quiz = {
        ...mockQuiz,
        difficultySettings: {
          easy: { duration: 45, pointsMultiplier: 1.0 },
          // Missing medium and hard
        },
      };
      expect(getDifficultyMultiplier(quizWithIncompleteSettings, "medium")).toBe(1.0);
    });

    test("returns 1.0 as ultimate fallback if no quiz data is provided", () => {
      expect(getDifficultyMultiplier(null, "medium")).toBe(1.0);
    });
  });

  describe("applyDifficultyMultiplier", () => {
    test("applies the correct multiplier to a raw score", () => {
      // Raw score: 80, easy multiplier: 1.0 => 80
      expect(applyDifficultyMultiplier(80, mockQuiz, "easy")).toBe(80);
      // Raw score: 60, medium multiplier: 1.5 => 90
      expect(applyDifficultyMultiplier(60, mockQuiz, "medium")).toBe(90);
      // Raw score: 40, hard multiplier: 2.0 => 80
      expect(applyDifficultyMultiplier(40, mockQuiz, "hard")).toBe(80);
    });

    test("caps the score at 100", () => {
      // Raw score: 70, hard multiplier: 2.0 => 140, but capped at 100
      expect(applyDifficultyMultiplier(70, mockQuiz, "hard")).toBe(100);
    });

    test("handles null quiz by using fallback multiplier", () => {
      // Raw score: 80, no quiz, fallback multiplier: 1.0 => 80
      expect(applyDifficultyMultiplier(80, null, "medium")).toBe(80);
    });
  });

  describe("hasMultipleDifficulties", () => {
    test("returns true if multiple difficulties are available", () => {
      expect(hasMultipleDifficulties(mockQuiz)).toBe(true);
    });

    test("returns false if only one difficulty is available", () => {
      const quizWithOneDifficulty: Quiz = {
        ...mockQuiz,
        availableDifficulties: ["medium"],
      };
      expect(hasMultipleDifficulties(quizWithOneDifficulty)).toBe(false);
    });

    test("returns false if no difficulties are available", () => {
      const quizWithNoDifficulties: Quiz = {
        ...mockQuiz,
        availableDifficulties: [],
      };
      expect(hasMultipleDifficulties(quizWithNoDifficulties)).toBe(false);
    });

    test("returns false if availableDifficulties is undefined", () => {
      const quizWithUndefinedDifficulties: Quiz = {
        ...mockQuiz,
        availableDifficulties: undefined,
      };
      expect(hasMultipleDifficulties(quizWithUndefinedDifficulties)).toBe(false);
    });

    test("returns false if quiz is null", () => {
      expect(hasMultipleDifficulties(null)).toBe(false);
    });
  });

  describe("getDifficultyDisplayInfo", () => {
    test("returns formatted difficulty info for display", () => {
      const easyInfo = getDifficultyDisplayInfo(mockQuiz, "easy");
      expect(easyInfo.duration).toBe("45 minutes");
      expect(easyInfo.multiplier).toBe("1x");
      expect(easyInfo.hasCustomSettings).toBe(true);

      const mediumInfo = getDifficultyDisplayInfo(mockQuiz, "medium");
      expect(mediumInfo.duration).toBe("30 minutes");
      expect(mediumInfo.multiplier).toBe("1.5x");
      expect(mediumInfo.hasCustomSettings).toBe(true);

      const hardInfo = getDifficultyDisplayInfo(mockQuiz, "hard");
      expect(hardInfo.duration).toBe("20 minutes");
      expect(hardInfo.multiplier).toBe("2x");
      expect(hardInfo.hasCustomSettings).toBe(true);
    });

    test("returns fallback values if quiz is null", () => {
      const info = getDifficultyDisplayInfo(null, "medium");
      expect(info.duration).toBe("30 minutes");
      expect(info.multiplier).toBe("1x");
      expect(info.hasCustomSettings).toBe(false);
    });

    test("indicates no custom settings when difficulty is not configured", () => {
      const quizWithoutSettings: Quiz = {
        ...mockQuiz,
        difficultySettings: undefined,
      };
      const info = getDifficultyDisplayInfo(quizWithoutSettings, "medium");
      expect(info.duration).toBe("30 minutes");
      expect(info.multiplier).toBe("1x");
      expect(info.hasCustomSettings).toBe(false);
    });
  });

  describe("getRecommendedDifficulty", () => {
    test("returns 'medium' if it's available", () => {
      expect(getRecommendedDifficulty(mockQuiz)).toBe("medium");
    });

    test("returns first available difficulty if 'medium' is not available", () => {
      const quizWithoutMedium: Quiz = {
        ...mockQuiz,
        availableDifficulties: ["easy", "hard"],
      };
      expect(getRecommendedDifficulty(quizWithoutMedium)).toBe("easy");
    });

    test("returns 'medium' as fallback if no difficulties are available", () => {
      const quizWithNoDifficulties: Quiz = {
        ...mockQuiz,
        availableDifficulties: [],
      };
      expect(getRecommendedDifficulty(quizWithNoDifficulties)).toBe("medium");
    });

    test("returns 'medium' as fallback if availableDifficulties is undefined", () => {
      const quizWithUndefinedDifficulties: Quiz = {
        ...mockQuiz,
        availableDifficulties: undefined,
      };
      expect(getRecommendedDifficulty(quizWithUndefinedDifficulties)).toBe("medium");
    });

    test("returns 'medium' as fallback if quiz is null", () => {
      expect(getRecommendedDifficulty(null)).toBe("medium");
    });
  });
});
