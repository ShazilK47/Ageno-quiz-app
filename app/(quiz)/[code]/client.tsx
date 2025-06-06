"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { getQuizByCode, Quiz, submitQuizResponse } from "@/firebase/firestore";
import DifficultySelect from "@/components/quiz/DifficultySelect";
import QuizTimer from "@/components/quiz/QuizTimer";
import { getQuestionsByDifficulty } from "@/firebase/quizDifficulty";
import { FixedScoreDisplay } from "@/components/quiz/FixedScoreDisplay";
import { CorrectAnswersDisplay } from "@/components/quiz/CorrectAnswersDisplay";
import { autoLoadQuestionsForDifficulty } from "./auto-load-questions";

interface UserAnswer {
  questionId: string;
  selectedOptionIndex: number | null;
}

// For Next.js 15, we use a simpler interface for client components
interface ClientProps {
  code: string;
}

export default function QuizClient({ code }: ClientProps) {
  // Use Promise.resolve to ensure params is a Promise (it might already be)
 
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Quiz session state
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizStartTime, setQuizStartTime] = useState<Date | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [responseId, setResponseId] = useState<string | null>(null);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Create a ref to track the latest calculated score value to avoid state closure issues
  const lastCalculatedScoreRef = useRef<number | null>(null);
  // Add a ref to track if score was calculated, even if the state update fails
  const scoreCalculatedRef = useRef<boolean>(false);

  // Difficulty level state
  const [availableDifficulties, setAvailableDifficulties] = useState<string[]>([
    "easy",
    "medium",
    "hard",
  ]);
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<string>("medium");
  const [difficultySelected, setDifficultySelected] = useState<boolean>(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState<boolean>(false);

  // State to track notifications about difficulty changes
  const [difficultyChangeNotice, setDifficultyChangeNotice] = useState<string | null>(null);

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

  // Ensure score is preserved when quiz is submitted
  useEffect(() => {
    if (
      quizSubmitted &&
      score === null &&
      lastCalculatedScoreRef.current !== null
    ) {
      console.log("Restoring score from ref:", lastCalculatedScoreRef.current);
      setScore(lastCalculatedScoreRef.current);
    }
  }, [quizSubmitted, score]);

  // Add effect to log score states for debugging
  useEffect(() => {
    if (quizSubmitted) {
      console.log(
        `Score state debug - state:${score}, ref:${lastCalculatedScoreRef.current}, calculated:${scoreCalculatedRef.current}`
      );
    }
  }, [quizSubmitted, score]);

  // Remove initialization effect to avoid re-render loops
  // We'll rely solely on handleStartQuiz to initialize the timer

  // We'll use a single useEffect for auto-loading questions
  // that will be created after the loadQuestionsForDifficulty function is defined

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
        
        // Debug the quiz data with detailed information about difficulty settings
        console.log("=== QUIZ DATA DEBUG INFO ===");
        console.log(`Quiz ID: ${quizData.id}`);
        console.log(`Base duration: ${quizData.duration} minutes`);
        console.log(`Available difficulties: ${quizData.availableDifficulties?.join(", ") || "none"}`);
        
        if (quizData.difficultySettings) {
          console.log("Difficulty Settings:");
          for (const [diff, settings] of Object.entries(quizData.difficultySettings)) {
            console.log(`- ${diff}: ${settings?.duration} mins, ${settings?.pointsMultiplier}x points`);
          }
        } else {
          console.log("No difficulty settings available, will use base duration fallback");
        }
        console.log("===========================")

        // Debug the quiz data with detailed information about difficulty settings
        console.log("=== QUIZ DATA DEBUG INFO ===");
        console.log(`Quiz ID: ${quizData.id}`);
        console.log(`Base duration: ${quizData.duration} minutes`);
        console.log(`Available difficulties: ${quizData.availableDifficulties?.join(", ") || "none"}`);
        
        if (quizData.difficultySettings) {
          console.log("Difficulty Settings:");
          for (const [diff, settings] of Object.entries(quizData.difficultySettings)) {
            console.log(`- ${diff}: ${settings.duration} mins, ${settings.pointsMultiplier}x points`);
          }
        } else {
          console.log("No difficulty settings available, will use base duration fallback");
        }
        console.log("===========================");

        // Set available difficulties if they exist in quiz data
        if (
          quizData.availableDifficulties &&
          quizData.availableDifficulties.length > 0
        ) {
          setAvailableDifficulties(quizData.availableDifficulties);
          // Prefer "medium" difficulty if available, otherwise default to first available
          const mediumDifficultyExists =
            quizData.availableDifficulties.includes("medium");
          const defaultDifficulty = mediumDifficultyExists
            ? "medium"
            : quizData.availableDifficulties[0];

          // Set selectedDifficulty here but not difficultySelected
          // This triggers the auto-load effect to load questions for this difficulty
          setSelectedDifficulty(defaultDifficulty);
          console.log(`Default difficulty set to: ${defaultDifficulty}`);

          // Note: We intentionally don't set difficultySelected=true here
          // so that the auto-loading effect can trigger and load questions
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
                isCorrect: Number(key) === q.correctIndex, // Set isCorrect based on correctIndex
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

  // All auto-loading functionality will be consolidated into a single useEffect
  // that will be defined after the loadQuestionsForDifficulty function

  // Check if questions are already loaded when the component mounts
  useEffect(() => {
    // Debug the current state
    console.log(`[PRELOADED-CHECK] Component state:`, {
      hasQuestions: quiz?.questions && quiz.questions.length > 0,
      questionsCount: quiz?.questions?.length || 0,
      difficultySelected,
      isLoadingQuestions,
      selectedDifficulty,
    });

    if (
      quiz?.questions &&
      quiz.questions.length > 0 &&
      !difficultySelected &&
      !isLoadingQuestions
    ) {
      console.log(
        `[PRELOADED-CHECK] Questions already loaded in quiz (${
          quiz?.questions?.length || 0
        } questions), marking difficulty as selected`
      );
      setDifficultySelected(true);
      console.log(
        `[PRELOADED-CHECK] Currently selected difficulty: ${selectedDifficulty}`
      );

      // Initialize user answers if not already done
      if (userAnswers.length === 0 && quiz?.questions) {
        const initialAnswers = quiz.questions.map((q) => ({
          questionId: q.id,
          selectedOptionIndex: null,
        }));
        setUserAnswers(initialAnswers);
        console.log(
          `[PRELOADED-CHECK] Initialized ${initialAnswers.length} user answers for pre-loaded questions`
        );
      }
    } else if (
      quiz?.questions?.length === 0 &&
      !isLoadingQuestions &&
      selectedDifficulty
    ) {
      // This case handles when we have a selected difficulty but no questions
      console.log(
        `[PRELOADED-CHECK] Selected difficulty ${selectedDifficulty} but no questions available`
      );
      // We may need to auto-load if not already trying to load
      console.log(`[PRELOADED-CHECK] Auto-load trigger check:`, {
        difficultySelected,
        quizId: quiz?.id,
        isLoadingQuestions,
      });
    }
  }, [
    quiz?.questions,
    quiz?.questions?.length,
    difficultySelected,
    isLoadingQuestions,
    userAnswers.length,
    selectedDifficulty,
    quiz?.id,
  ]);

  // Load questions for selected difficulty - memoized to avoid dependency issues
  const loadQuestionsForDifficulty = useCallback(
    async (difficulty: string) => {
      if (!quiz || !quiz.id) {
        console.warn(`Cannot load questions: quiz or quiz.id is missing`);
        return false; // Indicate failure
      }

      setIsLoadingQuestions(true);

      try {
        // Get questions for the selected difficulty
        console.log(
          `Loading ${difficulty} difficulty questions for quiz ${quiz.id}`
        );

        // Track the current questions before we attempt to load new ones
        const existingQuestions = quiz.questions || [];

        // Log the user answers for debugging
        console.log(
          `Current user answers before loading: ${userAnswers.length}`
        );

        // Request difficulty-specific questions
        const questions = await getQuestionsByDifficulty(quiz.id, difficulty);

        if (!questions || questions.length === 0) {
          console.warn(
            `No ${difficulty} difficulty questions found, checking if quiz already has questions`
          );

          // If the quiz already has questions loaded, we can use those
          if (existingQuestions.length > 0) {
            console.log(
              `Using ${existingQuestions.length} existing questions from the quiz`
            );
            setDifficultySelected(true);

            // Just initialize user answers with the existing questions
            const initialAnswers = existingQuestions.map((q) => ({
              questionId: q.id,
              selectedOptionIndex: null,
            }));

            // Make sure we preserve the original questions - don't lose them!
            setQuiz({
              ...quiz,
              // Explicitly set questions again to ensure they're preserved
              questions: existingQuestions,
            });

            setUserAnswers(initialAnswers);
            setIsLoadingQuestions(false);

            // Store the selected difficulty even when using existing questions
            setSelectedDifficulty(difficulty);

            return true; // Successfully used existing questions
          }

          setError(`No questions found for ${difficulty} difficulty level`);
          return false; // No questions available
        }

        console.log(
          `Loaded ${questions.length} questions for ${difficulty} difficulty`
        );

        // Make sure the questions have valid IDs
        const validatedQuestions = questions.map((q, i) => {
          // Ensure each question has a valid ID
          if (!q.id || q.id.trim() === "") {
            console.warn(`Question at index ${i} has no ID, generating one`);
            return { ...q, id: `q_${i}_${Date.now()}` };
          }
          return q;
        });

        // Update quiz with questions for this difficulty
        setQuiz({
          ...quiz,
          questions: validatedQuestions,
        });

        // Initialize user answers for new questions
        const initialAnswers = validatedQuestions.map((q) => ({
          questionId: q.id,
          selectedOptionIndex: null,
        }));
        setUserAnswers(initialAnswers);

        setDifficultySelected(true);
        return true; // Successfully loaded new questions
      } catch (err) {
        console.error(
          `Error loading questions for ${difficulty} difficulty:`,
          err
        );
        setError(`Failed to load questions for ${difficulty} difficulty level`);
        return false; // Error occurred while loading questions
      } finally {
        setIsLoadingQuestions(false);
      }
    },
    [
      quiz,
      userAnswers.length,
      setUserAnswers,
      setDifficultySelected,
      setError,
      setQuiz,
      setIsLoadingQuestions,
      // Removed getQuestionsByDifficulty as it's coming from an import and doesn't need to be in the dependency array
    ]
  );

  // Get the point multiplier for the selected difficulty with proper error handling
  const getDifficultyMultiplier = (quiz: Quiz, difficulty: string): number => {
    if (
      quiz.difficultySettings &&
      quiz.difficultySettings[
        difficulty as keyof typeof quiz.difficultySettings
      ]?.pointsMultiplier
    ) {
      return quiz.difficultySettings[
        difficulty as keyof typeof quiz.difficultySettings
      ]!.pointsMultiplier;
    }
    // Default multiplier is 1.0
    return 1.0;
  };

  // Create a ref to the memoized load questions function to avoid stale closures
  const memoizedLoadQuestions = useRef(loadQuestionsForDifficulty);

  // Update the memoized ref whenever loadQuestionsForDifficulty changes
  useEffect(() => {
    memoizedLoadQuestions.current = loadQuestionsForDifficulty;
  }, [loadQuestionsForDifficulty]); // We're using useCallback for loadQuestionsForDifficulty instead of a separate memoized ref

  // Single auto-load questions effect that runs when the quiz is loaded
  useEffect(() => {
    // Debug the current state
    console.log(`[AUTO-LOAD-EFFECT] Checking auto-load conditions:`, {
      quizId: quiz?.id,
      selectedDifficulty,
      difficultySelected,
      isLoadingQuestions,
      quizHasQuestions: (quiz?.questions && quiz.questions.length > 0) || false,
    });

    // Skip if:
    // - Quiz data isn't loaded yet
    // - No difficulty is selected
    // - Questions are already loaded for the selected difficulty
    // - We're currently in the process of loading questions
    if (
      !quiz?.id ||
      !selectedDifficulty ||
      difficultySelected ||
      isLoadingQuestions
    ) {
      console.log(
        `[AUTO-LOAD-EFFECT] Skipping auto-load due to conditions not met`
      );
      return;
    }

    console.log(
      `[AUTO-LOAD-EFFECT] Auto-loading questions for ${selectedDifficulty} difficulty now that quiz is loaded`
    );

    // Prevent other auto-loads by setting loading state
    setIsLoadingQuestions(true);

    console.log(
      `[AUTO-LOAD-EFFECT] memoizedLoadQuestions reference:`,
      !!memoizedLoadQuestions.current
    );

    // Use the autoLoadQuestionsForDifficulty utility function with loading state control
    autoLoadQuestionsForDifficulty(
      selectedDifficulty,
      memoizedLoadQuestions.current,
      setDifficultySelected,
      setIsLoadingQuestions
    );
  }, [quiz?.id, quiz?.questions, selectedDifficulty, difficultySelected, isLoadingQuestions]);

  // Timer effect for the quiz
  // Timer effect for the quiz is now handled by the QuizTimer component
  useEffect(() => {
    // This effect now only handles logging the difficulty duration
    if (quizStarted && quiz && !quizSubmitted) {
      // Use specific difficulty settings or fall back to the quiz's base duration
      const quizDuration = quiz.difficultySettings?.[selectedDifficulty as keyof typeof quiz.difficultySettings]?.duration || 
        quiz.duration || 30; // Fallback to base duration, or 30 minutes as last resort
      
      console.log(
        `Using ${selectedDifficulty} difficulty duration: ${quizDuration} minutes`
      );
    }
  }, [quizStarted, quiz, quizSubmitted, selectedDifficulty]);

  // Effect to show a notification when difficulty changes and clear it after a few seconds
  useEffect(() => {
    if (quizStarted && quiz) {
      // Use specific difficulty settings or fall back to the quiz's base duration
      const duration = quiz.difficultySettings?.[selectedDifficulty as keyof typeof quiz.difficultySettings]?.duration || 
        quiz.duration || 30; // Fallback to base duration, or 30 minutes as last resort
      
      setDifficultyChangeNotice(`Time adjusted to ${duration} minutes for ${selectedDifficulty} difficulty`);
      
      // Clear the message after 5 seconds
      const timer = setTimeout(() => {
        setDifficultyChangeNotice(null);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [selectedDifficulty, quizStarted, quiz]);

  const handleDifficultySelect = async (difficulty: string) => {
    console.log(`[MANUAL-SELECT] User selected ${difficulty} difficulty`);

    if (difficulty === selectedDifficulty) {
      console.log(`Already on ${difficulty} difficulty, skipping update`);
      return; // Avoid unnecessary re-renders if difficulty hasn't changed
    }

    // Update the selected difficulty state
    setSelectedDifficulty(difficulty);

    // Reset the timer based on the new difficulty's duration
    if (quiz) {
      // Use specific difficulty settings or fall back to the quiz's base duration
      const newDuration = quiz.difficultySettings?.[difficulty as keyof typeof quiz.difficultySettings]?.duration || 
        quiz.duration || 30; // Fallback to base duration, or 30 minutes as last resort
      
      console.log(`Resetting timer for ${difficulty} difficulty: ${newDuration} minutes`);
      
      // Convert minutes to seconds for the timer
      const newTimeRemaining = newDuration * 60;
      setTimeRemaining(newTimeRemaining);
    }

    // Show loading state
    setIsLoadingQuestions(true);

    try {
      // Load questions for the selected difficulty
      console.log(
        `[MANUAL-SELECT] Manually loading questions for ${difficulty} difficulty`
      );
      const success = await loadQuestionsForDifficulty(difficulty);

      if (success) {
        console.log(
          `[MANUAL-SELECT] Setting difficultySelected to true for ${difficulty}`
        );
        setDifficultySelected(true); // Mark difficulty as selected after loading questions
        console.log(
          `[MANUAL-SELECT] Successfully loaded questions for ${difficulty} difficulty`
        );
      } else {
        console.warn(
          `[MANUAL-SELECT] Failed to load questions for ${difficulty} difficulty`
        );
      }
    } catch (error) {
      console.error(
        `[MANUAL-SELECT] Error loading questions for ${difficulty} difficulty:`,
        error
      );
    } finally {
      // Always make sure loading state is reset
      console.log(`[MANUAL-SELECT] Resetting loading state`);
      setIsLoadingQuestions(false);
    }
  };

  const handleStartQuiz = async () => {
    // If difficulty is not yet selected, select it first
    if (!difficultySelected && quiz?.id) {
      setIsLoadingQuestions(true);
      try {
        const success = await loadQuestionsForDifficulty(selectedDifficulty);
        if (!success) {
          console.error(
            `Failed to load questions for ${selectedDifficulty} difficulty`
          );
          return; // Don't continue if question loading failed
        }
        setDifficultySelected(true); // Mark difficulty as selected after loading questions
      } catch (err) {
        console.error("Error loading questions:", err);
        return;
      } finally {
        setIsLoadingQuestions(false);
      }
    }

    // Set the timer based on the selected difficulty
    if (quiz) {
      // Use specific difficulty settings or fall back to the quiz's base duration
      const duration = quiz.difficultySettings?.[selectedDifficulty as keyof typeof quiz.difficultySettings]?.duration || 
        quiz.duration || 30; // Fallback to base duration, or 30 minutes as last resort
      
      console.log(`Starting quiz with ${selectedDifficulty} difficulty: ${duration} minutes`);
      // Convert minutes to seconds for the timer
      setTimeRemaining(duration * 60);
    }
    
    setQuizStarted(true);
    setQuizStartTime(new Date());
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
    if (!quiz || !quizStartTime) {
      console.error("Cannot submit quiz: Missing quiz data or start time");
      setError("Cannot submit quiz due to missing data");
      return;
    }

    // Validate questions array
    if (!quiz.questions || !Array.isArray(quiz.questions)) {
      console.error("Cannot submit quiz: Missing questions array");
      setError(
        "Cannot submit: Quiz questions data is corrupted. Please refresh and try again."
      );
      return;
    }

    if (quiz.questions.length === 0) {
      console.warn("Submitting quiz with no questions");
      setError(
        "Cannot submit: This quiz has no questions. Please contact the quiz creator."
      );
      return;
    }

    try {
      setIsSubmitting(true);

      // Ensure user answers and questions are aligned
      console.log(`Quiz has ${quiz.questions.length} questions`);
      console.log(`User has submitted ${userAnswers.length} answers`);

      // Validate that we have answers for each question
      if (userAnswers.length !== quiz.questions.length) {
        console.warn(
          `Answer count mismatch: ${userAnswers.length} answers but ${quiz.questions.length} questions`
        );

        // Try to repair user answers if needed
        const repairedAnswers = quiz.questions.map((question) => {
          // Try to find existing answer for this question
          const existingAnswer = userAnswers.find(
            (a) => a.questionId === question.id
          );
          if (existingAnswer) {
            return existingAnswer;
          }

          // Create new answer if none exists
          return {
            questionId: question.id,
            selectedOptionIndex: null,
          };
        });

        console.log(
          `Repaired answers: now have ${repairedAnswers.length} answers`
        );
        setUserAnswers(repairedAnswers);
      }

      // Calculate local score with difficulty multiplier
      let correctAnswers = 0;
      let questionsWithAnswers = 0;

      // Use matching by ID to find correct answers
      userAnswers.forEach((answer) => {
        if (answer.selectedOptionIndex !== null) {
          questionsWithAnswers++;

          // Find matching question by ID
          const question = quiz.questions?.find(
            (q) => q.id === answer.questionId
          );

          if (
            question &&
            answer.selectedOptionIndex === question.correctIndex
          ) {
            correctAnswers++;
          }
        }
      });

      console.log(
        `Questions attempted: ${questionsWithAnswers}/${quiz.questions.length}`
      );

      // Get points multiplier for the selected difficulty if available
      const pointsMultiplier = getDifficultyMultiplier(
        quiz,
        selectedDifficulty
      );
      console.log(
        `Using ${selectedDifficulty} difficulty multiplier: ${pointsMultiplier}x`
      );

      // Calculate raw score - use max of questions length or answers length to avoid division by zero
      const denominator = Math.max(1, quiz.questions.length); // Prevent division by zero
      const rawScore = (correctAnswers / denominator) * 100;

      // Apply multiplier and ensure score doesn't exceed 100
      const calculatedScore = Math.min(
        100,
        Math.round(rawScore * pointsMultiplier)
      );

      console.log(
        `Raw score: ${correctAnswers}/${denominator} = ${rawScore}%, After multiplier: ${calculatedScore}%`
      );

      // Log each answer for debugging
      console.log("User answers for score calculation:");
      userAnswers.forEach((answer, index) => {
        const question = quiz.questions?.find(
          (q) => q.id === answer.questionId
        );
        console.log(
          `Q${index + 1} [${answer.questionId}]: Selected=${
            answer.selectedOptionIndex
          }, Correct=${question?.correctIndex}, IsMatch=${
            answer.selectedOptionIndex === question?.correctIndex ? "✓" : "✗"
          }`
        );
      });

      // Mark that we've calculated a score
      scoreCalculatedRef.current = true;
      // CRITICAL FIX: Store the score in the ref first to ensure it's available
      lastCalculatedScoreRef.current = calculatedScore;

      // We'll use multiple approaches to ensure the score gets set:
      // 1. Direct state update
      try {
        setScore(calculatedScore);
        console.log("Score set in state:", calculatedScore);
      } catch (err) {
        console.error("Error setting score in state:", err);
        // If there's any issue with setting the state, we still have the ref
        console.log("Score preserved in ref:", lastCalculatedScoreRef.current);
      }

      // 2. Backup state update with setTimeout to handle any race conditions
      setTimeout(() => {
        if (score === null || score === 0) {
          console.log("Backup score update triggered");
          try {
            setScore(lastCalculatedScoreRef.current);
          } catch (err) {
            console.error("Error in backup score update:", err);
          }
        }
      }, 0);

      // Debug: Log the score state and ref after setting to confirm values
      setTimeout(() => {
        console.log("Debug - Score state after setting:", score);
        console.log(
          "Debug - Score ref after setting:",
          lastCalculatedScoreRef.current
        );
        console.log(
          "Debug - Score calculated flag:",
          scoreCalculatedRef.current
        );
      }, 0);

      // Try to submit to Firebase
      try {
        console.log(
          `Submitting quiz ${quiz.id} with ${userAnswers.length} answers and ${quiz.questions.length} questions`
        );

        // Final validation of user answers
        const validatedAnswers = userAnswers.filter((answer) => {
          // Check if the answer has a valid questionId
          if (!answer.questionId) {
            console.warn("Found answer without questionId, filtering out");
            return false;
          }

          // Check if the answer corresponds to a valid question
          const hasMatchingQuestion = quiz.questions?.some(
            (q) => q.id === answer.questionId
          );
          if (!hasMatchingQuestion) {
            console.warn(
              `Answer with questionId ${answer.questionId} has no corresponding question, filtering out`
            );
          }

          return hasMatchingQuestion;
        });

        console.log(
          `After validation: submitting ${validatedAnswers.length} answers`
        );

        // Store the quiz questions directly in local storage as a backup
        try {
          localStorage.setItem(
            `quiz_questions_${quiz.id}`,
            JSON.stringify(quiz.questions)
          );
          console.log("Quiz questions saved to localStorage as backup");
        } catch (e) {
          console.warn("Failed to save questions to localStorage", e);
        }

        // CRITICAL FIX: Verify we have a score to display before submission
        if (score === null && lastCalculatedScoreRef.current !== null) {
          console.log(
            "Restoring score from ref before submission:",
            lastCalculatedScoreRef.current
          );
          setScore(lastCalculatedScoreRef.current);
        }

        const response = await submitQuizResponse(
          quiz.id,
          validatedAnswers.length > 0 ? validatedAnswers : userAnswers, // Use filtered answers if valid, otherwise try with original
          quizStartTime,
          tabSwitchCount,
          [], // No camera flags for now
          selectedDifficulty // Include the selected difficulty
        );

        if (response) {
          // Extract responseId and actual score from response
          const { responseId: backendResponseId, score: backendScore } =
            response;

          setResponseId(backendResponseId);
          console.log(
            `Quiz response submitted successfully with ID: ${backendResponseId} and score: ${backendScore}`
          );

          // FIXED: Trust the backend calculation instead of hardcoding 100%
          console.log(
            "Quiz submitted successfully - trusting backend score calculation"
          );

          // Update the score with the actual backend calculation
          lastCalculatedScoreRef.current = backendScore;
          scoreCalculatedRef.current = true;

          try {
            setScore(backendScore);
          } catch (err) {
            console.error("Error setting score from backend calculation:", err);
          }

          // Additional safety with a delayed update to handle React state batching issues
          setTimeout(() => {
            if (score === null || score === 0) {
              console.log(
                "Applying delayed score update from server calculation"
              );
              try {
                setScore(backendScore);
              } catch (err) {
                console.error("Error in delayed score update:", err);
              }
            }
          }, 50);
        } else {
          console.error("Failed to get response ID from submitQuizResponse");
          throw new Error("Failed to get response ID");
        }
      } catch (firebaseError) {
        console.error("Error submitting quiz to Firebase:", firebaseError);

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
          selectedDifficulty: selectedDifficulty,
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
          console.log("Quiz response saved locally with ID", localResponseId);
        } catch (e) {
          console.error("Error saving quiz response locally:", e);
        }
      }
      // Show error but still allow viewing results
      console.log(
        "DEBUG - Setting quizSubmitted to true after error, score:",
        score
      );
      setQuizSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Time formatting is now handled by the QuizTimer component

  // Render current question or results
  const renderQuizContent = () => {
    if (!quiz || !quiz.questions) return null;

    // If quiz is submitted, show results
    if (quizSubmitted) {
      // Debug: Log the current score value when rendering results
      console.log("DEBUG - Rendering quiz results with score:", score);
      console.log(
        "DEBUG - Calculated score from ref:",
        lastCalculatedScoreRef.current
      );

      // CRITICAL: Check for score = 0 but successful submission (indicates mismatch)
      if ((score === 0 || score === null) && responseId) {
        console.warn(
          "Score inconsistency detected - server successfully processed quiz but score is 0"
        );
        // Look for server logs that might indicate the real score
        console.log("Checking for server-side score calculation...");
      }

      // Calculate the correct answers count for display
      // Enhanced method to ensure proper counting with better logging
      let correctAnswersCount = 0;
      const answerDetails = userAnswers.map((answer) => {
        const question = quiz.questions?.find(
          (q) => q.id === answer.questionId
        );
        const isCorrect =
          question && answer.selectedOptionIndex === question.correctIndex;
        if (isCorrect) {
          correctAnswersCount++;
        }
        return {
          questionId: answer.questionId,
          selectedIndex: answer.selectedOptionIndex,
          correctIndex: question?.correctIndex,
          isCorrect: isCorrect,
        };
      });

      console.log(
        "Detailed answer check:",
        JSON.stringify(answerDetails, null, 2)
      );
      console.log(
        `Correct answer count calculated: ${correctAnswersCount} out of ${userAnswers.length}`
      );

      // Calculate the correct answer count based on the backend score
      if (responseId && lastCalculatedScoreRef.current !== null) {
        const calculatedCorrectCount = Math.round(
          (lastCalculatedScoreRef.current / 100) * quiz.questions.length
        );
        console.log(
          `Using backend score to calculate correct answers: ${calculatedCorrectCount} out of ${quiz.questions.length}`
        );
        correctAnswersCount = calculatedCorrectCount;
      }

      // CRITICAL FIX: Enhanced score calculation and display
      let displayScore = score;

      // Always log the current state for debugging
      console.log("Rendering results - score state:", score);
      console.log(
        "Rendering results - score ref:",
        lastCalculatedScoreRef.current
      );
      console.log(
        "Rendering results - score calculated flag:",
        scoreCalculatedRef.current
      );
      console.log("Rendering results - correct answers:", correctAnswersCount);
      console.log(
        "Rendering results - total questions:",
        quiz.questions?.length || 0
      );

      // Check if we should explicitly correct the score based on server calculation
      // Fix for when we have a responseId but the score isn't showing properly
      if (
        responseId &&
        (score === 0 || score === null) &&
        lastCalculatedScoreRef.current !== null
      ) {
        console.log(
          `FIXED: Score mismatch detected - using backend score: ${lastCalculatedScoreRef.current}%`
        );
        displayScore = lastCalculatedScoreRef.current;

        // Use both immediate and delayed score setting to overcome React state update issues
        setScore(lastCalculatedScoreRef.current);

        // Recalculate correct answers based on the score percentage
        const calculatedCorrectCount = Math.round(
          (lastCalculatedScoreRef.current / 100) * quiz.questions.length
        );
        correctAnswersCount = calculatedCorrectCount;

        // Extra insurance with timeout for delayed state update
        setTimeout(() => {
          if (score === 0 || score === null) {
            console.log(
              `Applying delayed score update from server calculation: ${lastCalculatedScoreRef.current}%`
            );
            setScore(lastCalculatedScoreRef.current);
          }
        }, 100);
      }

      // Comprehensive approach to ensure we display the correct score
      if (score === null || score === 0) {
        // First try: Use the ref value if available
        if (lastCalculatedScoreRef.current !== null) {
          displayScore = lastCalculatedScoreRef.current;
          console.log("Using score from ref:", displayScore);
        }
        // Second try: Check if we flagged a score calculation
        else if (
          scoreCalculatedRef.current &&
          quiz.questions &&
          quiz.questions.length > 0
        ) {
          console.log(
            "Recalculating score due to scoreCalculated flag being true"
          );
          const pointsMultiplier = getDifficultyMultiplier(
            quiz,
            selectedDifficulty
          );
          const denominator = Math.max(1, quiz.questions.length);
          const recalculatedScore = Math.min(
            100,
            Math.round(
              (correctAnswersCount / denominator) * 100 * pointsMultiplier
            )
          );
          console.log("Recalculated score:", recalculatedScore);

          // Update both state and ref
          displayScore = recalculatedScore;
          lastCalculatedScoreRef.current = recalculatedScore;

          // Update the state if possible
          try {
            setScore(recalculatedScore);
          } catch (err) {
            console.error("Error setting recalculated score:", err);
          }
        }
        // Third try: Recalculate if we have enough data
        else if (quiz.questions && quiz.questions.length > 0) {
          console.log("Forced recalculation of score");
          const pointsMultiplier = getDifficultyMultiplier(
            quiz,
            selectedDifficulty
          );
          const denominator = Math.max(1, quiz.questions.length);
          const recalculatedScore = Math.min(
            100,
            Math.round(
              (correctAnswersCount / denominator) * 100 * pointsMultiplier
            )
          );
          console.log("Forced recalculated score:", recalculatedScore);

          // Update both state and ref
          displayScore = recalculatedScore;
          lastCalculatedScoreRef.current = recalculatedScore;
          scoreCalculatedRef.current = true;

          // Update the state if possible
          try {
            setScore(recalculatedScore);
          } catch (err) {
            console.error("Error setting forced recalculated score:", err);
          }
        } else {
          console.warn("Unable to calculate score, all attempts failed");
          displayScore = 0;
        }
      }

      return (
        <div className="bg-white p-8 rounded-xl shadow-md max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6">
            Quiz Completed!
          </h2>

          <div className="text-center mb-8">
            {/* Use the FixedScoreDisplay component for consistent score display */}
            <FixedScoreDisplay
              displayScore={displayScore}
              lastCalculatedScoreRef={lastCalculatedScoreRef}
            />

            {/* Use the CorrectAnswersDisplay component for consistent answer count display */}
            <CorrectAnswersDisplay
              correctAnswersCount={correctAnswersCount}
              totalQuestions={quiz.questions.length}
            />

            <div className="mt-3 inline-block px-3 py-1 bg-gray-100 rounded-full text-sm font-medium capitalize">
              Difficulty: {selectedDifficulty}
              {quiz.difficultySettings &&
                quiz.difficultySettings[
                  selectedDifficulty as keyof typeof quiz.difficultySettings
                ]?.pointsMultiplier &&
                quiz.difficultySettings[
                  selectedDifficulty as keyof typeof quiz.difficultySettings
                ]!.pointsMultiplier !== 1 && (
                  <span className="ml-1 text-indigo-700">
                    (
                    {
                      quiz.difficultySettings[
                        selectedDifficulty as keyof typeof quiz.difficultySettings
                      ]!.pointsMultiplier
                    }
                    x points)
                  </span>
                )}
            </div>

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
                // Store previous score in ref before resetting
                if (score !== null) {
                  lastCalculatedScoreRef.current = score;
                }

                // Reset the score calculated flag
                scoreCalculatedRef.current = false;

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
          <div className="flex flex-col items-end">
            {quizStarted && quiz && !quizSubmitted && (
              <>
                <QuizTimer
                  // We're using a fixed duration prop to avoid re-render issues
                  // The actual duration is controlled by timeRemaining state
                  // which is set when difficulty changes
                  duration={30}
                  onTimeUp={handleSubmitQuiz}
                  paused={isSubmitting || quizSubmitted}
                  timeRemaining={timeRemaining}
                  setTimeRemaining={setTimeRemaining}
                />
                
                {difficultyChangeNotice && (
                  <div className="mt-2 text-xs animate-pulse text-indigo-600 font-medium">
                    {difficultyChangeNotice}
                  </div>
                )}
                
                {/* Simplified debug duration display */}
                {quiz && (
                  <div className="mt-1 text-xs text-gray-500">
                    Current {selectedDifficulty} difficulty selected
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <h3 className="text-xl font-semibold mb-4">{currentQuestion.text}</h3>

        {/* Debug info - will be hidden in production */}
        <div className="bg-yellow-50 p-2 mb-4 text-xs rounded-md">
          <p>Debug - Current question ID: {currentQuestion.id}</p>
          <p>Debug - Correct index: {currentQuestion.correctIndex}</p>
        </div>

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

                {/* Debug info - shows internal option index */}
                <span className="ml-2 text-xs text-gray-400">
                  (Index: {optionIndex})
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

        {difficultyChangeNotice && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
            <p className="text-sm text-yellow-600">{difficultyChangeNotice}</p>
          </div>
        )}
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
              <p className="text-xl">
                {/* Use difficulty-specific duration if available */}
                {(() => {
                  // Calculate duration here to keep it isolated
                  return quiz.difficultySettings?.[selectedDifficulty as keyof typeof quiz.difficultySettings]?.duration || 
                    (selectedDifficulty === "easy" ? 45 : 
                     selectedDifficulty === "medium" ? 30 : 
                     selectedDifficulty === "hard" ? 20 : 30);
                })()}{" "}
                minutes
              </p>
              {quiz.difficultySettings?.[selectedDifficulty as keyof typeof quiz.difficultySettings]?.pointsMultiplier && 
                quiz.difficultySettings[selectedDifficulty as keyof typeof quiz.difficultySettings]!.pointsMultiplier !== 1 && (
                  <p className="text-sm mt-1 text-indigo-700 font-medium">
                    {quiz.difficultySettings[selectedDifficulty as keyof typeof quiz.difficultySettings]!.pointsMultiplier}
                    x points multiplier
                  </p>
                )}
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

          {/* Difficulty selection */}
          {availableDifficulties.length > 1 && (
            <div className="bg-gray-50 p-4 rounded-lg mb-8">
              <DifficultySelect
                availableDifficulties={availableDifficulties}
                selectedDifficulty={selectedDifficulty}
                onSelectDifficulty={handleDifficultySelect}
                difficultySettings={quiz?.difficultySettings}
                baseDuration={quiz?.duration || 30} // Pass the quiz's base duration or fallback to 30
              />
              {isLoadingQuestions && (
                <div className="flex items-center justify-center mt-2">
                  <div className="animate-spin h-5 w-5 border-2 border-indigo-600 rounded-full border-t-transparent"></div>
                  <span className="ml-2 text-gray-600 text-sm">
                    Loading questions...
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="bg-gray-50 p-4 rounded-lg mb-8">
            <h3 className="font-medium mb-2">Before You Begin:</h3>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>Ensure you have a stable internet connection</li>
              <li>
                You will have{" "}
                {(() => {
                  // Use difficulty-specific duration, fall back to base duration, then 30 min as last resort
                  const duration = quiz?.difficultySettings?.[selectedDifficulty as keyof typeof quiz.difficultySettings]?.duration ||
                    quiz.duration || 30;
                  return duration;
                })()}{" "}
                minutes to complete the quiz
              </li>
              <li>Quiz has {quiz.questions?.length || 0} questions to answer</li>
              <li>
                Selected difficulty:{" "}
                <span className="font-medium capitalize">
                  {selectedDifficulty}
                </span>
                {quiz.difficultySettings &&
                  quiz.difficultySettings[
                    selectedDifficulty as keyof typeof quiz.difficultySettings
                  ]?.pointsMultiplier &&
                  quiz.difficultySettings[
                    selectedDifficulty as keyof typeof quiz.difficultySettings
                  ]!.pointsMultiplier !== 1 && (
                    <span className="ml-1 text-indigo-700">
                      (
                      {
                        quiz.difficultySettings[
                          selectedDifficulty as keyof typeof quiz.difficultySettings
                        ]!.pointsMultiplier
                      }
                      x points)
                    </span>
                  )}
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
