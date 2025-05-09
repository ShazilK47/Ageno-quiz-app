"use client";

import { useAuth } from "@/contexts/auth-context";
import { ReactNode } from "react";

interface AdminProtectedProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that only renders its children if the current user is an admin
 * Can provide optional fallback content to display for non-admin users
 */
export default function AdminProtected({
  children,
  fallback = null,
}: AdminProtectedProps) {
  const { isAdmin, loading } = useAuth();

  // Don't render anything while checking permissions
  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-purple-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Render children only if user is an admin, otherwise show fallback
  return isAdmin ? <>{children}</> : <>{fallback}</>;
}
