"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

interface QuizTimerProps {
  duration: number; // in minutes
  onTimeUp: () => void;
  paused?: boolean;
}

export default function QuizTimer({
  duration,
  onTimeUp,
  paused = false,
}: QuizTimerProps) {
  // Convert minutes to seconds
  const totalSeconds = duration * 60;
  const [timeRemaining, setTimeRemaining] = useState(totalSeconds);
  const [isWarning, setIsWarning] = useState(false);

  // Format seconds to mm:ss
  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }, []);

  // Calculate progress percentage
  const progressPercentage = (timeRemaining / totalSeconds) * 100;

  // Set warning state when less than 20% time remains
  useEffect(() => {
    setIsWarning(progressPercentage < 20);
  }, [progressPercentage]);

  // Timer logic
  useEffect(() => {
    if (paused || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        const newTime = prev - 1;
        if (newTime <= 0) {
          clearInterval(timer);
          onTimeUp();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, onTimeUp, paused]);

  // Warning animation for last 20% of time
  const pulseAnimation = isWarning
    ? {
        scale: [1, 1.05, 1],
        transition: {
          repeat: Infinity,
          duration: 2,
        },
      }
    : {};

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-gray-700">
          Time Remaining
        </span>
        <motion.span
          className={`text-sm font-bold ${
            isWarning ? "text-red-600" : "text-gray-700"
          }`}
          animate={pulseAnimation}
        >
          {formatTime(timeRemaining)}
        </motion.span>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <motion.div
          className={`h-2.5 rounded-full ${
            isWarning ? "bg-red-600" : "bg-green-600"
          }`}
          style={{ width: `${progressPercentage}%` }}
          initial={{ width: "100%" }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}
