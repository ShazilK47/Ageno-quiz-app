/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import useSWR from "swr";
import { User } from "firebase/auth";
import { Role } from "@/constants/role";
import { useAuth as useAuthContext } from "@/contexts/auth-context";
import {
  updateUserProfile,
  updateUserEmail,
  updateUserPassword,
  sendVerificationEmail,
  resetPassword,
  getMfaStatus,
  startPhoneMfaEnrollment,
  completePhoneMfaEnrollment,
  generateTotpSecret,
  completeTotpMfaEnrollment,
  unenrollMfaFactor,
} from "@/lib/actions/auth.actions";
import { checkSession, refreshSession } from "@/lib/actions/session.actions";

// Custom types
export interface UserWithRole extends User {
  role?: Role;
}

export interface AuthError {
  code: string;
  message: string;
}

export interface AuthResponse<T = unknown> {
  data: T | null;
  error: AuthError | null;
  loading: boolean;
}

export interface MfaStatusResponse {
  isEnabled: boolean;
  availableFactors: any[];
}

/**
 * Enhanced authentication hook that uses SWR for caching and revalidation
 * while maintaining compatibility with the existing auth context
 */
export function useAuth() {
  const authContext = useAuthContext();

  // Use SWR to check session status
  const {
    data: sessionData,
    error: sessionError,
    mutate: revalidateSession,
  } = useSWR(
    "auth/session",
    async () => {
      const result = await checkSession();
      return result;
    },
    {
      // Only revalidate on focus to avoid too many requests
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      // Cache for 5 minutes (adjust as needed)
      dedupingInterval: 300000,
      // Handle error
      onError: (error) => {
        console.error("Error validating session:", error);
      },
    }
  );

  /**
   * Login with email and password with improved error handling
   */
  const login = async (
    email: string,
    password: string
  ): Promise<AuthResponse<boolean>> => {
    try {
      const result = await authContext.login(email, password);

      if (result.success) {
        // Revalidate session data after successful login
        await revalidateSession();
        return { data: true, error: null, loading: false };
      } else {
        return {
          data: false,
          error: {
            code: "auth/login-failed",
            message: result.error || "Login failed",
          },
          loading: false,
        };
      }
    } catch (error: any) {
      return {
        data: false,
        error: {
          code: error.code || "auth/unknown",
          message: error.message || "An unknown error occurred",
        },
        loading: false,
      };
    }
  };

  /**
   * Login with Google with improved error handling
   */
  const loginWithGoogle = async (): Promise<AuthResponse<boolean>> => {
    try {
      const result = await authContext.loginWithGoogle();

      if (result.success) {
        // Revalidate session data after successful login
        await revalidateSession();
        return { data: true, error: null, loading: false };
      } else {
        return {
          data: false,
          error: {
            code: "auth/google-login-failed",
            message: result.error || "Google login failed",
          },
          loading: false,
        };
      }
    } catch (error: any) {
      return {
        data: false,
        error: {
          code: error.code || "auth/unknown",
          message: error.message || "An unknown error occurred",
        },
        loading: false,
      };
    }
  };

  /**
   * Sign up with email, password, and display name with improved error handling
   */
  const signUp = async (
    email: string,
    password: string,
    displayName: string
  ): Promise<AuthResponse<boolean>> => {
    try {
      const result = await authContext.signUp(email, password, displayName);

      if (result.success) {
        return { data: true, error: null, loading: false };
      } else {
        return {
          data: false,
          error: {
            code: "auth/signup-failed",
            message: result.error || "Signup failed",
          },
          loading: false,
        };
      }
    } catch (error: any) {
      return {
        data: false,
        error: {
          code: error.code || "auth/unknown",
          message: error.message || "An unknown error occurred",
        },
        loading: false,
      };
    }
  };

  /**
   * Logout with improved error handling
   */
  const logout = async (): Promise<AuthResponse<boolean>> => {
    try {
      const result = await authContext.logout();

      if (result) {
        // Revalidate session data after successful logout
        await revalidateSession();
        return { data: true, error: null, loading: false };
      } else {
        return {
          data: false,
          error: {
            code: "auth/logout-failed",
            message: "Failed to log out",
          },
          loading: false,
        };
      }
    } catch (error: any) {
      return {
        data: false,
        error: {
          code: error.code || "auth/unknown",
          message: error.message || "An unknown error occurred",
        },
        loading: false,
      };
    }
  };

  /**
   * Update user profile with improved error handling
   */
  const updateProfile = async (data: {
    displayName?: string;
    photoURL?: string;
  }): Promise<AuthResponse<boolean>> => {
    try {
      if (!authContext.user) {
        return {
          data: false,
          error: {
            code: "auth/user-not-found",
            message: "No user is currently logged in",
          },
          loading: false,
        };
      }

      const result = await updateUserProfile(authContext.user, data);

      if (result === true) {
        // Revalidate session data after profile update
        await revalidateSession();
        return { data: true, error: null, loading: false };
      } else {
        return {
          data: false,
          error: {
            code:
              typeof result === "object" && result !== null
                ? result.code
                : "auth/update-profile-failed",
            message:
              typeof result === "object" && result !== null
                ? result.message
                : "Failed to update profile",
          },
          loading: false,
        };
      }
    } catch (error: any) {
      return {
        data: false,
        error: {
          code: error.code || "auth/unknown",
          message: error.message || "An unknown error occurred",
        },
        loading: false,
      };
    }
  };

  /**
   * Update user email with improved error handling
   */ const updateEmail = async (
    currentPassword: string,
    newEmail: string
  ): Promise<AuthResponse<boolean>> => {
    try {
      if (!authContext.user) {
        return {
          data: false,
          error: {
            code: "auth/user-not-found",
            message: "No user is currently logged in",
          },
          loading: false,
        };
      }

      const result = await updateUserEmail(
        authContext.user,
        currentPassword,
        newEmail
      );

      if (result === true) {
        // Revalidate session data after email update
        await revalidateSession();
        return { data: true, error: null, loading: false };
      } else {
        return {
          data: false,
          error: {
            code:
              typeof result === "object" && result !== null
                ? result.code
                : "auth/update-email-failed",
            message:
              typeof result === "object" && result !== null
                ? result.message
                : "Failed to update email",
          },
          loading: false,
        };
      }
    } catch (error: any) {
      return {
        data: false,
        error: {
          code: error.code || "auth/unknown",
          message: error.message || "An unknown error occurred",
        },
        loading: false,
      };
    }
  };

  /**
   * Update user password with improved error handling
   */ const updatePassword = async (
    currentPassword: string,
    newPassword: string
  ): Promise<AuthResponse<boolean>> => {
    try {
      if (!authContext.user) {
        return {
          data: false,
          error: {
            code: "auth/user-not-found",
            message: "No user is currently logged in",
          },
          loading: false,
        };
      }

      const result = await updateUserPassword(
        authContext.user,
        currentPassword,
        newPassword
      );

      if (result === true) {
        return { data: true, error: null, loading: false };
      } else {
        return {
          data: false,
          error: {
            code:
              typeof result === "object" && result !== null
                ? result.code
                : "auth/update-password-failed",
            message:
              typeof result === "object" && result !== null
                ? result.message
                : "Failed to update password",
          },
          loading: false,
        };
      }
    } catch (error: any) {
      return {
        data: false,
        error: {
          code: error.code || "auth/unknown",
          message: error.message || "An unknown error occurred",
        },
        loading: false,
      };
    }
  };

  /**
   * Send email verification with improved error handling
   */
  const sendEmailVerification = async (): Promise<AuthResponse<boolean>> => {
    try {
      if (!authContext.user) {
        return {
          data: false,
          error: {
            code: "auth/user-not-found",
            message: "No user is currently logged in",
          },
          loading: false,
        };
      }

      const result = await sendVerificationEmail(authContext.user);
      if (result === true) {
        return { data: true, error: null, loading: false };
      } else {
        return {
          data: false,
          error: {
            code:
              typeof result === "object" && result !== null
                ? result.code
                : "auth/verification-email-failed",
            message:
              typeof result === "object" && result !== null
                ? result.message
                : "Failed to send verification email",
          },
          loading: false,
        };
      }
    } catch (error: any) {
      return {
        data: false,
        error: {
          code: error.code || "auth/unknown",
          message: error.message || "An unknown error occurred",
        },
        loading: false,
      };
    }
  };

  /**
   * Send password reset email with improved error handling
   */
  const forgotPassword = async (
    email: string
  ): Promise<AuthResponse<boolean>> => {
    try {
      const result = await resetPassword(email);
      if (result === true) {
        return { data: true, error: null, loading: false };
      } else {
        return {
          data: false,
          error: {
            code:
              typeof result === "object" && result !== null
                ? result.code
                : "auth/reset-password-failed",
            message:
              typeof result === "object" && result !== null
                ? result.message
                : "Failed to send password reset email",
          },
          loading: false,
        };
      }
    } catch (error: any) {
      return {
        data: false,
        error: {
          code: error.code || "auth/unknown",
          message: error.message || "An unknown error occurred",
        },
        loading: false,
      };
    }
  };

  /**
   * Get MFA status with improved error handling
   */
  const getMFAStatus = (): AuthResponse<MfaStatusResponse> => {
    try {
      if (!authContext.user) {
        return {
          data: null,
          error: {
            code: "auth/user-not-found",
            message: "No user is currently logged in",
          },
          loading: false,
        };
      }
      const status = getMfaStatus(authContext.user);
      // Convert the status to match the expected MfaStatusResponse interface
      const mfaStatus: MfaStatusResponse = {
        isEnabled: status.enrolled,
        availableFactors: status.availableFactors,
      };
      return { data: mfaStatus, error: null, loading: false };
    } catch (error: any) {
      return {
        data: null,
        error: {
          code: error.code || "auth/unknown",
          message: error.message || "An unknown error occurred",
        },
        loading: false,
      };
    }
  };

  /**
   * Start phone MFA enrollment with improved error handling
   */
  const startPhoneMFA = async (
    phoneNumber: string,
    recaptchaContainer: HTMLElement
  ): Promise<AuthResponse<{ verificationId: string }>> => {
    try {
      if (!authContext.user) {
        return {
          data: null,
          error: {
            code: "auth/user-not-found",
            message: "No user is currently logged in",
          },
          loading: false,
        };
      }

      const result = await startPhoneMfaEnrollment(
        authContext.user,
        phoneNumber,
        recaptchaContainer
      );

      if ("verificationId" in result) {
        return { data: result, error: null, loading: false };
      } else {
        return {
          data: null,
          error: {
            code:
              typeof result === "object" && result !== null
                ? result.code
                : "auth/phone-mfa-start-failed",
            message:
              typeof result === "object" && result !== null
                ? result.message
                : "Failed to start phone MFA enrollment",
          },
          loading: false,
        };
      }
    } catch (error: any) {
      return {
        data: null,
        error: {
          code: error.code || "auth/unknown",
          message: error.message || "An unknown error occurred",
        },
        loading: false,
      };
    }
  };

  /**
   * Complete phone MFA enrollment with improved error handling
   */
  const completePhoneMFA = async (
    verificationId: string,
    verificationCode: string,
    displayName?: string
  ): Promise<AuthResponse<boolean>> => {
    try {
      if (!authContext.user) {
        return {
          data: false,
          error: {
            code: "auth/user-not-found",
            message: "No user is currently logged in",
          },
          loading: false,
        };
      }

      const result = await completePhoneMfaEnrollment(
        authContext.user,
        verificationId,
        verificationCode,
        displayName
      );

      if (result === true) {
        return { data: true, error: null, loading: false };
      } else {
        return {
          data: false,
          error: {
            code:
              typeof result === "object" && result !== null
                ? result.code
                : "auth/phone-mfa-complete-failed",
            message:
              typeof result === "object" && result !== null
                ? result.message
                : "Failed to complete phone MFA enrollment",
          },
          loading: false,
        };
      }
    } catch (error: any) {
      return {
        data: false,
        error: {
          code: error.code || "auth/unknown",
          message: error.message || "An unknown error occurred",
        },
        loading: false,
      };
    }
  };

  /**
   * Generate TOTP secret for MFA enrollment with improved error handling
   */
  const generateTOTPSecret = async (): Promise<AuthResponse<any>> => {
    try {
      if (!authContext.user) {
        return {
          data: null,
          error: {
            code: "auth/user-not-found",
            message: "No user is currently logged in",
          },
          loading: false,
        };
      }

      const result = await generateTotpSecret(authContext.user);

      if ("secretKey" in result) {
        return { data: result, error: null, loading: false };
      } else {
        return {
          data: null,
          error: {
            code:
              typeof result === "object" && result !== null
                ? result.code
                : "auth/totp-secret-failed",
            message:
              typeof result === "object" && result !== null
                ? result.message
                : "Failed to generate TOTP secret",
          },
          loading: false,
        };
      }
    } catch (error: any) {
      return {
        data: null,
        error: {
          code: error.code || "auth/unknown",
          message: error.message || "An unknown error occurred",
        },
        loading: false,
      };
    }
  };

  /**
   * Complete TOTP MFA enrollment with improved error handling
   */
  const completeTOTPMFA = async (
    totpSecret: any,
    verificationCode: string,
    displayName?: string
  ): Promise<AuthResponse<boolean>> => {
    try {
      if (!authContext.user) {
        return {
          data: false,
          error: {
            code: "auth/user-not-found",
            message: "No user is currently logged in",
          },
          loading: false,
        };
      }

      const result = await completeTotpMfaEnrollment(
        authContext.user,
        totpSecret,
        verificationCode,
        displayName
      );

      if (result === true) {
        return { data: true, error: null, loading: false };
      } else {
        return {
          data: false,
          error: {
            code:
              typeof result === "object" && result !== null
                ? result.code
                : "auth/totp-mfa-complete-failed",
            message:
              typeof result === "object" && result !== null
                ? result.message
                : "Failed to complete TOTP MFA enrollment",
          },
          loading: false,
        };
      }
    } catch (error: any) {
      return {
        data: false,
        error: {
          code: error.code || "auth/unknown",
          message: error.message || "An unknown error occurred",
        },
        loading: false,
      };
    }
  };

  /**
   * Unenroll MFA factor with improved error handling
   */
  const unenrollMFA = async (
    factorUid: string
  ): Promise<AuthResponse<boolean>> => {
    try {
      if (!authContext.user) {
        return {
          data: false,
          error: {
            code: "auth/user-not-found",
            message: "No user is currently logged in",
          },
          loading: false,
        };
      }

      const result = await unenrollMfaFactor(authContext.user, factorUid);

      if (result === true) {
        return { data: true, error: null, loading: false };
      } else {
        return {
          data: false,
          error: {
            code:
              typeof result === "object" && result !== null
                ? result.code
                : "auth/mfa-unenroll-failed",
            message:
              typeof result === "object" && result !== null
                ? result.message
                : "Failed to unenroll MFA factor",
          },
          loading: false,
        };
      }
    } catch (error: any) {
      return {
        data: false,
        error: {
          code: error.code || "auth/unknown",
          message: error.message || "An unknown error occurred",
        },
        loading: false,
      };
    }
  };

  /**
   * Refresh user session with improved error handling
   */
  const refreshUserSession = async (): Promise<AuthResponse<boolean>> => {
    try {
      if (!authContext.user) {
        return {
          data: false,
          error: {
            code: "auth/user-not-found",
            message: "No user is currently logged in",
          },
          loading: false,
        };
      }

      const result = await refreshSession(authContext.user);

      if (result.success) {
        // Revalidate session data after refreshing
        await revalidateSession();
        return { data: true, error: null, loading: false };
      } else {
        return {
          data: false,
          error: {
            code: "auth/session-refresh-failed",
            message: result.error || "Failed to refresh session",
          },
          loading: false,
        };
      }
    } catch (error: any) {
      return {
        data: false,
        error: {
          code: error.code || "auth/unknown",
          message: error.message || "An unknown error occurred",
        },
        loading: false,
      };
    }
  };

  // Return all the enhanced auth functions along with the original context
  return {
    // Original context values
    user: authContext.user,
    loading: authContext.loading,
    isAdmin: authContext.isAdmin,

    // Session data from SWR
    session: {
      isAuthenticated: sessionData?.isAuthenticated || false,
      user: sessionData?.user || null,
      loading: !sessionData && !sessionError,
      error: sessionError,
      revalidate: revalidateSession,
    },

    // Enhanced functions with better error handling
    login,
    loginWithGoogle,
    signUp,
    logout,
    updateProfile,
    updateEmail,
    updatePassword,
    sendEmailVerification,
    forgotPassword,
    getMFAStatus,
    startPhoneMFA,
    completePhoneMFA,
    generateTOTPSecret,
    completeTOTPMFA,
    unenrollMFA,
    refreshUserSession,

    // Add the original functions for backward compatibility
    verifySession: authContext.verifySession,
  };
}
