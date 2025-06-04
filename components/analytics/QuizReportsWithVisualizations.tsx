import React from "react";
import QuizScoreDistribution from "./QuizScoreDistribution";
import QuizTimeDistribution from "./QuizTimeDistribution";
import { QuizResponse } from "@/types/quiz";

interface QuizReportsWithVisualizationsProps {
  responses: QuizResponse[];
}

export default function QuizReportsWithVisualizations({
  responses,
}: QuizReportsWithVisualizationsProps) {
  return (
    <div>
      {/* Insert the visualization components just after the performance summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <QuizScoreDistribution responses={responses} />
        <QuizTimeDistribution responses={responses} />
      </div>
    </div>
  );
}
