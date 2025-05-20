// Component to correctly handle answer count display
import React from "react";

export function CorrectAnswersDisplay({
  correctAnswersCount,
  totalQuestions,
}: {
  correctAnswersCount: number;
  totalQuestions: number;
}) {
  // Simple component that displays the provided count of correct answers
  return (
    <p className="text-gray-600">
      You answered {correctAnswersCount} out of {totalQuestions} questions
      correctly
    </p>
  );
}
