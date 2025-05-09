"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to sign-in if not authenticated and not loading
    if (!loading && !user) {
      router.push("/sign-in");
    }
  }, [user, loading, router]);

  // Show nothing while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Only render the layout if user is authenticated
  if (!user) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen">
      {" "}
      <Header />
      <div className="container mx-auto px-4 py-8 flex-grow">{children}</div>
      <Footer />
    </div>
  );
}
