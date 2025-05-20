/**
 * This function handles automatically loading questions for the default difficulty
 * when the quiz page loads. It ensures that users don't need to explicitly click
 * on the default difficulty to load the questions.
 *
 * @param {string} difficulty - The difficulty level to load questions for
 * @param {Function} loadQuestionsForDifficulty - The function that loads questions
 * @param {Function} setDifficultySelected - Function to mark difficulty as selected
 * @param {Function} setIsLoadingQuestions - Optional function to control loading state
 */
export const autoLoadQuestionsForDifficulty = (
  difficulty,
  loadQuestionsForDifficulty,
  setDifficultySelected,
  setIsLoadingQuestions = null
) => {
  console.log(
    `[AUTO-LOAD] Setting up auto-load for ${difficulty} difficulty...`
  );

  // Use setTimeout to ensure all state updates have been processed
  setTimeout(async () => {
    try {
      console.log(
        `[AUTO-LOAD] Starting auto-load for ${difficulty} difficulty...`
      );
      console.log(
        `[AUTO-LOAD] Using memoized loadQuestionsForDifficulty function:`,
        !!loadQuestionsForDifficulty
      ); // Check if the loadQuestionsForDifficulty function exists before calling
      if (!loadQuestionsForDifficulty) {
        console.error(
          "[AUTO-LOAD] ERROR: loadQuestionsForDifficulty function is not defined"
        );
        return;
      }

      // Call the load questions function and await the result
      const success = await loadQuestionsForDifficulty(difficulty);

      console.log(`[AUTO-LOAD] Load questions result:`, success);

      if (success === true) {
        console.log(`[AUTO-LOAD] Setting difficultySelected to true`);
        setDifficultySelected(true); // Mark difficulty as selected after loading questions
        console.log(
          `[AUTO-LOAD] Default difficulty ${difficulty} questions loaded successfully`
        );
      } else if (success === false) {
        console.warn(
          `[AUTO-LOAD] Failed to auto-load ${difficulty} questions - no questions found or error occurred`
        );
      } else {
        console.warn(
          `[AUTO-LOAD] Could not auto-load ${difficulty} questions - quiz may not be ready yet`
        );
      }
    } catch (err) {
      console.error(
        `[AUTO-LOAD] Error auto-loading questions for ${difficulty}:`,
        err
      );
    } finally {
      // Ensure loading state is reset if provided
      if (setIsLoadingQuestions) {
        console.log(`[AUTO-LOAD] Resetting loading state`);
        setIsLoadingQuestions(false);
      }
    }
  }, 800); // Increased timeout to give more time for states to update
};
