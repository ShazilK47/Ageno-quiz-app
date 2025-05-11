// firebase/utils.ts
import { FirebaseError } from "firebase/app";

export interface FirestoreErrorResponse {
  code: string;
  message: string;
  details?: string;
  help?: string;
}

/**
 * Helper function to format Firebase errors for a better user experience
 * @param error Any error caught from Firebase operations
 * @returns A standardized error object with user-friendly messages
 */
export function handleFirebaseError(error: unknown): FirestoreErrorResponse {
  if (error instanceof FirebaseError) {
    // Handle specific Firebase errors with custom messages
    switch (error.code) {
      // Auth errors
      case "auth/email-already-in-use":
        return {
          code: error.code,
          message: "This email address is already in use.",
          help: "Try signing in instead or use a different email address.",
        };
      case "auth/invalid-email":
        return {
          code: error.code,
          message: "The email address is not valid.",
          help: "Please check the email format.",
        };
      case "auth/user-not-found":
      case "auth/wrong-password":
        return {
          code: error.code,
          message: "Incorrect email or password.",
          help: "Check your credentials or reset your password.",
        };
      case "auth/weak-password":
        return {
          code: error.code,
          message: "The password is too weak.",
          help: "Use a stronger password with at least 6 characters.",
        };

      // Firestore errors
      case "permission-denied":
        return {
          code: error.code,
          message: "You don't have permission to access this data.",
          help: "Contact an administrator if you need access.",
        };
      case "resource-exhausted":
        return {
          code: error.code,
          message: "Database operation limit reached.",
          help: "Please try again later or contact support.",
        };
      case "failed-precondition":
        if (error.message.includes("index")) {
          return {
            code: error.code,
            message: "The database needs to be indexed for this query.",
            details: error.message,
            help: "Please wait while we set up the necessary database indexes. This may take a few minutes.",
          };
        }
        return {
          code: error.code,
          message: "This operation cannot be performed at this time.",
          details: error.message,
        };

      default:
        return {
          code: error.code,
          message: "An error occurred with the Firebase operation.",
          details: error.message,
        };
    }
  } else if (error instanceof Error) {
    return {
      code: "unknown-error",
      message: "An unexpected error occurred.",
      details: error.message,
    };
  } else {
    return {
      code: "unknown-error",
      message: "An unknown error occurred.",
      details: String(error),
    };
  }
}
