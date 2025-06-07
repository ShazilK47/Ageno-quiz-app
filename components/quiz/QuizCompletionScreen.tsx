import React from "react";
import { useRouter } from "next/navigation";
import { CorrectAnswersDisplay } from "./CorrectAnswersDisplay";
import { Quiz } from "@/firebase/firestore";
import confetti from 'canvas-confetti';

interface QuizCompletionScreenProps {
  quiz: Quiz;
  selectedDifficulty: string;
  displayScore: number | null;
  lastCalculatedScoreRef: React.MutableRefObject<number | null>;
  correctAnswersCount: number;
  responseId: string | null;
  scoreCalculatedRef: React.MutableRefObject<boolean>;
  resetQuiz: () => void;
}

export function QuizCompletionScreen({
  quiz,
  selectedDifficulty,
  displayScore,
  lastCalculatedScoreRef,
  correctAnswersCount,
  responseId,
  scoreCalculatedRef,
  resetQuiz
}: QuizCompletionScreenProps) {
  const router = useRouter();
  
  // Trigger confetti effect when component mounts
  React.useEffect(() => {
    // Celebrate with confetti if score is good (over 70%)
    if (displayScore && displayScore > 70) {
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      
      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };
      
      (function frame() {
        const timeLeft = animationEnd - Date.now();
        
        if (timeLeft <= 0) return;
        
        confetti({
          particleCount: 3,
          angle: randomInRange(60, 120),
          spread: randomInRange(50, 70),
          origin: { y: 0.6 },
          colors: ['#4f46e5', '#8b5cf6', '#3b82f6']
        });
        
        requestAnimationFrame(frame);
      }());
    }
  }, [displayScore]);

  // Calculate grade based on score
  const getGrade = (score: number | null): string => {
    if (score === null) return 'N/A';
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  };

  // Get feedback message based on score
  const getFeedbackMessage = (score: number | null): string => {
    if (score === null) return 'Score could not be calculated';
    if (score >= 90) return 'Excellent work! You\'ve mastered this topic!';
    if (score >= 80) return 'Great job! You have a solid understanding.';
    if (score >= 70) return 'Good work! You\'re on the right track.';
    if (score >= 60) return 'You passed! With more practice, you can improve.';
    return 'Keep trying! Review the material and try again.';
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-lg max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-block mb-6 p-2 bg-blue-50 rounded-full">
          <div className="bg-blue-100 rounded-full p-3">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-10 w-10 text-blue-600" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
          </div>
        </div>
        
        <h2 className="text-3xl font-bold mb-2">Quiz Completed!</h2>
        <p className="text-gray-600 mb-6">{getFeedbackMessage(displayScore)}</p>
        
        <div className="flex justify-center mb-6">
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#eee"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={displayScore && displayScore >= 70 ? "#4f46e5" : "#ef4444"}
                strokeWidth="3"
                strokeDasharray={`${displayScore || 0}, 100`}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-4xl font-bold">{displayScore || 0}%</span>
              <span className="text-lg font-semibold text-gray-500">
                Grade: {getGrade(displayScore)}
              </span>
            </div>
          </div>
        </div>          <CorrectAnswersDisplay
            correctAnswersCount={correctAnswersCount}
            totalQuestions={quiz.questions?.length || 0}
          />

        <div className="flex items-center justify-center gap-3 mt-4 flex-wrap">
          <div className="px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-sm font-medium capitalize inline-flex items-center">
            <svg className="w-4 h-4 mr-1 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Difficulty: <span className="font-semibold">{selectedDifficulty}</span></span>
          </div>
          
          {quiz.difficultySettings &&
            quiz.difficultySettings[
              selectedDifficulty as keyof typeof quiz.difficultySettings
            ]?.pointsMultiplier &&
            quiz.difficultySettings[
              selectedDifficulty as keyof typeof quiz.difficultySettings
            ]!.pointsMultiplier !== 1 && (
              <div className="px-3 py-1 bg-purple-50 border border-purple-100 rounded-full text-sm font-medium inline-flex items-center">
                <svg className="w-4 h-4 mr-1 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{
                  quiz.difficultySettings[
                    selectedDifficulty as keyof typeof quiz.difficultySettings
                  ]!.pointsMultiplier
                }x points</span>
              </div>
            )}
        </div>

        {responseId && (
          <div className="mt-6 p-3 bg-gray-50 rounded-lg inline-block">
            <p className="text-sm text-gray-600">Response ID:</p>
            <p className="font-mono text-xs select-all">{responseId}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mt-8">
        <button
          onClick={() => router.push("/quiz/join")}
          className="px-6 py-3 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
          Back to Quizzes
        </button>
        <button
          onClick={resetQuiz}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Retry Quiz
        </button>
      </div>
    </div>
  );
}
