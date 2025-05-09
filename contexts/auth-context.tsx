/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { initializeAuth, User } from "firebase/auth";
import { ROLES, Role } from "@/constants/role";
import {
  onAuthChange,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  signUpWithEmail,
} from "@/lib/actions/auth.actions";
import {
  createSession,
  clearSession,
  checkSession,
  refreshSession,
} from "@/lib/actions/session.actions";

interface UserWithRole extends User {
  role?: Role;
}

interface AuthContextType {
  user: UserWithRole | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    displayName: string
  ) => Promise<{
    success: boolean;
    error?: string;
  }>;
  login: (
    email: string,
    password: string
  ) => Promise<{
    success: boolean;
    error?: string;
  }>;
  loginWithGoogle: () => Promise<{
    success: boolean;
    error?: string;
  }>;
  logout: () => Promise<boolean>;
  isAdmin: boolean;
  verifySession: () => Promise<boolean>;
  refreshUserSession: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserWithRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false); // Verify server-side session
  const verifySession = async (): Promise<boolean> => {
    console.log("Starting verifySession function in auth context");
    try {
      // Make a call to the correct session check endpoint
      const response = await fetch("/api/auth/session/check", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies in the request
      });

      if (!response.ok) {
        console.log("Session check returned not OK:", response.status);
        return false;
      }

      const data = await response.json();
      console.log("Session check data:", data);

      // Also verify client-side user state matches server state
      const isAuthenticatedServer = data.isAuthenticated === true;
      const isAuthenticatedClient = user !== null;

      // Only return true if both client and server agree the user is authenticated
      const isAuthenticated = isAuthenticatedServer;
      console.log(
        `Session valid: ${isAuthenticated} (server: ${isAuthenticatedServer}, client: ${isAuthenticatedClient})`
      );

      return isAuthenticated;
    } catch (error) {
      console.error("Session verification error:", error);
      return false;
    }
  };

  // Refresh the user session
  const refreshUserSession = async (): Promise<boolean> => {
    if (!user) return false;

    const result = await refreshSession(user);
    return result.success;
  };

  useEffect(() => {
    const initializeAuth = async () => {
      setLoading(true);

      // First, try to verify the session on the server
      const sessionResult = await checkSession();

      // If session is valid, listen to auth state changes
      const unsubscribe = onAuthChange(async (firebaseUser) => {
        if (firebaseUser) {
          // Try to get role from custom claims first
          const idTokenResult = await firebaseUser.getIdTokenResult();
          const roleClaim = idTokenResult.claims.role as Role | undefined;

          // Set user with role from token claims if available
          const userWithRole = {
            ...firebaseUser,
            role: roleClaim || "user", // Default to user role if not in claims
          };

          setUser(userWithRole);
          setIsAdmin(roleClaim === ROLES.ADMIN);
        } else {
          // No Firebase user, but check if we have a valid server session
          if (sessionResult.isAuthenticated && sessionResult.user) {
            // We have a valid session but no Firebase user
            // This might happen when the app loads and Firebase hasn't initialized yet
            setIsAdmin(sessionResult.user.role === ROLES.ADMIN);
          } else {
            setUser(null);
            setIsAdmin(false);
          }
        }
        setLoading(false);
      });

      return unsubscribe;
    };

    initializeAuth();
  }, []);
  const signUp = async (
    email: string,
    password: string,
    displayName: string
  ) => {
    try {
      const result = await signUpWithEmail(email, password, displayName);
      if ("uid" in result) {
        // Don't create a session for the new user - they need to sign in separately
        return { success: true };
      } else {
        return { success: false, error: result.message };
      }
    } catch (error: any) {
      console.error("Sign up error:", error);
      return { success: false, error: error.message };
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const result = await signInWithEmail(email, password);
      if ("uid" in result) {
        try {
          // Create session after successful login
          const sessionResult = await createSession(result);
          if (!sessionResult.success) {
            console.error("Session creation failed:", sessionResult.error);
            return {
              success: false,
              error: "Failed to create session. Please try again.",
            };
          }
        } catch (sessionError: any) {
          console.error("Session error:", sessionError);
          return {
            success: false,
            error: sessionError.message || "Error creating session",
          };
        }

        return { success: true };
      } else {
        return { success: false, error: result.message };
      }
    } catch (error: any) {
      console.error("Login error:", error);
      return { success: false, error: error.message };
    }
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithGoogle();
      if ("uid" in result) {
        try {
          // Create session after successful Google login
          const sessionResult = await createSession(result);
          if (!sessionResult.success) {
            console.error("Session creation failed:", sessionResult.error);
            return {
              success: false,
              error: "Failed to create session. Please try again.",
            };
          }
        } catch (sessionError: any) {
          console.error("Session error:", sessionError);
          return {
            success: false,
            error: sessionError.message || "Error creating session",
          };
        }

        return { success: true };
      } else {
        return { success: false, error: result.message };
      }
    } catch (error: any) {
      console.error("Google login error:", error);
      return { success: false, error: error.message };
    }
  };
  const logout = async () => {
    try {
      // Update UI state immediately
      setUser(null);
      setIsAdmin(false);

      // First clear the session on the server
      await clearSession();

      // Then sign out from Firebase
      const result = await signOut();

      return result;
    } catch (error) {
      console.error("Error during logout:", error);
      return false;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signUp,
        login,
        loginWithGoogle,
        logout,
        isAdmin,
        verifySession,
        refreshUserSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
