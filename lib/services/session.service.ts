// lib/services/session.service.ts
import { User } from 'firebase/auth';

// Constants for storage
const SESSION_TOKEN_KEY = 'auth_session_token';
const USER_DATA_KEY = 'auth_user_data';
const TOKEN_EXPIRY_KEY = 'auth_token_expiry';
// Increase refresh threshold to 15 minutes to reduce chance of session issues
const TOKEN_REFRESH_THRESHOLD = 15 * 60 * 1000; // 15 minutes in milliseconds
const SESSION_OPERATION_LOCK = 'session_operation_lock';

export interface StoredSession {
  token: string;
  expiresAt: number; // timestamp in ms
  userId: string;
}

/**
 * Helper to prevent multiple simultaneous session operations
 * Uses a locking mechanism with timeout and retry to ensure operations happen sequentially
 */
export const withSessionLock = async <T>(operation: () => Promise<T>, retryCount = 3): Promise<T> => {
  if (typeof window === 'undefined') return operation();
  
  // Generate a unique lock ID
  const lockId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const existingLock = sessionStorage.getItem(SESSION_OPERATION_LOCK);
  
  // If there's an existing lock that's less than 10 seconds old, wait and retry
  if (existingLock) {
    const [timestamp] = existingLock.split(':');
    const lockTime = parseInt(timestamp, 10);
    
    // If lock is too old (more than 10 seconds), override it
    if (Date.now() - lockTime > 10000) {
      console.warn('Clearing stale session lock');
      sessionStorage.removeItem(SESSION_OPERATION_LOCK);
    } else {
      // Still locked, wait and retry if we have retries left
      if (retryCount > 0) {
        await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));
        return withSessionLock(operation, retryCount - 1);
      } else {
        console.warn('Session operation lock timeout, forcing execution');
        // Force execution after max retries
      }
    }
  }
  
  // Set the lock with our ID
  sessionStorage.setItem(SESSION_OPERATION_LOCK, `${Date.now()}:${lockId}`);
  
  try {
    return await operation();
  } finally {
    // Only clear if it's still our lock
    const currentLock = sessionStorage.getItem(SESSION_OPERATION_LOCK);
    if (currentLock && currentLock.includes(lockId)) {
      sessionStorage.removeItem(SESSION_OPERATION_LOCK);
    }
  }
};

/**
 * Store auth token with expiration in localStorage
 */
export const storeAuthToken = (token: string, expiresIn: number = 3600): void => {
  if (typeof window === 'undefined') return;
  
  try {
    const expiresAt = Date.now() + expiresIn * 1000;
    localStorage.setItem(SESSION_TOKEN_KEY, token);
    localStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt.toString());
  } catch (error) {
    console.error('Failed to store auth token:', error);
  }
};

/**
 * Get stored auth token and check if it's valid
 */
export const getStoredAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const token = localStorage.getItem(SESSION_TOKEN_KEY);
    const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);
    
    if (!token || !expiryStr) return null;
    
    const expiry = parseInt(expiryStr, 10);
    
    // Check if token is expired
    if (Date.now() > expiry) {
      clearAuthToken();
      return null;
    }
    
    return token;
  } catch (error) {
    console.error('Failed to retrieve auth token:', error);
    return null;
  }
};

/**
 * Clear stored auth token and related data
 */
export const clearAuthToken = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  } catch (error) {
    console.error('Failed to clear auth token:', error);
  }
};

/**
 * Store user data in localStorage with improved error handling
 */
export const storeUserData = (user: User | null): void => {
  if (typeof window === 'undefined') return;
  
  try {
    if (user) {
      // Store minimal user data to avoid circular reference issues
      // Include role if it exists in the user object
      const userData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        emailVerified: user.emailVerified,
        // Include role if it exists on user or default to 'user'
        role: ((user as { role?: string }).role) || 'user',
        // Add last update timestamp to track data freshness
        lastUpdated: Date.now()
      };
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    } else {
      localStorage.removeItem(USER_DATA_KEY);
    }
  } catch (error) {
    console.error('Failed to store user data:', error);
  }
};

/**
 * User data structure with defined types
 */
export interface StoredUserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  role?: string;
  lastUpdated?: number;
}

/**
 * Get stored user data with proper typing
 */
export const getStoredUserData = (): StoredUserData | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const userDataStr = localStorage.getItem(USER_DATA_KEY);
    if (!userDataStr) return null;
    
    const userData = JSON.parse(userDataStr) as StoredUserData;
    
    // Validate required fields to ensure data structure is correct
    if (!userData.uid) {
      console.warn('Retrieved user data is missing UID');
      return null;
    }
    
    return userData;
  } catch (error) {
    console.error('Failed to retrieve user data:', error);
    return null;
  }
};

/**
 * Clear all session data
 */
export const clearSessionData = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    // Clear localStorage
    localStorage.removeItem(SESSION_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    
    // Also clear session flags that might be stored in sessionStorage
    sessionStorage.removeItem('onSignInPage');
    sessionStorage.removeItem('onSignUpPage');
    sessionStorage.removeItem('justArrivedAtSignUp');
  } catch (error) {
    console.error('Failed to clear session data:', error);
  }
};

/**
 * Check if token needs refresh with debounce protection
 */
export const shouldRefreshToken = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    const expiryStr = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiryStr) return true;
    
    const expiry = parseInt(expiryStr, 10);
    
    // Add a small random offset to prevent all clients refreshing simultaneously
    const randomOffset = Math.floor(Math.random() * 60000); // Up to 1 minute
    return Date.now() > (expiry - TOKEN_REFRESH_THRESHOLD - randomOffset);
  } catch (error) {
    console.error('Failed to check token expiry:', error);
    return true;
  }
};

/**
 * API helpers for session management
 */

/**
 * Server user data structure with defined types
 */
export interface ServerUserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  role: string;
  lastLoginAt?: unknown;
  createdAt?: unknown;
}

/**
 * Create a session on the server using Firebase ID token with error handling
 */
export const createServerSession = async (idToken: string): Promise<{
  success: boolean;
  error?: string;
  userId?: string;
  role?: string;
}> => {
  try {
    // Add timeout for network requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch('/api/auth/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      credentials: 'include',
      body: JSON.stringify({ idToken }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      console.error('Failed to create server session:', data);
      return { 
        success: false, 
        error: data.error || `Server error: ${response.status}` 
      };
    }
    
    return { 
      success: true,
      userId: data.uid,
      role: data.role
    };
  } catch (error) {
    // Handle abort error separately
    if (error instanceof DOMException && error.name === 'AbortError') {
      console.error('Session creation timed out');
      return { success: false, error: 'Network timeout' };
    }
    
    console.error('Error creating server session:', error);
    return { success: false, error: 'Network error' };
  }
};

/**
 * Verify the current session on the server with improved error handling
 */
export const verifyServerSession = async (): Promise<{
  isAuthenticated: boolean;
  user?: ServerUserData;
  error?: string;
}> => {
  try {
    // Add AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch('/api/auth/session/check', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    // Try to parse response even if not ok
    const data = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      if (response.status === 401) {
        return { 
          isAuthenticated: false, 
          error: data.reason || 'Unauthorized'
        };
      }
      return { 
        isAuthenticated: false, 
        error: data.error || `Session check failed: ${response.status}`
      };
    }
    
    return {
      isAuthenticated: data.isAuthenticated,
      user: data.user as ServerUserData,
    };
  } catch (error) {
    // Handle abort error separately
    if (error instanceof DOMException && error.name === 'AbortError') {
      return { isAuthenticated: false, error: 'Network timeout' };
    }
    
    console.error('Error verifying server session:', error);
    return { isAuthenticated: false, error: 'Network error' };
  }
};

/**
 * Clear the session on the server with improved reliability
 */
export const clearServerSession = async (): Promise<{
  success: boolean;
  error?: string;
}> => {
  try {
    // Add timeout for network requests
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    await fetch('/api/auth/session', {
      method: 'DELETE',
      credentials: 'include',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    // Still consider it a success even if the server responds with an error
    // as long as we made the request - the important thing is to clear client side
    return { success: true };
  } catch (error) {
    // Even if network fails, we still cleared client-side
    console.error('Error clearing server session:', error);
    return { success: true, error: 'Network error, but client-side cleared' };
  }
};

/**
 * Synchronize client and server auth state
 * Returns the result of the synchronization
 */
export const synchronizeAuthState = async (
  firebaseUser: User | null
): Promise<{
  inSync: boolean;
  isAuthenticated: boolean;
  error?: string;
  action?: 'none' | 'client-updated' | 'server-updated';
}> => {
  try {
    const isClientAuthed = !!firebaseUser;
    const serverSession = await verifyServerSession();
    const isServerAuthed = serverSession.isAuthenticated;
    
    // If they match, we're good
    if (isClientAuthed === isServerAuthed) {
      return {
        inSync: true,
        isAuthenticated: isClientAuthed,
        action: 'none',
      };
    }
    
    // If client thinks we're authenticated but server doesn't
    if (isClientAuthed && !isServerAuthed) {
      // Try to recreate the server session
      if (firebaseUser) {
        const idToken = await firebaseUser.getIdToken(true);
        const sessionResult = await createServerSession(idToken);
        
        if (sessionResult.success) {
          return {
            inSync: true,
            isAuthenticated: true,
            action: 'server-updated',
          };
        } else {
          // Failed to update server, clear client
          clearSessionData();
          return {
            inSync: true, // Now in sync because we cleared client
            isAuthenticated: false,
            error: 'Failed to create server session',
            action: 'client-updated',
          };
        }
      }
    }
    
    // If server thinks we're authenticated but client doesn't
    if (!isClientAuthed && isServerAuthed) {
      // Server thinks user is authenticated but client doesn't
      // Just clear the server session to match client
      await clearServerSession();
      return {
        inSync: true,
        isAuthenticated: false,
        action: 'server-updated',
      };
    }
    
    // Shouldn't reach here, but just in case
    return {
      inSync: false,
      isAuthenticated: isClientAuthed,
      error: 'Unexpected state',
      action: 'none',
    };
  } catch (error) {
    console.error('Error synchronizing auth state:', error);
    return {
      inSync: false,
      isAuthenticated: !!firebaseUser,
      error: 'Synchronization error',
      action: 'none',
    };
  }
};

/**
 * Force a refresh of the Firebase token and update server session with retry capability
 */
export const forceTokenRefresh = async (user: User, retries = 1): Promise<{
  success: boolean;
  error?: string;
  idToken?: string;
}> => {
  if (!user) return { success: false, error: 'No user provided' };
  
  // Use session lock to prevent multiple simultaneous token refreshes
  return withSessionLock(async () => {
    try {
      // Force refresh the token
      let idToken;
      try {
        idToken = await user.getIdToken(true);
      } catch (tokenError) {
        console.error('Failed to refresh Firebase token:', tokenError);
        return { 
          success: false, 
          error: tokenError instanceof Error ? tokenError.message : 'Failed to refresh token' 
        };
      }
      
      // Store locally first
      storeAuthToken(idToken, 3600); // 1 hour
      
      // Update server session
      const serverResult = await createServerSession(idToken);
      
      if (!serverResult.success && retries > 0) {
        console.log(`Token refresh retry (${retries} attempts left)...`);
        // Small delay before retry
        await new Promise(resolve => setTimeout(resolve, 500));
        return forceTokenRefresh(user, retries - 1);
      }
      
      return {
        success: serverResult.success,
        error: serverResult.error,
        idToken: serverResult.success ? idToken : undefined
      };
    } catch (error) {
      console.error('Token refresh error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });
};

/**
 * Get the user's role from server if available, otherwise from client
 */
export const getUserRole = async (user: User | null): Promise<string> => {
  if (!user) return 'guest';
  
  try {
    // First try to get role from server session
    const serverSession = await verifyServerSession();
    if (serverSession.isAuthenticated && serverSession.user?.role) {
      return serverSession.user.role;
    }
    
    // Next try to get from ID token
    try {
      const idTokenResult = await user.getIdTokenResult();
      const claimsRole = idTokenResult.claims?.role as string | undefined;
      if (claimsRole) return claimsRole;
    } catch (error) {
      console.warn('Failed to get role from token:', error);
    }
    
    // Fall back to client-side role
    const userData = getStoredUserData();
    if (userData?.role) return userData.role;
    
    return 'user';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'user';
  }
};
