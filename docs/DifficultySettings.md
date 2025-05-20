# Difficulty Settings Feature Documentation

## Overview

The Difficulty Settings feature enhances AgenoQuiz by allowing quiz creators to customize time limits and point multipliers for different difficulty levels. This creates a more dynamic quiz experience that can adapt to different skill levels.

## Features

- **Multiple Difficulty Levels**: Support for "easy", "medium", and "hard" difficulty levels
- **Customizable Time Limits**: Each difficulty level can have its own time limit
- **Point Multipliers**: Adjust scoring based on difficulty (e.g., higher multipliers for harder difficulties)
- **Flexible Configuration**: Enable only the difficulty levels you need

## How It Works

### For Quiz Creators

1. **Creating a Quiz with Difficulty Settings**:

   - When creating or editing a quiz, you'll see the "Difficulty Settings" section
   - Toggle which difficulties are available (easy, medium, hard)
   - For each selected difficulty, you can set:
     - **Duration**: The time limit in minutes for that difficulty level
     - **Points Multiplier**: How the raw score should be adjusted (e.g., 1.0x, 1.5x, 2.0x)

2. **Default Values**:

   | Difficulty | Default Duration | Default Multiplier |
   | ---------- | ---------------- | ------------------ |
   | Easy       | 30 minutes       | 1.0x               |
   | Medium     | 25 minutes       | 1.5x               |
   | Hard       | 20 minutes       | 2.0x               |

3. **Recommended Settings**:
   - **Easy**: Longer duration, lower multiplier (more time, less reward)
   - **Medium**: Moderate duration and multiplier (balanced)
   - **Hard**: Shorter duration, higher multiplier (less time, more reward)

### For Quiz Takers

1. **Selecting Difficulty**:

   - When joining a quiz with multiple difficulties, users can select their preferred level
   - The quiz interface shows the time limit and point multiplier for the selected difficulty

2. **Scoring**:
   - Raw scores are calculated as usual: (correct answers / total questions) \* 100
   - The difficulty multiplier is then applied: raw score \* multiplier
   - Final scores are capped at 100% to prevent exceeding the maximum

## Implementation Notes

- Difficulty settings are stored in the quiz document in Firestore
- Questions for each difficulty level are stored in separate subcollections
- The feature is backwards compatible with existing quizzes (defaults to using the main quiz duration)

## Best Practices

1. **Creating Good Difficulty Levels**:

   - Ensure all difficulties have sufficient questions
   - Make meaningful differences between difficulty levels (not just time changes)
   - Consider what makes a question "harder" - complexity, detail required, etc.

2. **Balanced Multipliers**:

   - Keep multipliers reasonable (1.0 - 3.0 range recommended)
   - Higher difficulties should have higher multipliers to reward the challenge

3. **Time Management**:
   - Ensure even the hardest difficulty gives enough time to reasonably complete the quiz
   - Test each difficulty level to confirm the time limits are appropriate

## Troubleshooting

- **Missing Questions**: If questions don't appear for a specific difficulty, check that you've saved questions for that difficulty level
- **Duration Issues**: If custom durations aren't working, verify the difficulty settings are properly saved
- **Scoring Problems**: Ensure point multipliers are reasonable values (greater than 0)

## Future Enhancements

- Difficulty-specific questions (different questions for different difficulty levels)
- Adaptive difficulty that changes based on user performance
- Additional difficulty levels beyond the standard three
