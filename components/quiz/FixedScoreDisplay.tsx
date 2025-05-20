// This is a clean fixed version with proper JSX of the score display
// Replace the problematic JSX for showing the score:

import React from "react";

export function FixedScoreDisplay({
  displayScore,
  lastCalculatedScoreRef,
}: {
  displayScore: number | null;
  lastCalculatedScoreRef: React.MutableRefObject<number | null>;
}) {
  // Helper function for score calculation with clear prioritization logic
  const getScore = () => {
    // First priority: Use displayScore if it's valid (not null)
    // This assumes the displayScore has already been updated with the backend score
    if (displayScore !== null) {
      return `${displayScore}%`;
    }

    // Second priority: Fall back to the reference value or 0 as last resort
    // This reference should have the backend score if available
    return `${lastCalculatedScoreRef.current || 0}%`;
  };

  return (
    <div
      className="text-6xl font-bold text-indigo-600 mb-2"
      data-testid="quiz-score"
    >
      {getScore()}
    </div>
  );
}
