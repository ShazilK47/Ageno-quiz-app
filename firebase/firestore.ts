// firebase/firestore.ts
import { db, auth } from "./client";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where,
  DocumentData,
  QueryDocumentSnapshot,
  DocumentSnapshot,
  Timestamp,
  addDoc,
  orderBy,
  // limit,
  //   collectionGroup,
} from "firebase/firestore";

// Quiz type definition based on the provided schema
export interface Quiz {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  createdAt: Date;
  updatedAt?: Date;
  duration: number; // in minutes (default duration for backward compatibility)
  isAutoCheck: boolean;
  accessCode: string;
  requiresAccessCode?: boolean; // Flag to indicate if access code is required
  questions?: QuizQuestion[];
  difficulty?: "easy" | "medium" | "hard"; // Main difficulty level for the quiz
  // New fields for advanced difficulty levels
  availableDifficulties?: string[]; // ["easy", "medium", "hard"]
  // Settings for each difficulty level
  difficultySettings?: {
    easy?: {
      duration: number;
      pointsMultiplier: number;
    };
    medium?: {
      duration: number;
      pointsMultiplier: number;
    };
    hard?: {
      duration: number;
      pointsMultiplier: number;
    };
  };
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: QuizOption[];
  points: number;
  type?: "single" | "multiple" | "truefalse" | string;
  correctIndex?: number; // Added for backward compatibility
  imageUrl?: string; // Added to support image questions
}

export interface QuizOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

// Quiz submission interface
export interface QuizSubmission {
  id: string;
  quizId: string;
  userId: string;
  answers: Record<string, string[]>; // questionId -> selected option ids
  startedAt: Date;
  completedAt: Date;
  createdAt: Date;
  score: number | null;
  maxScore?: number;
  percentage?: number;
  gradedAt?: Date | null;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle?: string;
  quizDescription?: string;
  startedAt: Date;
  submittedAt: Date;
  score: number | null;
  tabSwitchCount: number;
  cameraFlags: string[];
  selectedDifficulty?: string; // "easy", "medium", or "hard"
  answers?: {
    questionId: string;
    selectedIndex: number;
    isCorrect: boolean | null;
  }[];
}

/**
 * Convert Firestore document to Quiz object
 */
export const quizConverter = {
  fromFirestore(snapshot: QueryDocumentSnapshot | DocumentSnapshot): Quiz {
    const data = snapshot.data() as DocumentData;
    return {
      id: snapshot.id,
      title: data.title || "",
      description: data.description || "",
      createdBy: data.createdBy || "",
      createdAt:
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : new Date(),
      duration: data.duration || 0,
      isAutoCheck: data.isAutoCheck || false,
      accessCode: data.accessCode || "",
      requiresAccessCode:
        data.requiresAccessCode !== undefined ? data.requiresAccessCode : true, // Default to true for backwards compatibility
      availableDifficulties: data.availableDifficulties || [
        "easy",
        "medium",
        "hard",
      ], // Default to all difficulties
    };
  },
};

/**
 * Convert Firestore document to QuizAttempt object
 */
export const quizAttemptConverter = {
  fromFirestore(
    snapshot: QueryDocumentSnapshot | DocumentSnapshot
  ): QuizAttempt {
    const data = snapshot.data() as DocumentData;
    return {
      id: snapshot.id,
      quizId: data.quizId || "",
      startedAt:
        data.startedAt instanceof Timestamp
          ? data.startedAt.toDate()
          : new Date(),
      submittedAt:
        data.submittedAt instanceof Timestamp
          ? data.submittedAt.toDate()
          : new Date(),
      score: data.score,
      tabSwitchCount: data.tabSwitchCount || 0,
      cameraFlags: data.cameraFlags || [],
      selectedDifficulty: data.selectedDifficulty || "medium", // Default to medium
    };
  },
};

/**
 * Check if the user is authenticated
 * This is a utility function to log authentication state for debugging
 */
function logAuthState() {
  const user = auth.currentUser;
  if (user) {
    console.log("User is authenticated:", user.uid);
  } else {
    console.log("User is not authenticated");
  }
}

/**
 * Fetch all active quizzes
 */
export async function getActiveQuizzes(): Promise<Quiz[]> {
  try {
    // Log authentication state for debugging
    logAuthState();

    const quizzesRef = collection(db, "quizzes");
    const querySnapshot = await getDocs(quizzesRef);

    return querySnapshot.docs.map((doc) => quizConverter.fromFirestore(doc));
  } catch (error) {
    console.error("Error fetching quizzes:", error);
    // Check if it's a permission error
    if (error instanceof Error && error.toString().includes("permission")) {
      console.error(
        "Permission denied. Please check Firestore rules or authentication state."
      );
    }
    return [];
  }
}

/**
 * Fetch a single quiz by ID
 */
export async function getQuizById(quizId: string): Promise<Quiz | null> {
  try {
    // Log authentication state for debugging
    logAuthState();

    const quizRef = doc(db, "quizzes", quizId);
    const quizSnapshot = await getDoc(quizRef);

    if (!quizSnapshot.exists()) {
      return null;
    }

    const quiz = quizConverter.fromFirestore(quizSnapshot);

    // Fetch questions subcollection
    const questionsRef = collection(db, "quizzes", quizId, "questions");
    const questionsSnapshot = await getDocs(questionsRef);

    // Check if there are available difficulties configured for this quiz
    const availableDifficulties = quiz.availableDifficulties || [
      "easy",
      "medium",
      "hard",
    ];
    console.log(
      `Quiz has ${
        availableDifficulties.length
      } difficulty levels: ${availableDifficulties.join(", ")}`
    );

    // Store information about available difficulty-specific question collections
    const difficultyInfo: Record<string, boolean> = {};

    // Check which difficulty levels have questions available
    for (const difficulty of availableDifficulties) {
      try {
        const difficultyQuestionsRef = collection(
          db,
          `quizzes/${quizId}/questions_${difficulty}`
        );
        const diffSnapshot = await getDocs(difficultyQuestionsRef);
        difficultyInfo[difficulty] = !diffSnapshot.empty;
        console.log(
          `${difficulty} difficulty has ${diffSnapshot.size} questions available`
        );
      } catch (error) {
        console.error(`Error checking ${difficulty} questions:`, error);
        difficultyInfo[difficulty] = false;
      }
    }

    console.log("Difficulty availability:", difficultyInfo);

    quiz.questions = questionsSnapshot.docs.map((doc) => {
      const data = doc.data();

      // Process options - handle both array format and numeric properties
      let options = data.options || [];

      // If options array is empty, try to find numbered properties (0, 1, 2, etc.)
      if (options.length === 0) {
        const numericKeys = Object.keys(data)
          .filter((key) => !isNaN(Number(key)))
          .sort((a, b) => Number(a) - Number(b));

        if (numericKeys.length > 0) {
          options = numericKeys.map((key) => data[key]);
          console.log(
            `Found ${options.length} options from numbered properties for question ${doc.id}`
          );
        }
      }
      return {
        id: doc.id,
        text: data.text || "",
        options: options,
        correctIndex: data.correctIndex || 0,
        type: data.type || "mcq",
        points: data.points || 1, // Default to 1 point if not specified
      };
    });

    return quiz;
  } catch (error) {
    console.error(`Error fetching quiz with ID ${quizId}:`, error);
    // Check if it's a permission error
    if (error instanceof Error && error.toString().includes("permission")) {
      console.error(
        "Permission denied. Please check Firestore rules or authentication state."
      );
    }
    return null;
  }
}

/**
 * Fetch a quiz by access code
 */
export async function getQuizByCode(code: string): Promise<Quiz | null> {
  try {
    // Log authentication state for debugging
    logAuthState();

    const quizzesRef = collection(db, "quizzes");
    const q = query(quizzesRef, where("accessCode", "==", code));

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const quizDoc = querySnapshot.docs[0];
    const quiz = quizConverter.fromFirestore(quizDoc);

    // Don't allow joining if quiz requires access code but doesn't match
    if (quiz.requiresAccessCode === true) {
      if (!code || code.trim() !== quiz.accessCode.trim()) {
        return null;
      }
    }

    // Fetch questions subcollection
    const questionsRef = collection(db, "quizzes", quizDoc.id, "questions");
    const questionsSnapshot = await getDocs(questionsRef);

    quiz.questions = questionsSnapshot.docs.map((doc) => {
      const data = doc.data();

      // Process options - handle both array format and numeric properties
      let options = data.options || [];

      // If options array is empty, try to find numbered properties (0, 1, 2, etc.)
      if (options.length === 0) {
        const numericKeys = Object.keys(data)
          .filter((key) => !isNaN(Number(key)))
          .sort((a, b) => Number(a) - Number(b));

        if (numericKeys.length > 0) {
          options = numericKeys.map((key) => data[key]);
          console.log(
            `Found ${options.length} options from numbered properties for question ${doc.id}`
          );
        }
      }
      return {
        id: doc.id,
        text: data.text || "",
        options: options,
        correctIndex: data.correctIndex || 0,
        type: data.type || "mcq",
        points: data.points || 1, // Default to 1 point if not specified
      };
    });

    return quiz;
  } catch (error) {
    console.error(`Error fetching quiz with code ${code}:`, error);
    // Check if it's a permission error
    if (error instanceof Error && error.toString().includes("permission")) {
      console.error(
        "Permission denied. Please check Firestore rules or authentication state."
      );
    }
    return null;
  }
}

/**
 * Submit quiz responses to Firestore
 */
export async function submitQuizResponse(
  quizId: string,
  userAnswers: { questionId: string; selectedOptionIndex: number | null }[],
  startTime: Date,
  tabSwitches: number = 0,
  cameraFlags: string[] = [],
  selectedDifficulty: string = "medium"
): Promise<{ responseId: string; score: number | null } | null> {
  try {
    // Validate user answers to ensure we have something to work with
    if (
      !userAnswers ||
      !Array.isArray(userAnswers) ||
      userAnswers.length === 0
    ) {
      console.error("Cannot submit response: No user answers provided");
      return null;
    }

    // Log authentication state and submission details for debugging
    logAuthState();
    console.log("Quiz submission - Selected difficulty:", selectedDifficulty);
    console.log("Quiz submission - Start time:", startTime);
    console.log("Quiz submission - Tab switches:", tabSwitches);
    console.log("Quiz submission - User answers count:", userAnswers.length);

    // Get current user ID, or use "anonymous" if not logged in
    const userId = auth.currentUser?.uid || "anonymous";
    console.log("Quiz submission - User ID:", userId);

    // Get quiz data to calculate score
    const quiz = await getQuizById(quizId);
    if (!quiz) {
      console.error("Cannot submit response: Quiz not found");
      return null;
    }

    // If quiz has no questions but we have a selected difficulty, try to load difficulty-specific questions
    if (
      (!quiz.questions || quiz.questions.length === 0) &&
      selectedDifficulty
    ) {
      console.log(
        `Attempting to load ${selectedDifficulty} difficulty questions for quiz submission`
      );
      try {
        const difficultyQuestions = await getQuestionsByDifficulty(
          quizId,
          selectedDifficulty
        );

        if (difficultyQuestions && difficultyQuestions.length > 0) {
          console.log(
            `Successfully loaded ${difficultyQuestions.length} questions for ${selectedDifficulty} difficulty`
          );
          quiz.questions = difficultyQuestions;
        }
      } catch (error) {
        console.error(`Failed to load difficulty questions: ${error}`);
      }
    }

    // Log the quiz data for debugging
    console.log("Quiz ID:", quizId);
    console.log("Quiz retrieved:", quiz.title);

    // Check if we have questions in the quiz
    if (
      !quiz.questions ||
      !Array.isArray(quiz.questions) ||
      quiz.questions.length === 0
    ) {
      console.error(
        "Cannot submit response: Quiz has no valid questions array. " +
          "This could be due to difficulty-specific questions not being properly loaded."
      );

      // Try to recover the questions from user answers if possible
      if (userAnswers && userAnswers.length > 0) {
        console.log(
          "Attempting to reconstruct question structure from user answers"
        );
        const reconstructedQuestions = userAnswers.map((answer, index) => ({
          id: answer.questionId,
          text: `Question ${index + 1}`,
          options: [],
          points: 1,
          correctIndex: answer.selectedOptionIndex ?? undefined, // Convert null to undefined
          type: "single",
        }));

        if (reconstructedQuestions.length > 0) {
          console.log("Successfully reconstructed questions from user answers");
          quiz.questions = reconstructedQuestions;
        } else {
          return null;
        }
      } else {
        return null;
      }
    }

    console.log(
      "Quiz submission - Total questions:",
      quiz.questions?.length || 0
    );

    // Calculate score if auto-check is enabled
    let score = null;
    if (quiz.isAutoCheck) {
      let correctCount = 0;
      let answeredCount = 0;

      console.log(
        "Checking answers - all user answers:",
        JSON.stringify(userAnswers)
      );
      console.log("Quiz questions:", JSON.stringify(quiz.questions)); // First, let's check if we have valid question IDs in the user answers
      // Sanitize quiz.questions to ensure it's an array
      if (!quiz.questions) {
        quiz.questions = [];
        console.error("Missing questions array, using empty array");
      }

      const validQuestionIds = new Set(quiz.questions.map((q) => q.id));
      console.log(
        `Valid question IDs in quiz: [${Array.from(validQuestionIds).join(
          ", "
        )}]`
      );

      // Check if questions and user answers have matching IDs
      const userAnswerIds = new Set(userAnswers.map((a) => a.questionId));

      console.log(`User answer IDs: [${Array.from(userAnswerIds).join(", ")}]`);

      // Check for mismatch
      if (validQuestionIds.size === 0 && userAnswerIds.size > 0) {
        console.warn(
          "Quiz questions don't have IDs that match user answers. Attempting repair..."
        );

        // Try to repair the questions array by mapping it to the user answers
        if (quiz.questions.length === userAnswers.length) {
          // If lengths match, we can map them directly
          quiz.questions = quiz.questions.map((q, i) => ({
            ...q,
            id: userAnswers[i].questionId,
          }));
          console.log("Repaired question IDs by mapping to user answers");
        }
      }

      userAnswers.forEach((answer, index) => {
        // Check if the answer has a valid questionId and selectedOptionIndex
        const isValidQuestionId = validQuestionIds.has(answer.questionId);

        if (!isValidQuestionId) {
          console.warn(
            `Answer ${index} has invalid questionId: ${answer.questionId}`
          );
        }

        if (answer.selectedOptionIndex !== null) {
          answeredCount++;

          // Find matching question to check if answer is correct
          const question = quiz.questions?.find(
            (q) => q.id === answer.questionId
          );

          console.log(
            `Answer ${index}: questionId=${answer.questionId}, selectedIndex=${answer.selectedOptionIndex}, ` +
              `questionFound=${!!question}, correctIndex=${
                question?.correctIndex
              }`
          );

          if (
            question &&
            answer.selectedOptionIndex === question.correctIndex
          ) {
            correctCount++;
            console.log(`✅ CORRECT answer for question ${index}`);
          } else {
            console.log(`❌ WRONG answer for question ${index}`);
          }
        }
      });

      // Get points multiplier for the selected difficulty
      let pointsMultiplier = 1.0; // Default multiplier

      try {
        // Default multipliers by difficulty level if settings are missing
        const defaultMultipliers: Record<string, number> = {
          easy: 1.0,
          medium: 1.5,
          hard: 2.0,
        };

        if (quiz.difficultySettings && selectedDifficulty) {
          // Safely access difficulty settings with type checking
          const difficultyKey =
            selectedDifficulty as keyof typeof quiz.difficultySettings;
          const difficultySettings = quiz.difficultySettings[difficultyKey];

          if (
            difficultySettings &&
            typeof difficultySettings.pointsMultiplier === "number"
          ) {
            pointsMultiplier = difficultySettings.pointsMultiplier;
          } else if (defaultMultipliers[selectedDifficulty]) {
            // Use standard defaults if not defined in quiz settings
            console.log(
              `Using default multiplier for ${selectedDifficulty} difficulty`
            );
            pointsMultiplier = defaultMultipliers[selectedDifficulty];
          }
        }

        // Ensure multiplier is a valid number and at least 1.0
        if (isNaN(pointsMultiplier) || pointsMultiplier < 1.0) {
          console.warn(
            `Invalid points multiplier (${pointsMultiplier}), using default 1.0`
          );
          pointsMultiplier = 1.0;
        }

        console.log(
          `Using ${selectedDifficulty} difficulty multiplier: ${pointsMultiplier}x`
        );
      } catch (error) {
        console.error("Error getting difficulty multiplier:", error);
        pointsMultiplier = 1.0; // Fallback to default on any error
      }

      // Calculate percentage score with multiplier
      if (
        quiz.questions &&
        Array.isArray(quiz.questions) &&
        quiz.questions.length > 0
      ) {
        // Only calculate if we have valid questions
        const questionsCount = quiz.questions.length;

        // Make sure answered and correct counts are valid
        if (typeof correctCount !== "number" || isNaN(correctCount)) {
          console.error("Invalid correctCount:", correctCount);
          correctCount = 0;
        }

        if (typeof answeredCount !== "number" || isNaN(answeredCount)) {
          console.error("Invalid answeredCount:", answeredCount);
          answeredCount = 0;
        }

        // Calculate raw score with safety checks
        let rawScore = 0;

        // Check if any questions were answered
        if (answeredCount === 0) {
          console.warn("No questions were answered by the user");
          rawScore = 0; // If no questions were answered, score is 0
        } else if (questionsCount > 0) {
          // IMPORTANT: We always use questionsCount (total questions) as the denominator
          // This matches the client-side calculation in page.tsx
          const denominator = questionsCount;

          // Log warning if there's a discrepancy between answered and total
          if (answeredCount < questionsCount) {
            console.warn(
              `User only answered ${answeredCount} out of ${questionsCount} questions`
            );
          }

          // Calculate based on total questions (NOT answered questions)
          // This ensures consistency with the client-side calculation
          rawScore = (correctCount / denominator) * 100;

          console.log(
            `Using denominator: ${denominator} (answered: ${answeredCount}, total: ${questionsCount})`
          );

          // Double check for NaN
          if (isNaN(rawScore)) {
            console.error(
              "Score calculation resulted in NaN! correctCount:",
              correctCount,
              "denominator:",
              denominator
            );
            rawScore = 0; // Default to 0 if we get NaN
          }
        } else {
          console.error("Cannot calculate score: No questions in quiz");
        }

        console.log(
          `Raw calculation: ${correctCount} correct / ${answeredCount} answered (of ${questionsCount} total) * 100 = ${rawScore}`
        );

        // Ensure we have valid numbers before calculation
        if (
          !isNaN(rawScore) &&
          typeof rawScore === "number" &&
          isFinite(rawScore) &&
          !isNaN(pointsMultiplier) &&
          isFinite(pointsMultiplier)
        ) {
          try {
            // Apply multiplier and ensure score doesn't exceed 100
            const calculatedScore = Math.min(
              100,
              Math.round(rawScore * pointsMultiplier)
            );

            // Final sanity check before setting the score
            if (isNaN(calculatedScore) || !isFinite(calculatedScore)) {
              console.error("Final score calculation invalid:", {
                rawScore,
                pointsMultiplier,
                calculatedScore,
              });
              score = 0;
            } else {
              score = calculatedScore;
              console.log(
                `Final score after multiplier (${pointsMultiplier}x): ${score}`
              );
            }
          } catch (calcError) {
            console.error("Error in final score calculation:", calcError);
            score = 0; // Fallback on any calculation error
          }
        } else {
          console.error("Invalid score inputs:", {
            rawScore,
            pointsMultiplier,
          });
          score = 0; // Fallback to 0 if we get NaN or Infinity
        }
      } else {
        console.log(
          `No valid questions array found in quiz: questionsLength=${
            quiz.questions?.length || 0
          }`
        );
        score = 0; // Set score to 0 if no questions were found
      }

      // Log summary of answers
      console.log(`Score calculation summary:
        - Total questions in quiz: ${quiz.questions.length}
        - Questions answered by user: ${answeredCount}
        - Correct answers: ${correctCount}
        - Final score: ${score}
      `);
    }

    // Create response document
    const responsesRef = collection(db, "responses");

    // Final validation for the score before storing
    let finalScore = score;
    if (score !== null) {
      if (isNaN(score) || !isFinite(score)) {
        console.error("Score is still invalid before storing:", score);
        finalScore = 0;
      } else {
        // Ensure score is a number, not a string
        finalScore = Number(score);
      }
    }

    const responseData = {
      quizId,
      userId,
      startedAt: Timestamp.fromDate(startTime),
      submittedAt: Timestamp.fromDate(new Date()),
      score: finalScore, // Will be null if auto-check is disabled
      tabSwitchCount: tabSwitches,
      cameraFlags,
      selectedDifficulty, // Store the difficulty level
    };

    // Add the response document and get its ID
    const responseDoc = await addDoc(responsesRef, responseData);

    // Add individual answers as a subcollection
    for (const answer of userAnswers) {
      if (answer.selectedOptionIndex !== null) {
        const answerRef = collection(
          db,
          "responses",
          responseDoc.id,
          "answers"
        );

        let isCorrect = null;
        if (quiz.isAutoCheck) {
          // Find the question and check if the answer is correct
          const question = quiz.questions.find(
            (q) => q.id === answer.questionId
          );
          isCorrect = question
            ? answer.selectedOptionIndex === question.correctIndex
            : false;
        }

        await addDoc(answerRef, {
          questionId: answer.questionId,
          selectedIndex: answer.selectedOptionIndex,
          isCorrect,
        });
      }
    }

    console.log(
      `Quiz response submitted: ${responseDoc.id} with score ${finalScore}`
    );
    return {
      responseId: responseDoc.id,
      score: finalScore,
    };
  } catch (error) {
    console.error("Error submitting quiz response:", error);
    // Check if it's a permission error
    if (error instanceof Error && error.toString().includes("permission")) {
      console.error(
        "Permission denied. Please check Firestore rules or authentication state."
      );
    }
    return null;
  }
}

/**
 * Fetch user's quiz attempts
 */
export async function getUserQuizAttempts(): Promise<QuizAttempt[]> {
  try {
    // Log authentication state for debugging
    logAuthState();

    // Get current user ID
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.error("Cannot fetch attempts: No authenticated user");
      return [];
    }

    console.log("Fetching quiz attempts for user ID:", userId);

    // CRITICAL DEBUGGING: Print out a list of all responses regardless of userId
    // to see if there are any responses at all
    try {
      const allResponsesRef = collection(db, "responses");
      const allResponses = await getDocs(allResponsesRef);
      console.log("DEBUG: Total responses in database:", allResponses.size);
      console.log(
        "DEBUG: First few responses:",
        allResponses.docs.slice(0, 3).map((doc) => ({
          id: doc.id,
          userId: doc.data().userId,
          data: doc.data(),
        }))
      );
    } catch (err) {
      console.error("Error in debug query:", err);
    }

    // Query responses collection for user's attempts
    const responsesRef = collection(db, "responses");
    const q = query(
      responsesRef,
      where("userId", "==", userId),
      orderBy("submittedAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    console.log("Query snapshot size:", querySnapshot.size);

    if (querySnapshot.size === 0) {
      console.log(
        "No attempts found for user. Checking if responses exist with different user ID format"
      );

      // Try a more permissive query to see if the userId might be stored differently
      // For example, some systems might store UIDs as strings vs objects or with different casing
      const looseQuery = query(responsesRef, orderBy("submittedAt", "desc"));

      const looseResults = await getDocs(looseQuery);
      console.log("All responses:", looseResults.size);
      console.log(
        "All user IDs in responses:",
        looseResults.docs.map((doc) => ({
          userId: doc.data().userId,
          typeOfUserId: typeof doc.data().userId,
        }))
      );
    } else {
      console.log(
        "Raw query results:",
        querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    }

    // Convert snapshots to QuizAttempt objects
    const attempts: QuizAttempt[] = [];

    for (const docSnapshot of querySnapshot.docs) {
      try {
        const docData = docSnapshot.data();
        console.log(`Processing document ${docSnapshot.id}:`, docData);

        const attempt = quizAttemptConverter.fromFirestore(docSnapshot);

        // Get the associated quiz details
        if (attempt.quizId) {
          console.log(`Fetching quiz details for quizId: ${attempt.quizId}`);
          const quiz = await getQuizById(attempt.quizId);
          if (quiz) {
            attempt.quizTitle = quiz.title;
            attempt.quizDescription = quiz.description;
            console.log(`Found quiz: ${quiz.title}`);
          } else {
            console.log(`Quiz not found for ID: ${attempt.quizId}`);
            attempt.quizTitle = "Unknown Quiz"; // Fallback title
          }
        } else {
          console.log(`No quizId found for attempt ${docSnapshot.id}`);
          attempt.quizTitle = "Unknown Quiz"; // Fallback title
        }

        // Get the answers subcollection
        try {
          const answersRef = collection(
            db,
            "responses",
            docSnapshot.id,
            "answers"
          );
          const answersSnapshot = await getDocs(answersRef);
          console.log(
            `Found ${answersSnapshot.size} answers for attempt ${docSnapshot.id}`
          );

          attempt.answers = answersSnapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              questionId: data.questionId || "",
              selectedIndex: data.selectedIndex || 0,
              isCorrect: data.isCorrect,
            };
          });
        } catch (err) {
          console.error(
            `Error fetching answers for attempt ${docSnapshot.id}:`,
            err
          );
          attempt.answers = []; // Provide empty answers array as fallback
        }

        attempts.push(attempt);
        console.log(`Successfully added attempt ${docSnapshot.id} to results`);
      } catch (err) {
        console.error(`Error processing attempt ${docSnapshot.id}:`, err);
        // Continue to the next attempt instead of failing the whole function
      }
    }

    console.log(`Returning ${attempts.length} attempts`);
    return attempts;
  } catch (error) {
    console.error("Error fetching user quiz attempts:", error);
    // Check if it's a permission error
    if (error instanceof Error && error.toString().includes("permission")) {
      console.error(
        "Permission denied. Please check Firestore rules or authentication state."
      );
    }
    return [];
  }
}

/**
 * Fetch questions for a specific quiz and difficulty level
 */
export async function getQuestionsByDifficulty(
  quizId: string,
  difficulty: string
): Promise<QuizQuestion[]> {
  try {
    // Log authentication state for debugging
    logAuthState();
    console.log(
      `Fetching ${difficulty} difficulty questions for quiz ${quizId}`
    );

    // We could use a server-side cache here in a more complete solution
    // but for now we'll focus on fetching from Firestore directly

    // Get questions from the difficulty-specific subcollection
    const questionsRef = collection(
      db,
      `quizzes/${quizId}/questions_${difficulty}`
    );
    const questionsSnapshot = await getDocs(questionsRef);

    if (questionsSnapshot.empty) {
      console.log(
        `No ${difficulty} questions found for quiz ${quizId}, trying fallback to main questions`
      );

      // If no difficulty-specific questions found, try to get the main questions collection
      const mainQuestionsRef = collection(db, `quizzes/${quizId}/questions`);
      const mainQuestionsSnapshot = await getDocs(mainQuestionsRef);

      if (mainQuestionsSnapshot.empty) {
        console.warn(
          `No questions found for quiz ${quizId} (neither ${difficulty} nor main)`
        );

        // Since we're not using localStorage in this server-side function,
        // we'll just log a warning that no questions were found
        console.warn("No questions found for this quiz in any collection");

        return [];
      }

      // Use main questions as fallback
      const fallbackQuestions: QuizQuestion[] = [];
      mainQuestionsSnapshot.forEach((doc) => {
        const questionData = doc.data();
        const question: QuizQuestion = {
          id: doc.id,
          text: questionData.text || "",
          options: questionData.options || [],
          points: questionData.points || 1,
          type: questionData.type || "single",
          correctIndex: questionData.correctIndex,
          imageUrl: questionData.imageUrl,
        };
        fallbackQuestions.push(question);
      });

      console.log(
        `Found ${fallbackQuestions.length} questions in the main collection as fallback`
      );
      return fallbackQuestions;
    }

    // Process questions for the requested difficulty
    const questions: QuizQuestion[] = [];
    questionsSnapshot.forEach((doc) => {
      try {
        const questionData = doc.data();

        // Validate minimum required fields
        if (!questionData.text) {
          console.warn(
            `Question ${doc.id} is missing text, using empty string`
          );
        }

        // Handle different options format
        let options = questionData.options || [];

        // If options array is empty, try to find numbered properties (0, 1, 2, etc.)
        if (options.length === 0) {
          const numericKeys = Object.keys(questionData)
            .filter((key) => !isNaN(Number(key)))
            .sort((a, b) => Number(a) - Number(b));

          if (numericKeys.length > 0) {
            options = numericKeys.map((key) => ({
              id: key,
              text: String(questionData[key]),
              isCorrect: Number(key) === questionData.correctIndex,
            }));
            console.log(
              `Generated ${options.length} options from numeric keys for question ${doc.id}`
            );
          } else {
            console.warn(
              `Question ${doc.id} has no options, creating placeholder`
            );
            // Create at least empty options to avoid errors
            options = [
              { id: "0", text: "Option 1", isCorrect: true },
              { id: "1", text: "Option 2", isCorrect: false },
            ];
          }
        }

        // Ensure options have the right format
        options = options.map(
          (
            opt: string | Partial<QuizOption> | unknown,
            index: number
          ): QuizOption => {
            // If it's just a string, convert to proper format
            if (typeof opt === "string") {
              return {
                id: index.toString(),
                text: opt,
                isCorrect: index === (questionData.correctIndex || 0),
              };
            }

            // If it's an object with option properties
            const option = opt as Partial<QuizOption>;
            return {
              id: option.id || index.toString(),
              text: option.text || `Option ${index + 1}`,
              isCorrect:
                option.isCorrect !== undefined
                  ? option.isCorrect
                  : index === (questionData.correctIndex || 0),
            };
          }
        );

        const question: QuizQuestion = {
          id: doc.id,
          text: questionData.text || "",
          options: options,
          points: questionData.points || 1,
          type: questionData.type || "single",
        };

        // Add optional fields if they exist
        if (questionData.correctIndex !== undefined) {
          question.correctIndex = questionData.correctIndex;
        } else if (options.length > 0) {
          // Try to determine correctIndex from options if not explicitly set
          const correctOptionIndex = options.findIndex(
            (opt: QuizOption) => opt.isCorrect
          );
          if (correctOptionIndex >= 0) {
            question.correctIndex = correctOptionIndex;
          }
        }

        if (questionData.imageUrl) {
          question.imageUrl = questionData.imageUrl;
        }

        questions.push(question);
      } catch (error) {
        console.error(`Error processing question ${doc.id}:`, error);
        // Skip this question and continue with others
      }
    });

    console.log(
      `Successfully loaded ${questions.length} questions for ${difficulty} difficulty`
    );
    return questions;
  } catch (error) {
    console.error(
      `Error fetching ${difficulty} questions for quiz ${quizId}:`,
      error
    );
    throw error;
  }
}
