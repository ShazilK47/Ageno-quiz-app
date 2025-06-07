/**
 * Enhanced component to handle display of correct answer counts in quiz results.
 * Includes additional validation and fallbacks for consistent display.
 */
import React, { useState, useEffect } from "react";

export function CorrectAnswersDisplay({
  correctAnswersCount,
  totalQuestions,
}: {
  correctAnswersCount: number;
  totalQuestions: number;
}) {
  const [displayText, setDisplayText] = useState<string>("");
  
  // Validate and ensure consistent display
  useEffect(() => {
    // Handle invalid inputs
    if (
      typeof correctAnswersCount !== "number" || 
      typeof totalQuestions !== "number" ||
      isNaN(correctAnswersCount) || 
      isNaN(totalQuestions) ||
      totalQuestions <= 0
    ) {
      setDisplayText("Quiz completed successfully!");
      return;
    }
    
    // Ensure correctAnswersCount is not greater than totalQuestions
    const validatedCorrectCount = Math.min(correctAnswersCount, totalQuestions);
    
    // Format the display text
    setDisplayText(`You answered ${validatedCorrectCount} out of ${totalQuestions} questions correctly`);
  }, [correctAnswersCount, totalQuestions]);
  
  return (
    <p className="text-gray-600">
      {displayText}
    </p>
  );
}
