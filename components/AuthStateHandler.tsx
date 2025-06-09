"use client";

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { checkStoredAuthentication } from '@/lib/services/session.service';

interface AuthStateHandlerProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
  skipAuthCheck?: boolean;
  maxWaitTime?: number; // Maximum time to wait for auth before showing UI
}

/**
 * A component that handles authentication state and ensures consistent behavior across the app
 * - Shows children immediately if quick authentication checks pass
 * - Shows fallback while checking authentication
 * - Redirects to redirectTo path if not authenticated
 * - Has a timeout to prevent indefinite loading states
 */
export default function AuthStateHandler({
  children,
  fallback,
  redirectTo = '/sign-in',
  skipAuthCheck = false,
  maxWaitTime = 1000, // Default to 1 second max wait time
}: AuthStateHandlerProps) {
  const { user, loading, verifySession } = useAuth();
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

    // Try quick auth check from storage first
    if (checkStoredAuthentication()) {
      setIsAuthenticated(true);
      return;
    }

    // If we have a user already, set as authenticated
    if (user) {
      setIsAuthenticated(true);
      return;
    }    // Start a timeout to prevent indefinite loading
    authTimeoutRef.current = setTimeout(() => {
      if (mountedRef.current) {
        // If we're still waiting after timeout, verify with server
        verifySession().then(isValid => {
          if (mountedRef.current) {
            if (isValid) {
              setIsAuthenticated(true);
            } else {
              // If server says we're not authenticated, handle token revocation case
              setIsAuthenticated(false);
              
              // Clear any local storage data that might be outdated
              if (typeof window !== 'undefined') {
                try {
                  localStorage.removeItem('auth_user');
                  sessionStorage.removeItem('auth_user');
                } catch (e) {
                  console.error("Failed to clear local auth state", e);
                }
              }
            }
            setTimeoutExpired(true);
          }
        }).catch((err) => {
          console.warn("Session verification error:", err);
          if (mountedRef.current) {
            // On error, assume not authenticated
            setIsAuthenticated(false);
            setTimeoutExpired(true);
          }
        });
      }
    }, maxWaitTime);

    // Cleanup timeout and mounted flag
    return () => {
      mountedRef.current = false;
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
        authTimeoutRef.current = null;
      }
    };
  }, [maxWaitTime, skipAuthCheck, user, verifySession]);

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
        setIsAuthenticated(true);      } else {
        setIsAuthenticated(false);
        // Only redirect if not on an auth-related page already
        const isAuthPath = window.location.pathname.includes('/sign-in') ||
                          window.location.pathname.includes('/sign-up') ||
                          window.location.pathname.includes('/reset-password');
                          
        if (!isAuthPath) {
          router.push(redirectTo);
        }
      }
    }
  }, [user, loading, router, redirectTo, skipAuthCheck]);
  
  // Determine what to render based on auth state
  
  // Option 1: Skip auth check
  if (skipAuthCheck) {
    return <>{children}</>;
  }
  
  // Option 2: Authenticated, show content
  if (isAuthenticated === true || (timeoutExpired && user)) {
    return <>{children}</>;
  }
  
  // Option 3: Still checking auth state, show loading
  if ((loading && !timeoutExpired) || isAuthenticated === null) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    // Default loading indicator
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mr-2"></div>
        <span className="text-blue-500 text-sm">Verifying authentication...</span>
      </div>
    );
  }
  
  // Option 4: Not authenticated, don't render protected content
  return null;
}
