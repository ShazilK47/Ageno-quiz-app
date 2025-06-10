/* eslint-disable react-hooks/exhaustive-deps */
/**
 * Enhanced component to display quiz scores with multiple fallback mechanisms.
 * This version uses a more robust algorithm to ensure the score is always displayed,
 * even in the face of state inconsistencies or race conditions during score calculation.
 */

import React, { useState, useEffect, useRef } from "react";

export function FixedScoreDisplay({
  displayScore,
  lastCalculatedScoreRef,
}: {
  displayScore: number | null;
  lastCalculatedScoreRef: React.MutableRefObject<number | null>;
}) {
  const [stableScore, setStableScore] = useState<string | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const scoreCheckAttemptsRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);
  
  // FIXED: Simplified score determination to prevent re-render loops
  useEffect(() => {
    // Clear any existing timer when dependencies change to avoid stale updates
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    
    // Determine the final score value - avoid multiple setState calls in a single effect
    let finalScore: string | null = null;
    let shouldBeCalculating = false;
    
    // Decision tree for score determination (only one outcome)
    if (displayScore !== null && displayScore >= 0) {
      // First priority: Use displayScore if it's valid (including zero)
      console.log("FixedScoreDisplay: Using display score:", displayScore);
      finalScore = `${displayScore}%`;
      shouldBeCalculating = false;
    } else if (lastCalculatedScoreRef.current !== null && lastCalculatedScoreRef.current >= 0) {
      // Second priority: Use ref score if available (including zero)
      console.log("FixedScoreDisplay: Using ref score:", lastCalculatedScoreRef.current);
      finalScore = `${lastCalculatedScoreRef.current}%`;
      shouldBeCalculating = false;
    } else {
      // Third case: Still calculating
      console.log("FixedScoreDisplay: No stable score yet, showing Calculating...");
      finalScore = 'Calculating...';
      shouldBeCalculating = true;
      
      // Only set up polling if we're still calculating and haven't exceeded max attempts
      if (scoreCheckAttemptsRef.current < 5) { // Maximum of 5 attempts
        scoreCheckAttemptsRef.current += 1;
        
        // Set up a single non-recursive timeout for the next check
        timerRef.current = setTimeout(() => {
          console.log(`FixedScoreDisplay: Retry check ${scoreCheckAttemptsRef.current}/5`);
          
          // Check if score has been updated in ref during the wait
          const currentRefScore = lastCalculatedScoreRef.current;
          if (currentRefScore !== null && currentRefScore >= 0) {
            console.log("FixedScoreDisplay: Found score in ref during retry:", currentRefScore);
            setStableScore(`${currentRefScore}%`);
            setIsCalculating(false);
          } else if (scoreCheckAttemptsRef.current >= 5) {
            // After max retries, default to 0%
            console.log("FixedScoreDisplay: Max retries reached, using 0%");
            setStableScore('0%');
            setIsCalculating(false);
          }
        }, 500);
      }
    }
    
    // CRITICAL FIX: Only update state if we have a new value that's different
    // This prevents infinite re-render loops when dealing with zero scores
    if (finalScore !== null && finalScore !== stableScore) {
      setStableScore(finalScore);
    }
    
    // Separate state update for calculating flag to prevent coupling
    if (shouldBeCalculating !== isCalculating) {
      setIsCalculating(shouldBeCalculating);
    }
  }, [displayScore, lastCalculatedScoreRef]);
  
  // Ensure animation while calculating
  if (isCalculating) {
    return (
      <div className="text-6xl font-bold text-indigo-600 mb-2 animate-pulse" data-testid="quiz-score">
        {stableScore}
      </div>
    );
  }

  return (
    <div
      className="text-6xl font-bold text-indigo-600 mb-2"
      data-testid="quiz-score"
    >
      {stableScore || '0%'}
    </div>
  );
}
