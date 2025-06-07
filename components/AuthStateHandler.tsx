/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';

interface AuthStateHandlerProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  skipAuthCheck?: boolean;
  maxWaitTime?: number; // New prop to customize max wait time
}

/**
 * A component that handles auth state and ensures consistent behavior across the app
 * - Shows children immediately if quick auth checks pass
 * - Shows fallback while checking auth
 * - Redirects to redirectTo if not authenticated
 * - Has a timeout to prevent infinite loading states
 */
export default function AuthStateHandler({
  children,
  fallback,
  redirectTo = '/sign-in',
  skipAuthCheck = false,
  maxWaitTime = 1500 // Default to 1.5 seconds max wait time
}: AuthStateHandlerProps) {
  const { user, loading } = useAuth();
  // State to track if auth was validated through quick methods
  const [quickChecked, setQuickChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [timeoutExpired, setTimeoutExpired] = useState(false);
  const router = useRouter();
  const authTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(false);

  // Quick check for auth using reliable storage methods
  useEffect(() => {
    // Skip everything if skipAuthCheck is true
    if (skipAuthCheck) {
      return;
    }
    
    mountedRef.current = true;

    // First check session storage (fastest)
    try {
      const cachedUser = sessionStorage.getItem('auth_user');
      if (cachedUser) {
        console.log("AuthStateHandler: Using cached auth user");
        setIsAuthenticated(true);
        setQuickChecked(true);
        return;
      }
    } catch (e) {
      console.error("AuthStateHandler: Error checking storage:", e);
    }
    
    // Start a timeout to prevent indefinite loading
    authTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        console.log("AuthStateHandler: Max wait time exceeded, showing content");
        setTimeoutExpired(true);
        // If we have user data, consider authenticated regardless of loading state
        if (user) {
          setIsAuthenticated(true);
          setQuickChecked(true);
        }
      }
    }, maxWaitTime);

    // Cleanup timeout and mounted flag
    return () => {
      mountedRef.current = false;
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
      }
    };
  }, [maxWaitTime, skipAuthCheck, user]);

  // Primary auth check using useAuth
  useEffect(() => {
    if (skipAuthCheck) return;
    
    if (!loading) {
      // Clear timeout since we got a definitive answer
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
        authTimeoutRef.current = null;
      }
      
      if (user) {
        console.log("AuthStateHandler: User authenticated via context");
        setIsAuthenticated(true);
        setQuickChecked(true);
        
        // Cache the user state for future quick checks
        try {
          sessionStorage.setItem('auth_user', 'true');
        } catch (e) {
          console.error("Error saving to session storage:", e);
        }
      } else {
        console.log("AuthStateHandler: User not authenticated, redirecting");
        setIsAuthenticated(false);
        router.push(redirectTo);
      }
    }
  }, [user, loading, router, redirectTo, skipAuthCheck]);  // Show children immediately if authenticated, or if timeout expired and we have user data
  // This prevents indefinite loading states when auth checks are slow
  if (isAuthenticated === true || (timeoutExpired && user)) {
    return <>{children}</>;
  }
  
  // Show fallback while checking authentication, but only if timeout hasn't expired
  if ((loading && !timeoutExpired) || isAuthenticated === null) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    // Default fallback with shorter message
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mr-3"></div>
        <p className="text-blue-500">Checking authentication...</p>
      </div>
    );
  }

  // Skip auth check if specified
  if (skipAuthCheck) {
    return <>{children}</>;
  }
  
  // Don't render anything if not authenticated
  return null;
}
