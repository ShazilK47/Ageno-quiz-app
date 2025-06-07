"use client"; 

import React, { useEffect, useState } from "react";

export default function QuizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Add mobile optimizations at the layout level
  // Track loading state (used for debugging)
  const [isLoaded, setIsLoaded] = useState(false); // eslint-disable-line @typescript-eslint/no-unused-vars
  
  useEffect(() => {
    // Mark as loaded to prevent flicker
    setIsLoaded(true);
    
    // Register mobile browser status if known
    if (typeof window !== 'undefined') {
      try {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        console.log(`QuizLayout: Mobile browser: ${isMobile}`);
      } catch (e) {
        console.error('Error in quiz layout mobile detection:', e);
      }
    }
  }, []);

  // Return immediate content without delay
  return <>{children}</>;
}
