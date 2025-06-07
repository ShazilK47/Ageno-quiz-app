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
  maxWaitTime?: number; // Customize max wait time
  bypassOnMobile?: boolean; // Option to bypass strict auth checks on mobile
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
  maxWaitTime = 1500, // Default to 1.5 seconds max wait time
  bypassOnMobile = false // Option to bypass strict auth checks on mobile
}: AuthStateHandlerProps) {
  const { user, loading } = useAuth();
  // State to track if auth was validated through quick methods
  const [quickChecked, setQuickChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [timeoutExpired, setTimeoutExpired] = useState(false);
  const [isMobileBrowser, setIsMobileBrowser] = useState(false);
  const router = useRouter();
  const authTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(false);
  // Check if user is on a mobile browser
  useEffect(() => {
    // Simple mobile browser detection
    const checkMobileBrowser = () => {
      if (typeof window === 'undefined') return false;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
      const result = mobileRegex.test(userAgent);
      
      console.log("AuthStateHandler: Mobile browser detection:", result);
      return result;
    };
    
    setIsMobileBrowser(checkMobileBrowser());
  }, []);

  // Quick check for auth using reliable storage methods
  useEffect(() => {
    // Skip everything if skipAuthCheck is true
    if (skipAuthCheck) {
      return;
    }
    
    mountedRef.current = true;

    // Use a shorter timeout for mobile browsers
    const timeoutDuration = isMobileBrowser ? Math.min(maxWaitTime, 800) : maxWaitTime;
    console.log(`AuthStateHandler: Using timeout of ${timeoutDuration}ms for ${isMobileBrowser ? 'mobile' : 'desktop'}`);

    // First check session storage (fastest)
    try {
      const cachedUser = sessionStorage.getItem('auth_user');
      if (cachedUser) {
        console.log("AuthStateHandler: Using cached auth user");
        setIsAuthenticated(true);
        setQuickChecked(true);
        return;
      }

      // Also try localStorage as a backup in case sessionStorage isn't working on this browser
      const localUser = localStorage.getItem('auth_user');
      if (localUser) {
        console.log("AuthStateHandler: Using auth user from localStorage");
        setIsAuthenticated(true);
        setQuickChecked(true);
        return;
      }
    } catch (e) {
      console.error("AuthStateHandler: Error checking storage:", e);
    }    // Start a timeout to prevent indefinite loading
    authTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        console.log("AuthStateHandler: Max wait time exceeded, showing content");
        setTimeoutExpired(true);
        
        // If we have user data, consider authenticated regardless of loading state
        if (user) {
          setIsAuthenticated(true);
          setQuickChecked(true);
          // Cache auth state when timeout expires with user
          try {
            sessionStorage.setItem('auth_user', 'true');
            localStorage.setItem('auth_user', 'true'); // Backup in localStorage
          } catch (e) {
            console.error("Error caching auth state:", e);
          }
        } 
        // Special handling for mobile - optionally bypass strict auth on timeout
        else if (isMobileBrowser && bypassOnMobile) {
          console.log("AuthStateHandler: Bypassing auth check on mobile");
          setIsAuthenticated(true);
          setQuickChecked(true);
        }
      }
    }, isMobileBrowser ? Math.min(maxWaitTime, 800) : maxWaitTime);

    // Cleanup timeout and mounted flag
    return () => {
      mountedRef.current = false;
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
      }
    };
  }, [maxWaitTime, skipAuthCheck, user, isMobileBrowser, bypassOnMobile]);

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
        
        // Cache the user state for future quick checks in both storage types for resilience
        try {
          sessionStorage.setItem('auth_user', 'true');
          localStorage.setItem('auth_user', 'true');
          localStorage.setItem('auth_timestamp', Date.now().toString());
        } catch (e) {
          console.error("Error saving to storage:", e);
        }
      } else {
        // Mobile browsers with auth bypass enabled should not redirect
        if (isMobileBrowser && bypassOnMobile) {
          console.log("AuthStateHandler: Skip redirect for mobile with bypass enabled");
          setIsAuthenticated(true); // Show content even without auth on mobile
          setQuickChecked(true);
        } else {
          console.log("AuthStateHandler: User not authenticated, redirecting");
          setIsAuthenticated(false);
          router.push(redirectTo);
        }
      }
    }
  }, [user, loading, router, redirectTo, skipAuthCheck]);  // Special mobile optimization - show content immediately on mobile with bypass enabled
  if (isMobileBrowser && bypassOnMobile) {
    console.log("AuthStateHandler: Immediately showing content for mobile with bypass");
    return <>{children}</>;
  }
  
  // Show children immediately if authenticated, or if timeout expired and we have user data
  if (isAuthenticated === true || (timeoutExpired && user)) {
    return <>{children}</>;
  }
  
  // Show loading but with a shorter timeout on mobile
  if ((loading && !timeoutExpired) || isAuthenticated === null) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    // Default fallback with simpler message for mobile
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mr-3"></div>
        <p className="text-blue-500">
          {isMobileBrowser ? "Loading..." : "Checking authentication..."}
        </p>
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
