"use client";

import { useEffect, useCallback, useRef } from "react";
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
  const totalSeconds = validDuration * 60;
  
  // Use a ref to track initialization to prevent infinite re-renders
  const initialized = useRef(false);
  
  // Track the initial value when timeRemaining is first set
  // This is used as the basis for calculating percentage
  const initialTimeRef = useRef<number | null>(null);
  
  // Set timeRemaining if it's null and keep track of the initial value
  useEffect(() => {
    // Initialize timeRemaining if it's null
    if (timeRemaining === null && !initialized.current) {
      initialized.current = true;
      setTimeRemaining(totalSeconds);
    }
    
    // Track the initial non-null timeRemaining value for percentage calculation
    if (timeRemaining !== null && initialTimeRef.current === null) {
      initialTimeRef.current = timeRemaining;
      console.log(`[QuizTimer] Initial time set: ${timeRemaining} seconds`);
    }
  }, [setTimeRemaining, totalSeconds, timeRemaining]);

  // Format seconds to mm:ss
  const formatTime = useCallback((seconds: number | null) => {
    if (seconds === null) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  }, []);
  
  // Calculate percentage of time remaining based on the initial timeRemaining value
  const percentRemaining = (() => {
    // Always show 100% if timeRemaining is null
    if (timeRemaining === null) return 100;
    
    // If we haven't stored an initial value yet, show 100%
    if (initialTimeRef.current === null) return 100;
    
    // Calculate percentage based on the initial value
    return Math.max(0, Math.min(100, (timeRemaining / initialTimeRef.current) * 100));
  })();
  
  // Set warning state when less than 60 seconds remain (1 minute)
  const isWarning = timeRemaining !== null && timeRemaining <= 60;
  // Timer logic
  useEffect(() => {
    if (paused || timeRemaining === null || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        // Safety check for null values
        if (prev === null) return null;

        // Ensure prev is a number and not NaN before decrementing
        if (isNaN(prev)) {
          console.error("Timer value is NaN, resetting to initial duration");
          return initialTimeRef.current || totalSeconds; // Use stored initial value or fall back to totalSeconds
        }

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
  }, [onTimeUp, paused, setTimeRemaining, timeRemaining, totalSeconds]);
  
  // Warning animation for when time is below 1 minute
  const pulseAnimation = isWarning
    ? {
        scale: [1, 1.08, 1],
        opacity: [1, 0.9, 1],
        transition: {
          repeat: Infinity,
          duration: 1,
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
      </div>      <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
        <div          className={`h-full ${isWarning ? "bg-red-600" : "bg-blue-500"}`}
          style={{
            width: `${percentRemaining}%`,
            transition: 'width 1s linear'
          }}
        />
      </div>
    </div>
  );
}
