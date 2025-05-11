import React from "react";
import QuizScoreDistribution from "./QuizScoreDistribution";
import QuizTimeDistribution from "./QuizTimeDistribution";

export default function QuizReportsWithVisualizations() {
  return (
    <div>
      {/* Insert the visualization components just after the performance summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <QuizScoreDistribution attempts={filteredAttempts} />
        <QuizTimeDistribution attempts={filteredAttempts} />
      </div>
    </div>
  );
}
