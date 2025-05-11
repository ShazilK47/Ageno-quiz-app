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
  duration: number; // in minutes
  isAutoCheck: boolean;
  accessCode: string;
  requiresAccessCode?: boolean; // Flag to indicate if access code is required
  questions?: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: QuizOption[];
  points: number;
  type?: "single" | "multiple" | "truefalse" | string;
  correctIndex?: number; // Added for backward compatibility
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

    const quiz = quizConverter.fromFirestore(quizSnapshot); // Fetch questions subcollection
    const questionsRef = collection(db, "quizzes", quizId, "questions");
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
  cameraFlags: string[] = []
): Promise<string | null> {
  try {
    // Log authentication state for debugging
    logAuthState();

    // Get current user ID, or use "anonymous" if not logged in
    const userId = auth.currentUser?.uid || "anonymous";

    // Get quiz data to calculate score
    const quiz = await getQuizById(quizId);
    if (!quiz || !quiz.questions) {
      console.error(
        "Cannot submit response: Quiz not found or has no questions"
      );
      return null;
    }

    // Calculate score if auto-check is enabled
    let score = null;
    if (quiz.isAutoCheck) {
      let correctCount = 0;
      let answeredCount = 0;

      userAnswers.forEach((answer) => {
        if (answer.selectedOptionIndex !== null) {
          answeredCount++;

          // Find matching question to check if answer is correct
          const question = quiz.questions?.find(
            (q) => q.id === answer.questionId
          );
          if (
            question &&
            answer.selectedOptionIndex === question.correctIndex
          ) {
            correctCount++;
          }
        }
      });

      // Calculate percentage score
      if (answeredCount > 0) {
        score = Math.round((correctCount / quiz.questions.length) * 100);
      }
    }

    // Create response document
    const responsesRef = collection(db, "responses");
    const responseData = {
      quizId,
      userId,
      startedAt: Timestamp.fromDate(startTime),
      submittedAt: Timestamp.fromDate(new Date()),
      score, // Will be null if auto-check is disabled
      tabSwitchCount: tabSwitches,
      cameraFlags,
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

    console.log(`Quiz response submitted: ${responseDoc.id}`);
    return responseDoc.id;
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
