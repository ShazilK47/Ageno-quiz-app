"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

interface AuthStatusProps {
  className?: string;
}

/**
 * Example component demonstrating the usage of the new useAuth hook
 */
export default function AuthStatus({ className = "" }: AuthStatusProps) {
  const { user, loading, isAdmin, session, login, logout } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setError("");

    const result = await login(email, password);

    if (result.error) {
      setError(result.error.message);
    } else {
      // Clear form after successful login
      setEmail("");
      setPassword("");
    }

    setIsLoggingIn(false);
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    const result = await logout();

    if (result.error) {
      setError(result.error.message);
    }

    setIsLoggingOut(false);
  };

  // Show loading state while initial authentication state is being determined
  if (loading) {
    return (
      <div className={`p-4 border rounded-md bg-gray-50 ${className}`}>
        <p className="text-gray-600 text-center">Checking authentication...</p>
        <div className="flex justify-center mt-2">
          <div className="animate-spin h-6 w-6 border-2 border-accent-primary border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 border rounded-md bg-white ${className}`}>
      {user ? (
        <div className="space-y-3">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-lg">
                Welcome, {user.displayName || user.email}
              </h3>
              <p className="text-sm text-gray-600">
                {user.email}{" "}
                {isAdmin && (
                  <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                    Admin
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Email verified: {user.emailVerified ? "✅" : "❌"}
              </p>
            </div>
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="px-3 py-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 text-sm transition disabled:opacity-50"
            >
              {isLoggingOut ? "Signing out..." : "Sign Out"}
            </button>
          </div>

          <div className="text-sm text-gray-600 border-t pt-2 mt-2">
            <div className="font-medium mb-1">Session Status:</div>
            <div className="text-xs space-y-1">
              <p>
                Server authenticated: {session.isAuthenticated ? "✅" : "❌"}
                <button
                  onClick={() => session.revalidate()}
                  className="ml-2 text-blue-500 hover:underline"
                >
                  Refresh
                </button>
              </p>
              {session.loading && <p>Refreshing session...</p>}
              {session.error && (
                <p className="text-red-500">Error: {session.error.message}</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <h3 className="font-medium text-lg mb-3">Please Sign In</h3>
          {error && <p className="text-sm text-red-500 mb-2">{error}</p>}

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label htmlFor="email" className="block text-sm mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-accent-primary"
                placeholder="••••••••"
                required
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full px-4 py-2 bg-accent-primary text-white rounded-md hover:bg-accent-primary/90 text-sm transition disabled:opacity-50"
              >
                {isLoggingIn ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Signing In...
                  </span>
                ) : (
                  "Sign In"
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
