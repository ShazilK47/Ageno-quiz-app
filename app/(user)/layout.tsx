"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [isMobileBrowser, setIsMobileBrowser] = useState(false);

  // Detect mobile browsers
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      setIsMobileBrowser(isMobile);
      
      // Use a shorter timeout for mobile browsers
      const timeoutDuration = isMobile ? 1000 : 2000;
      
      const timeout = setTimeout(() => {
        console.log(`UserLayout: Loading timeout (${timeoutDuration}ms) expired`);
        setLoadingTimeout(true);
      }, timeoutDuration);
      
      return () => clearTimeout(timeout);
    }
  }, []);

  // Redirect if not authenticated and loading is complete
  useEffect(() => {
    if (!loading && !user) {
      router.push("/sign-in");
    }
  }, [user, loading, router]);

  // Show content if:
  // 1. User is authenticated, OR
  // 2. Loading timeout expired (prevent indefinite spinner), OR
  // 3. On mobile browsers we're more lenient (to avoid stuck states)
  if (user || loadingTimeout || isMobileBrowser) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <div className="container mx-auto px-4 py-8 flex-grow">{children}</div>
        <Footer />
      </div>
    );
  }

  // Show loading state only if we haven't exceeded the timeout
  if (loading && !loadingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mr-3"></div>
        <p className="text-blue-500">Loading...</p>
      </div>
    );
  }

  // Default case: don't render anything
  return null;
}
