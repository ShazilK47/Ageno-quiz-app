/* eslint-disable @typescript-eslint/no-explicit-any */
// lib/services/session.service.ts
import { User } from 'firebase/auth';

// Constants for storage
const USER_DATA_KEY = 'auth_user_data';
const AUTH_CHECK_KEY = 'auth_user';
const AUTH_TIMESTAMP_KEY = 'auth_timestamp';

// Store user data in localStorage for persistence
export const storeUserData = (user: User | null): void => {
  if (typeof window === 'undefined') return;
  
  try {
    if (!user) {
      localStorage.removeItem(USER_DATA_KEY);
      return;
    }
    
    // Extract only the essential fields to avoid storing sensitive data
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      role: (user as any).role || 'user',
      lastRefreshed: Date.now(),
    };
    
    localStorage.setItem(USER_DATA_KEY, JSON.stringify(userData));
    
    // Also set auth flag for quick auth checks
    localStorage.setItem(AUTH_CHECK_KEY, 'true');
    sessionStorage.setItem(AUTH_CHECK_KEY, 'true');
    localStorage.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.error('Failed to store user data:', error);
  }
};

// Retrieve stored user data
export const getStoredUserData = (): User | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const userDataString = localStorage.getItem(USER_DATA_KEY);
    if (!userDataString) return null;
    
    const userData = JSON.parse(userDataString);
    if (!userData || !userData.uid) return null;
    
    // Check if data is too old (more than 1 day)
    const lastRefreshed = userData.lastRefreshed || 0;
    if (Date.now() - lastRefreshed > 24 * 60 * 60 * 1000) {
      console.warn('Stored user data is too old, refreshing required');
    }
    
    return userData as User;
  } catch (error) {
    console.error('Failed to retrieve user data:', error);
    return null;
  }
};

// Clear all session data from storage
export const clearSessionData = (): void => {
  if (typeof window === 'undefined') return;
  
  try {
    // Clear localStorage
    localStorage.removeItem(USER_DATA_KEY);
    localStorage.removeItem(AUTH_CHECK_KEY);
    localStorage.removeItem(AUTH_TIMESTAMP_KEY);
    
    // Clear sessionStorage
    sessionStorage.removeItem(AUTH_CHECK_KEY);
    sessionStorage.removeItem('onSignInPage');
    sessionStorage.removeItem('onSignUpPage');
    sessionStorage.removeItem('justArrivedAtSignUp');
    sessionStorage.removeItem('user_initiated_logout');
    sessionStorage.removeItem('auth_check_failed');
  } catch (error) {
    console.error('Failed to clear session data:', error);
  }
};

// Check if user is authenticated from storage
export const checkStoredAuthentication = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  try {
    const userDataString = localStorage.getItem(USER_DATA_KEY);
    const authCheck = localStorage.getItem(AUTH_CHECK_KEY) || sessionStorage.getItem(AUTH_CHECK_KEY);
    
    return !!userDataString && !!authCheck;
  } catch (error) {
    console.error('Error checking authentication status:', error);
    return false;
  }
};
