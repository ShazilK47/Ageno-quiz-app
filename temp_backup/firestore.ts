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
  duration: number; // in minutes
  isAutoCheck: boolean;
  accessCode: string;
  questions?: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: {
    id: string;
    text: string;
  }[];
  correctIndex: number;
  type: "mcq" | "truefalse" | string;
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

    const quiz = quizConverter.fromFirestore(quizSnapshot);

    // Fetch questions subcollection
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
    logAuthState();    // Get current user ID, or use "anonymous" if not logged in
    const userId = auth.currentUser?.uid || "anonymous";
    
    console.log("Submitting quiz response for user:", userId);

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
    }    // Create response document
    const responsesRef = collection(db, "responses");
    
    // Make sure to stringify the user ID to avoid any potential type mismatches
    const userIdString = userId.toString();
    
    const responseData = {
      quizId,
      userId: userIdString,
      startedAt: Timestamp.fromDate(startTime),
      submittedAt: Timestamp.fromDate(new Date()),
      score, // Will be null if auto-check is disabled
      tabSwitchCount: tabSwitches,
      cameraFlags,
    };
    
    console.log("Saving response with userId:", userIdString);

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
export async function getUserQuizAttempts(): Promise<QuizAttempt[]> {  try {
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
      
      // Log the first few responses with their structure
      if (allResponses.size > 0) {
        const debugResponses = allResponses.docs.slice(0, 3).map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId,
            quizId: data.quizId,
            startedAt: data.startedAt instanceof Timestamp ? data.startedAt.toDate().toISOString() : null,
            submittedAt: data.submittedAt instanceof Timestamp ? data.submittedAt.toDate().toISOString() : null,
          };
        });
        console.log("DEBUG: Sample responses:", JSON.stringify(debugResponses, null, 2));
      }    } catch (err) {
      console.error("Error in debug query:", err);
    } 
      // Query responses collection for user's attempts
    const responsesRef = collection(db, "responses");
    
    console.log("Current user ID for query:", userId);
    
    // Try multiple query approaches to handle different user ID formats 
    // that might be stored in Firestore
    
    // First try exact matching with userId
    let responsesQuery = query(
      responsesRef,
      where("userId", "==", userId),
      orderBy("submittedAt", "desc")
    );
    
    let querySnapshot = await getDocs(responsesQuery);
    console.log(`Direct query found ${querySnapshot.size} responses with userId: ${userId}`);
    
    // If no results with exact match, try with userId as string
    if (querySnapshot.size === 0) {
      responsesQuery = query(
        responsesRef, 
        where("userId", "==", userId.toString()),
        orderBy("submittedAt", "desc")
      );
      querySnapshot = await getDocs(responsesQuery);
      console.log(`String userId query found ${querySnapshot.size} responses`);
    }
      // If still no results, try a different collection structure
    if (querySnapshot.size === 0) {
      console.log("No direct matches found, fetching all responses as a temporary fallback");
      responsesQuery = query(responsesRef, orderBy("submittedAt", "desc"));
      querySnapshot = await getDocs(responsesQuery);
      console.log(`Found ${querySnapshot.size} total responses in the database`);
      
      if (querySnapshot.size === 0) {
        console.log("Trying alternative collection structure...");
        // Maybe responses are stored in a subcollection of quizzes
        const quizzesRef = collection(db, "quizzes");
        const quizzes = await getDocs(quizzesRef);
        
        const allResponses = [];
        for (const quizDoc of quizzes.docs) {
          // Check if there's a responses subcollection
          const quizResponsesRef = collection(db, "quizzes", quizDoc.id, "responses");
          try {
            const quizResponses = await getDocs(quizResponsesRef);
            
            if (quizResponses.size > 0) {
              console.log(`Found ${quizResponses.size} responses in quiz ${quizDoc.id}`);
              allResponses.push(...quizResponses.docs);
            }
          } catch (err) {
            console.error(`Error checking for responses in quiz ${quizDoc.id}:`, err);
          }
        }
        
        if (allResponses.length > 0) {
          console.log(`Found ${allResponses.length} total responses in quizzes subcollections`);
          // Replace the empty querySnapshot with our found responses
          querySnapshot = {
            docs: allResponses,
            size: allResponses.length,
            forEach: (callback) => allResponses.forEach(callback)
          } as any;
        }
      }
    }
      // Process the matching responses
    const attempts: QuizAttempt[] = [];
    
    for (const docSnapshot of querySnapshot.docs) {      try {
        const docData = docSnapshot.data();
        
        // Filter by userId as a fallback when using the "all responses" query
        if (querySnapshot.size > 10 && docData.userId !== userId && docData.userId !== userId.toString()) {
          // Skip responses that don't match the current user when we're using all responses
          continue;
        }
        
        console.log(`Processing response document ${docSnapshot.id}:`, {
          userId: docData.userId,
          quizId: docData.quizId,
          submittedAt: docData.submittedAt ? "Present" : "Missing",
        });
        
        // Convert Firestore timestamp to JavaScript Date
        const startedAt = docData.startedAt instanceof Timestamp 
          ? docData.startedAt.toDate() 
          : new Date();
          
        const submittedAt = docData.submittedAt instanceof Timestamp 
          ? docData.submittedAt.toDate() 
          : new Date();
        
        // Create the attempt object from the response document
        const attempt: QuizAttempt = {
          id: docSnapshot.id,
          quizId: docData.quizId || "",
          startedAt: startedAt,
          submittedAt: submittedAt,
          score: docData.score !== undefined ? docData.score : null,
          tabSwitchCount: docData.tabSwitchCount || 0,
          cameraFlags: Array.isArray(docData.cameraFlags) ? docData.cameraFlags : [],
          answers: []
        };
        
        // Fetch the quiz title and description
        if (attempt.quizId) {
          try {
            const quiz = await getQuizById(attempt.quizId);
            if (quiz) {
              attempt.quizTitle = quiz.title;
              attempt.quizDescription = quiz.description;
              console.log(`Found quiz: ${quiz.title} for attempt ${docSnapshot.id}`);
            } else {
              console.log(`Quiz not found for ID: ${attempt.quizId}`);
              attempt.quizTitle = "Unknown Quiz";
            }
          } catch (quizError) {
            console.error(`Error fetching quiz for ${attempt.quizId}:`, quizError);
            attempt.quizTitle = "Unknown Quiz";
          }
        } else {
          attempt.quizTitle = "Unknown Quiz";
        }        // Fetch answers from the subcollection
        try {
          const answersRef = collection(db, "responses", docSnapshot.id, "answers");
          const answersSnapshot = await getDocs(answersRef);
          console.log(`Found ${answersSnapshot.size} answers for attempt ${docSnapshot.id}`);
            if (answersSnapshot.size > 0) {
            attempt.answers = answersSnapshot.docs.map(answerDoc => {
              const answerData = answerDoc.data();
              return {
                questionId: answerDoc.id, // The document ID in the answers subcollection IS the questionId
                selectedIndex: answerData.selectedIndex ?? 0,
                isCorrect: answerData.isCorrect ?? null
              };
            });
          }
        } catch (answersError) {
          console.error(`Error fetching answers for attempt ${docSnapshot.id}:`, answersError);
        }
        
        // Add the completed attempt to our results
        attempts.push(attempt);
        console.log(`Successfully processed attempt ${docSnapshot.id}`);
      } catch (err) {
        console.error(`Error processing attempt ${docSnapshot.id}:`, err);
      }
    }
    
    console.log(`Returning ${attempts.length} attempts to display in UI`);
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
