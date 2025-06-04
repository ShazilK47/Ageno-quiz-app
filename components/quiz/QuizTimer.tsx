"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";

interface QuizTimerProps {
  duration: number; // in minutes
  onTimeUp: () => void;
  paused?: boolean;
  timeRemaining: number | null;
  setTimeRemaining: React.Dispatch<React.SetStateAction<number | null>>;
}

export default function QuizTimer({
  duration,
  onTimeUp,
  paused = false,
  timeRemaining,
  setTimeRemaining,
}: QuizTimerProps) {
  // Validate and normalize duration - ensure it's a positive number
  const validDuration =
    typeof duration === "number" && !isNaN(duration) && duration > 0
      ? duration
      : 30; // Default to 30 minutes if duration is invalid

  // Convert minutes to seconds
  const totalSeconds = validDuration * 60;  // Only log warnings for invalid duration, removed excessive logging
  useEffect(() => {
    if (validDuration !== duration) {
      console.warn(
        `Invalid quiz duration (${duration}), defaulting to ${validDuration} minutes`
      );
    }
  }, [duration, validDuration]);  // Remove auto-initialization of timeRemaining to avoid render loops
  // We'll rely on the parent component to set the initial time

  const [isWarning, setIsWarning] = useState(false);

  // Format seconds to mm:ss
  const formatTime = useCallback((seconds: number | null) => {
    if (seconds === null) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }, []);

  // Calculate progress percentage with safety checks
  const progressPercentage =
    timeRemaining !== null && totalSeconds > 0
      ? Math.max(0, Math.min(100, (timeRemaining / totalSeconds) * 100))
      : 100;

  // Set warning state when less than 20% time remains
  useEffect(() => {
    if (timeRemaining !== null) {
      setIsWarning(progressPercentage < 20);
    }
  }, [progressPercentage, timeRemaining]);
  // Timer logic
  useEffect(() => {
    if (paused || timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev: number | null) => {
        // Safety check for null values
        if (prev === null) return null;

        // Ensure prev is a number and not NaN before decrementing
        if (isNaN(prev)) {
          console.error("Timer value is NaN, resetting to initial duration");
          return totalSeconds; // Reset to initial duration if we get a NaN
        }

        const newTime: number = prev - 1;
        if (newTime <= 0) {
          clearInterval(timer);
          onTimeUp();
          return 0;
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, onTimeUp, paused, totalSeconds]);

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
