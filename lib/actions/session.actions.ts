/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/actions/session.actions.ts
import { User } from "firebase/auth";

export interface SessionResult {
  success: boolean;
  error?: string;
  details?: any;
}

// Create a session cookie on the server
export const createSession = async (user: User): Promise<SessionResult> => {
  try {
    // Get the ID token from the current user
    let idToken;
    try {
      idToken = await user.getIdToken(true); // Force refresh to ensure token is fresh
      console.log("ID token successfully generated");
    } catch (tokenError: any) {
      console.error("Failed to get ID token:", tokenError);
      return {
        success: false,
        error: "Failed to get authentication token",
        details: tokenError.message,
      };
    }

    // Send the ID token to the backend to create a session cookie
    try {
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      // Get the response data regardless of status
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("Failed to parse server response:", parseError);
        data = { error: "Could not parse server response" };
      }

      if (!response.ok) {
        console.error("Server rejected session creation:", data);
        return {
          success: false,
          error: data.error || `Failed to create session (${response.status})`,
          details: data,
        };
      }

      return {
        success: true,
        details: data,
      };
    } catch (fetchError: any) {
      console.error("Network error during session creation:", fetchError);
      return {
        success: false,
        error: "Network error during session creation",
        details: fetchError.message,
      };
    }
  } catch (error: any) {
    console.error("Unexpected error creating session:", error);
    return {
      success: false,
      error: "Unexpected error creating session",
      details: error.message,
    };
  }
};

// Clear session cookie from the server
export const clearSession = async (): Promise<SessionResult> => {
  try {
    const response = await fetch("/api/auth/session", {
      method: "DELETE",
      credentials: "include", // Include cookies
    });

    if (!response.ok) {
      let data;
      try {
        data = await response.json();
      } catch (e) {
        data = { error: "Could not parse response" };
      }

      return {
        success: false,
        error: data.error || `Failed to clear session (${response.status})`,
        details: data,
      };
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error clearing session:", error);
    return {
      success: false,
      error: "Network error while clearing session",
      details: error.message,
    };
  }
};

// Check if the user has a valid session
export const checkSession = async (): Promise<{
  isAuthenticated: boolean;
  user?: any;
  error?: string;
  reason?: string;
}> => {
  try {
    console.log("Sending request to check session");
    const response = await fetch("/api/auth/session/check", {
      method: "GET",
      credentials: "include", // Include cookies
    });

    // Try to parse the response regardless of status
    let data;
    try {
      data = await response.json();
      console.log("Session check response data:", data);
    } catch (parseError) {
      console.error("Failed to parse session check response:", parseError);
      return {
        isAuthenticated: false,
        error: "Failed to parse server response",
        reason: "parse_error",
      };
    }

    if (!response.ok) {
      if (response.status === 401) {
        return {
          isAuthenticated: false,
          reason: data.reason || "unauthorized",
        };
      }

      return {
        isAuthenticated: false,
        error: data.error || `Session check failed (${response.status})`,
        reason: data.reason,
      };
    }

    return {
      isAuthenticated: data.isAuthenticated,
      user: data.user,
    };
  } catch (error: any) {
    console.error("Network error checking session:", error);
    return {
      isAuthenticated: false,
      error: "Network error checking session",
      reason: "network_error",
    };
  }
};

// Refresh the session by getting a new ID token and updating the session cookie
export const refreshSession = async (user: User): Promise<SessionResult> => {
  try {
    // Force refresh the token
    let idToken;
    try {
      idToken = await user.getIdToken(true);
      console.log("ID token successfully refreshed");
    } catch (tokenError: any) {
      console.error("Failed to refresh ID token:", tokenError);
      return {
        success: false,
        error: "Failed to refresh authentication token",
        details: tokenError.message,
      };
    }

    // Create a new session with the fresh token
    try {
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });

      // Get the response data regardless of status
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        data = { error: "Could not parse server response" };
      }

      if (!response.ok) {
        console.error("Server rejected session refresh:", data);
        return {
          success: false,
          error: data.error || `Failed to refresh session (${response.status})`,
          details: data,
        };
      }

      return {
        success: true,
        details: data,
      };
    } catch (fetchError: any) {
      console.error("Network error during session refresh:", fetchError);
      return {
        success: false,
        error: "Network error during session refresh",
        details: fetchError.message,
      };
    }
  } catch (error: any) {
    console.error("Error refreshing session:", error);
    return {
      success: false,
      error: "Unexpected error refreshing session",
      details: error.message,
    };
  }
};
