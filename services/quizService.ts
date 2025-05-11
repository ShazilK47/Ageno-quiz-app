// services/quizService.ts
import { Quiz, QuizQuestion, QuizSubmission } from "@/firebase/firestore";
import { db } from "@/firebase/client";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore";
import { handleFirebaseError } from "@/firebase/utils";

// Create a new quiz
export async function createQuiz(
  quiz: Omit<Quiz, "id" | "createdAt">,
  userId: string
): Promise<string> {
  try {
    const quizzesCollection = collection(db, "quizzes");
    const newQuizRef = doc(quizzesCollection);

    await setDoc(newQuizRef, {
      ...quiz,
      createdBy: userId,
      createdAt: serverTimestamp(),
    });

    return newQuizRef.id;
  } catch (error) {
    const formattedError = handleFirebaseError(error);
    console.error("Error creating quiz:", formattedError);
    throw new Error(`Failed to create quiz: ${formattedError.message}`);
  }
}

// Get a quiz by ID
export async function getQuizById(quizId: string): Promise<Quiz | null> {
  try {
    const quizRef = doc(db, "quizzes", quizId);
    const quizSnap = await getDoc(quizRef);

    if (!quizSnap.exists()) {
      return null;
    }

    const quizData = quizSnap.data();

    // Convert Firestore Timestamp to Date
    const createdAt =
      quizData.createdAt instanceof Timestamp
        ? quizData.createdAt.toDate()
        : new Date(quizData.createdAt);

    return {
      id: quizSnap.id,
      ...quizData,
      createdAt,
    } as Quiz;
  } catch (error) {
    const formattedError = handleFirebaseError(error);
    console.error(`Error getting quiz ${quizId}:`, formattedError);
    throw new Error(`Failed to get quiz: ${formattedError.message}`);
  }
}

// Get a quiz by access code
export async function getQuizByAccessCode(
  accessCode: string
): Promise<Quiz | null> {
  try {
    const quizzesRef = collection(db, "quizzes");
    const q = query(quizzesRef, where("accessCode", "==", accessCode));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const quizDoc = querySnapshot.docs[0];
    const quizData = quizDoc.data();

    // Convert Firestore Timestamp to Date
    const createdAt =
      quizData.createdAt instanceof Timestamp
        ? quizData.createdAt.toDate()
        : new Date(quizData.createdAt);

    return {
      id: quizDoc.id,
      ...quizData,
      createdAt,
    } as Quiz;
  } catch (error) {
    const formattedError = handleFirebaseError(error);
    console.error(
      `Error getting quiz by access code ${accessCode}:`,
      formattedError
    );
    throw new Error(`Failed to get quiz: ${formattedError.message}`);
  }
}

// Get quizzes by created user
export async function getQuizzesByUser(userId: string): Promise<Quiz[]> {
  try {
    const quizzesRef = collection(db, "quizzes");
    const q = query(
      quizzesRef,
      where("createdBy", "==", userId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();

      // Convert Firestore Timestamp to Date
      const createdAt =
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : new Date(data.createdAt);

      return {
        id: doc.id,
        ...data,
        createdAt,
      } as Quiz;
    });
  } catch (error) {
    const formattedError = handleFirebaseError(error);
    console.error(`Error getting quizzes for user ${userId}:`, formattedError);
    throw new Error(`Failed to get quizzes: ${formattedError.message}`);
  }
}

// Update a quiz
export async function updateQuiz(
  quizId: string,
  quiz: Partial<Omit<Quiz, "id" | "createdAt" | "createdBy">>
): Promise<void> {
  try {
    const quizRef = doc(db, "quizzes", quizId);

    await updateDoc(quizRef, {
      ...quiz,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    const formattedError = handleFirebaseError(error);
    console.error(`Error updating quiz ${quizId}:`, formattedError);
    throw new Error(`Failed to update quiz: ${formattedError.message}`);
  }
}

// Delete a quiz
export async function deleteQuiz(quizId: string): Promise<void> {
  try {
    const quizRef = doc(db, "quizzes", quizId);
    await deleteDoc(quizRef);
  } catch (error) {
    const formattedError = handleFirebaseError(error);
    console.error(`Error deleting quiz ${quizId}:`, formattedError);
    throw new Error(`Failed to delete quiz: ${formattedError.message}`);
  }
}

// Submit a quiz attempt
export async function submitQuizAttempt(
  quizId: string,
  userId: string,
  answers: Record<string, string[]>,
  startedAt: Date,
  completedAt: Date
): Promise<string> {
  try {
    const submissionsCollection = collection(db, "submissions");
    const newSubmissionRef = doc(submissionsCollection);

    const submission: Omit<QuizSubmission, "id"> = {
      quizId,
      userId,
      answers,
      startedAt,
      completedAt,
      score: null, // Will be calculated later if auto-check is enabled
      createdAt: serverTimestamp(),
    };

    await setDoc(newSubmissionRef, submission);

    return newSubmissionRef.id;
  } catch (error) {
    const formattedError = handleFirebaseError(error);
    console.error(`Error submitting quiz ${quizId}:`, formattedError);
    throw new Error(`Failed to submit quiz: ${formattedError.message}`);
  }
}

// Calculate and update the score for a submission
export async function calculateScore(
  submissionId: string,
  quiz: Quiz
): Promise<number> {
  try {
    const submissionRef = doc(db, "submissions", submissionId);
    const submissionSnap = await getDoc(submissionRef);

    if (!submissionSnap.exists()) {
      throw new Error("Submission not found");
    }

    const submission = submissionSnap.data() as QuizSubmission;
    const answers = submission.answers;

    let totalScore = 0;
    let maxScore = 0;

    // Calculate score based on correct answers
    quiz.questions?.forEach((question: QuizQuestion) => {
      maxScore += question.points;

      const correctOptionIds = question.options
        .filter((option) => option.isCorrect)
        .map((option) => option.id);

      const userAnswers = answers[question.id] || [];

      // Check if arrays have the same elements (regardless of order)
      const isCorrect =
        correctOptionIds.length === userAnswers.length &&
        correctOptionIds.every((id) => userAnswers.includes(id));

      if (isCorrect) {
        totalScore += question.points;
      }
    });

    // Update the submission with the score
    await updateDoc(submissionRef, {
      score: totalScore,
      maxScore,
      percentage: Math.round((totalScore / maxScore) * 100),
      gradedAt: serverTimestamp(),
    });

    return totalScore;
  } catch (error) {
    const formattedError = handleFirebaseError(error);
    console.error(
      `Error calculating score for submission ${submissionId}:`,
      formattedError
    );
    throw new Error(`Failed to calculate score: ${formattedError.message}`);
  }
}

// Get quiz submissions for a user
export async function getUserSubmissions(
  userId: string
): Promise<QuizSubmission[]> {
  try {
    const submissionsRef = collection(db, "submissions");
    const q = query(
      submissionsRef,
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();

      // Convert Firestore Timestamps to Dates
      const createdAt =
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : new Date(data.createdAt);

      const startedAt =
        data.startedAt instanceof Timestamp
          ? data.startedAt.toDate()
          : new Date(data.startedAt);

      const completedAt =
        data.completedAt instanceof Timestamp
          ? data.completedAt.toDate()
          : new Date(data.completedAt);

      const gradedAt =
        data.gradedAt instanceof Timestamp
          ? data.gradedAt.toDate()
          : data.gradedAt
          ? new Date(data.gradedAt)
          : null;

      return {
        id: doc.id,
        ...data,
        createdAt,
        startedAt,
        completedAt,
        gradedAt,
      } as QuizSubmission;
    });
  } catch (error) {
    const formattedError = handleFirebaseError(error);
    console.error(
      `Error getting submissions for user ${userId}:`,
      formattedError
    );
    throw new Error(`Failed to get submissions: ${formattedError.message}`);
  }
}

// Get submissions for a specific quiz
export async function getQuizSubmissions(
  quizId: string
): Promise<QuizSubmission[]> {
  try {
    const submissionsRef = collection(db, "submissions");
    const q = query(
      submissionsRef,
      where("quizId", "==", quizId),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => {
      const data = doc.data();

      // Convert Firestore Timestamps to Dates
      const createdAt =
        data.createdAt instanceof Timestamp
          ? data.createdAt.toDate()
          : new Date(data.createdAt);

      const startedAt =
        data.startedAt instanceof Timestamp
          ? data.startedAt.toDate()
          : new Date(data.startedAt);

      const completedAt =
        data.completedAt instanceof Timestamp
          ? data.completedAt.toDate()
          : new Date(data.completedAt);

      const gradedAt =
        data.gradedAt instanceof Timestamp
          ? data.gradedAt.toDate()
          : data.gradedAt
          ? new Date(data.gradedAt)
          : null;

      return {
        id: doc.id,
        ...data,
        createdAt,
        startedAt,
        completedAt,
        gradedAt,
      } as QuizSubmission;
    });
  } catch (error) {
    const formattedError = handleFirebaseError(error);
    console.error(
      `Error getting submissions for quiz ${quizId}:`,
      formattedError
    );
    throw new Error(`Failed to get submissions: ${formattedError.message}`);
  }
}
