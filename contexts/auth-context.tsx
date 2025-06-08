/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { User } from "firebase/auth";
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
import {
  storeAuthToken,
  getStoredAuthToken,
  clearAuthToken,
  storeUserData,
  getStoredUserData,
  clearSessionData,
  shouldRefreshToken,
  synchronizeAuthState,
  forceTokenRefresh,
} from "@/lib/services/session.service";

// Define a timeout for token refresh (15 minutes in ms but with jitter)
const TOKEN_REFRESH_BASE_INTERVAL = 15 * 60 * 1000;
// Add up to 2 minutes of jitter to prevent all clients refreshing simultaneously
const TOKEN_REFRESH_JITTER = 2 * 60 * 1000;

// Get a refresh interval with jitter
const getRefreshInterval = () => {
  return TOKEN_REFRESH_BASE_INTERVAL + Math.floor(Math.random() * TOKEN_REFRESH_JITTER);
};

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
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Create refs to track authentication processes and prevent multiple simultaneous calls
  const sessionCheckInProgressRef = useRef(false);
  const sessionCreationInProgressRef = useRef(false);

  // More robust session verification that returns server user data when available
  const verifySession = async (): Promise<boolean> => {
    if (sessionCheckInProgressRef.current) {
      console.log("Session check already in progress, skipping duplicate call");
      return !!user;
    }
    
    console.log("Starting verifySession function in auth context");
    sessionCheckInProgressRef.current = true;
    
    try {
      // Use the session.actions checkSession helper which already has proper error handling
      const sessionCheck = await checkSession();
      console.log("Session check result:", sessionCheck);

      const isAuthenticatedServer = sessionCheck.isAuthenticated === true;
      const isAuthenticatedClient = user !== null;
      const serverUserData = sessionCheck.user;

      // If server says authenticated but client doesn't have user, restore from server or localStorage
      if (isAuthenticatedServer && !isAuthenticatedClient) {
        if (serverUserData) {
          console.log("Server provided user data, updating local state");
          // Store user data from server
          storeUserData(serverUserData);
          // Use synchronizeAuthState to properly update client state
          await synchronizeAuthState(null);
          return true;
        }
        
        const storedUserData = getStoredUserData();
        if (storedUserData) {
          console.log("Restored user data from local storage based on valid server session");
          // We don't set user directly here - this will be handled by synchronizing auth state
          await synchronizeAuthState(null);
          return true;
        }
      }

      // If client thinks we're authenticated but server doesn't, clear client state
      if (!isAuthenticatedServer && isAuthenticatedClient) {
        console.log("Server reports not authenticated but client has user object. Clearing local state.");
        clearSessionData();
      }

      return isAuthenticatedServer;
    } catch (error) {
      console.error("Session verification error:", error);
      return false;
    } finally {
      // Always reset the in-progress flag when done
      sessionCheckInProgressRef.current = false;
    }
  };

  // Refresh the user session with improved error handling and retry
  const refreshUserSession = async (): Promise<boolean> => {
    if (!user) return false;

    console.log("Refreshing user session");
    try {
      // Use the improved forceTokenRefresh from our session service
      const tokenResult = await forceTokenRefresh(user);
      if (!tokenResult.success) {
        console.error("Failed to refresh token:", tokenResult.error);
        return false;
      }
      
      // Create a new session with the fresh token
      const result = await refreshSession(user);
      
      if (!result.success) {
        console.error("Failed to refresh session:", result.error);
        return false;
      }
      
      console.log("Session refreshed successfully");
      return true;
    } catch (error) {
      console.error("Error refreshing session:", error);
      return false;
    }
  };

  // Setup automatic token refresh with jitter to prevent all clients refreshing at once
  const setupTokenRefresh = (currentUser: User) => {
    // Clear any existing timer
    if (refreshTimerRef.current) {
      clearInterval(refreshTimerRef.current);
    }

    // Set up new refresh interval with jitter
    refreshTimerRef.current = setInterval(async () => {
      console.log("Automatic token refresh check");
      if (shouldRefreshToken()) {
        await refreshUserSession();
      }
    }, getRefreshInterval()); // Use jittered interval
  };
  // Add a timeout to prevent indefinite loading state
  useEffect(() => {
    // If loading persists for too long, force it to complete
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.log("Auth loading state timeout expired - forcing completion");
        setLoadingTimedOut(true);
        // Only set loading to false if we have some user data to show
        // or if we're confident there's no logged in user
        if (user || getStoredUserData() || sessionStorage.getItem('auth_check_failed')) {
          setLoading(false);
        }
      }
    }, 2000); // 2-second timeout
    
    return () => clearTimeout(loadingTimeout);
  }, [loading, user]);

  useEffect(() => {
    const initializeAuth = async () => {
      const startTime = performance.now();
      setLoading(true);
      console.log("Initializing auth context");

      // Restore user from localStorage if available first to prevent flash
      const storedUser = getStoredUserData();
      if (storedUser) {
        console.log("Restored user from localStorage");
        setUser(storedUser as UserWithRole);
        setIsAdmin((storedUser as UserWithRole).role === "admin");
      }

      // Check server-side session state early in case we need to sync
      try {
        const sessionResult = await checkSession();
        console.log("Initial session check:", sessionResult.isAuthenticated);
        
        // If server says we're authenticated but we don't have user data, restore from session
        if (sessionResult.isAuthenticated && sessionResult.user && !user) {
          console.log("Server reports authenticated session, updating user state");
          storeUserData(sessionResult.user);
          setUser(sessionResult.user as UserWithRole);
          setIsAdmin((sessionResult.user as UserWithRole).role === "admin");
          setLoading(false);
        }
        
        // If server says we're not authenticated, mark loading as done
        if (!sessionResult.isAuthenticated) {
          console.log("Server reports no valid session");
          sessionStorage.setItem('auth_check_failed', 'true');
        }
      } catch (error) {
        console.warn("Error during initial session check:", error);
        sessionStorage.setItem('auth_check_failed', 'true');
      }

      // Set up auth listener to track Firebase auth state changes
      const unsubscribe = onAuthChange(async (firebaseUser) => {
        console.log("Auth state changed:", Boolean(firebaseUser), 
          "Time since init:", Math.round(performance.now() - startTime), "ms");

        if (firebaseUser) {
          // User is signed in
          try {
            // Add role property to user object if it exists in claims
            const token = await firebaseUser.getIdTokenResult();
            const userWithRole = firebaseUser as UserWithRole;
            
            // Set role from token claims
            userWithRole.role = (token?.claims?.role as Role) || "user";
            setIsAdmin(userWithRole.role === "admin");
            
            // Store updated user data and token with our improved, atomic functions
            storeUserData(userWithRole);
            storeAuthToken(token.token, 3600); // 1 hour

            // Sync with server - check if session already exists before creating a new one
            const sessionCheck = await checkSession();
            
            if (!sessionCheck.isAuthenticated && !sessionCreationInProgressRef.current) {
              try {
                // Set flag to prevent duplicate calls
                sessionCreationInProgressRef.current = true;
                
                console.log("No valid session found, creating new session");
                const sessionResult = await createSession(firebaseUser);
                if (!sessionResult.success) {
                  console.error("Failed to create session:", sessionResult.error);
                } else {
                  console.log("Session created successfully");
                }
              } finally {
                // Reset flag regardless of outcome
                setTimeout(() => {
                  sessionCreationInProgressRef.current = false;
                }, 1000);
              }
            } else {
              console.log("Valid session already exists or creation in progress, skipping session creation");
            }

            setUser(userWithRole);
            setupTokenRefresh(firebaseUser);
          } catch (error) {
            console.error("Error processing authenticated user:", error);
            setLoading(false);
          }      } else {
        // Check if this is a genuine logout vs a development glitch
        const wasLoggedOut = typeof window !== 'undefined' && 
          sessionStorage.getItem('user_initiated_logout') === 'true';
        
        // Unexpected auth state change (not user initiated)
        if (!wasLoggedOut && user) {
          console.log("Detected unexpected auth state change to logged out, checking session first...");
          
          // Verify with server before assuming logout
          try {
            const sessionCheck = await checkSession();
            if (sessionCheck.isAuthenticated) {
              console.log("Server still has valid session, ignoring client-side logout signal");
              return; // Keep current user state
            }
          } catch (error) {
            console.error("Error checking session during logout verification:", error);
          }
        }
        
        // User is deliberately signed out or server confirms no session
        if (wasLoggedOut) {
          // First clear session on server to maintain consistency
          await clearSession(true).catch(err => console.warn("Error clearing session:", err));
        }

        // Then clear local state
        setUser(null);
          setIsAdmin(false);
          clearSessionData();
          
          // Clear refresh timer
          if (refreshTimerRef.current) {
            clearInterval(refreshTimerRef.current);
            refreshTimerRef.current = null;
          }
        }
        
        setLoading(false);
      });

      return unsubscribe;
    };

    initializeAuth();

    // Clean up function to clear interval and any pending timers
    return () => {
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
          // Get the ID token and store it
          const idToken = await result.getIdToken();
          storeAuthToken(idToken, 3600); // Store for 1 hour
          
          // Check if session creation is already in progress to prevent duplicates
          if (!sessionCreationInProgressRef.current) {
            // Set the flag to prevent parallel session creations
            sessionCreationInProgressRef.current = true;
            
            try {
              const sessionResult = await createSession(result);
              if (!sessionResult.success) {
                console.error("Session creation failed:", sessionResult.error);
                return {
                  success: false,
                  error: "Failed to create session. Please try again.",
                };
              }
            } finally {
              // Reset the flag with a small delay to prevent race conditions
              setTimeout(() => {
                sessionCreationInProgressRef.current = false;
              }, 1000);
            }
          } else {
            console.log("Session creation already in progress, skipping duplicate request");
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
          // Check if session creation is already in progress to prevent duplicates
          if (!sessionCreationInProgressRef.current) {
            // Set the flag to prevent parallel session creations
            sessionCreationInProgressRef.current = true;
            
            try {
              const sessionResult = await createSession(result);
              if (!sessionResult.success) {
                console.error("Session creation failed:", sessionResult.error);
                return {
                  success: false,
                  error: "Failed to create session. Please try again.",
                };
              }
            } finally {
              // Reset the flag with a small delay to prevent race conditions
              setTimeout(() => {
                sessionCreationInProgressRef.current = false;
              }, 1000);
            }
          } else {
            console.log("Session creation already in progress for Google login, skipping duplicate request");
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
  // User logs out
  const logout = async (): Promise<boolean> => {
    try {
      console.log("Starting logout process");

      // Set flag to indicate this is a user-initiated logout
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('user_initiated_logout', 'true');
      }
      
      // First clear session on server to maintain consistency
      await clearSession(true).catch((err) => console.warn("Error clearing session:", err));

      // Then sign out from Firebase client
      await signOut();
      
      // Clear local state
      setUser(null);
      setIsAdmin(false);
      
      // Clear any refresh timer
      if (refreshTimerRef.current) {
        clearInterval(refreshTimerRef.current);
        refreshTimerRef.current = null;
      }

      // Also clear client-side stored data
      clearSessionData();
      
      console.log("Logout completed successfully");
      return true;
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
