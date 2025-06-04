# Difficulty Helpers Guide

This guide explains how to use the difficulty helpers to manage and display quiz difficulty settings.

## Overview

The difficulty helpers are a set of utility functions in `utils/difficulty-helpers.ts` that make it easier to work with quiz difficulty settings. These functions handle all the edge cases and provide fallbacks to ensure a consistent and reliable quiz experience.

## Available Functions

### `getDifficultyDuration(quiz: Quiz | null, difficulty: string): number`

Gets the duration (in minutes) for the specified difficulty level.

- **Parameters**:
  - `quiz`: The quiz object
  - `difficulty`: The difficulty level (easy, medium, hard)
- **Returns**: Duration in minutes for the specified difficulty, or the quiz's general duration as fallback
- **Fallbacks**:
  1. First tries to use difficulty-specific duration
  2. Falls back to the quiz's base duration
  3. Ultimate fallback: 30 minutes if all else fails

### `getDifficultyMultiplier(quiz: Quiz | null, difficulty: string): number`

Gets the point multiplier for the specified difficulty level.

- **Parameters**:
  - `quiz`: The quiz object
  - `difficulty`: The difficulty level (easy, medium, hard)
- **Returns**: Point multiplier for the specified difficulty, or 1.0 as fallback
- **Fallbacks**:
  1. First tries to use difficulty-specific multiplier
  2. Falls back to 1.0 if no multiplier is found

### `applyDifficultyMultiplier(rawScore: number, quiz: Quiz | null, difficulty: string): number`

Applies the difficulty multiplier to a raw score.

- **Parameters**:
  - `rawScore`: The raw score (0-100)
  - `quiz`: The quiz object
  - `difficulty`: The difficulty level (easy, medium, hard)
- **Returns**: The adjusted score, capped at 100
- **Note**: This function ensures the final score doesn't exceed 100, even with high multipliers

### `hasMultipleDifficulties(quiz: Quiz | null): boolean`

Checks if a quiz has multiple difficulty levels configured.

- **Parameters**:
  - `quiz`: The quiz object
- **Returns**: Boolean indicating if the quiz has multiple available difficulties
- **Logic**: Returns true only if the quiz has more than one difficulty in `availableDifficulties`

### `getDifficultyDisplayInfo(quiz: Quiz | null, difficulty: string)`

Gets formatted difficulty details for display in UI components.

- **Parameters**:
  - `quiz`: The quiz object
  - `difficulty`: The difficulty level (easy, medium, hard)
- **Returns**:
  ```typescript
  {
    duration: string; // e.g., "30 minutes"
    multiplier: string; // e.g., "1.5x"
    hasCustomSettings: boolean; // Whether custom settings exist for this difficulty
  }
  ```

### `getRecommendedDifficulty(quiz: Quiz | null): string`

Gets the recommended default difficulty level for a quiz.

- **Parameters**:
  - `quiz`: The quiz object
- **Returns**: The recommended difficulty level (prefers 'medium' if available)
- **Logic**:
  1. Prefers 'medium' if it's in the available difficulties
  2. Otherwise returns the first available difficulty
  3. Fallback to 'medium' if no difficulties are available

## Usage Examples

### In Quiz Creation Forms

```tsx
import { getDifficultyDuration, getDifficultyMultiplier } from "@/utils/difficulty-helpers";

// Get the duration for the easy difficulty
const easyDuration = getDifficultyDuration(quiz, "easy");

// Get the multiplier for the hard difficulty
const hardMultiplier = getDifficultyMultiplier(quiz, "hard");
```

### In Quiz Taking UI

```tsx
import { getDifficultyDisplayInfo, hasMultipleDifficulties } from "@/utils/difficulty-helpers";

// Check if multiple difficulties are available
const showDifficultySelector = hasMultipleDifficulties(quiz);

// Get formatted info for the selected difficulty
const difficultyInfo = getDifficultyDisplayInfo(quiz, selectedDifficulty);

// Display the info
return (
  <div>
    <p>Time limit: {difficultyInfo.duration}</p>
    <p>Point multiplier: {difficultyInfo.multiplier}</p>
  </div>
);
```

### When Calculating Scores

```tsx
import { applyDifficultyMultiplier } from "@/utils/difficulty-helpers";

// Calculate the raw score (0-100)
const rawScore = (correctAnswers / totalQuestions) * 100;

// Apply the difficulty multiplier and cap at 100
const finalScore = applyDifficultyMultiplier(rawScore, quiz, selectedDifficulty);
```

### Default Difficulty Selection

```tsx
import { getRecommendedDifficulty } from "@/utils/difficulty-helpers";

// Get the recommended difficulty for this quiz
const [selectedDifficulty, setSelectedDifficulty] = useState(
  getRecommendedDifficulty(quiz)
);
```

## Best Practices

1. **Always use the helper functions** instead of accessing `quiz.difficultySettings` directly to ensure proper fallbacks.
2. **Don't hardcode fallback durations** in your components. The helper functions already provide fallbacks.
3. **Use `hasMultipleDifficulties` to check** if you should show difficulty selection UI.
4. **Use `getRecommendedDifficulty` for default selection** instead of hardcoding "medium".
5. **Use `getDifficultyDisplayInfo` for UI display** to ensure consistent formatting.
6. **Use `applyDifficultyMultiplier` when calculating scores** to ensure proper scaling and capping.

## Common Issues

### Quiz Timer Doesn't Show the Right Duration

Make sure you're using `getDifficultyDuration` to get the duration and not accessing the quiz object directly. Also, ensure the timer is updated when the difficulty changes.

### Points Aren't Being Calculated Correctly

Use `applyDifficultyMultiplier` to apply the correct multiplier to raw scores. This function handles all the edge cases and ensures the score doesn't exceed 100.

### Difficulty Selection Not Showing Up

Check that the quiz has multiple difficulties by using `hasMultipleDifficulties(quiz)`. Also verify that `availableDifficulties` is properly set in the quiz object.
