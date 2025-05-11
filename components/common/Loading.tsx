"use client";

import { motion } from "framer-motion";

interface LoadingProps {
  size?: "small" | "medium" | "large";
  color?: "primary" | "secondary" | "white";
  fullScreen?: boolean;
  message?: string;
}

export default function Loading({
  size = "medium",
  color = "primary",
  fullScreen = false,
  message,
}: LoadingProps) {
  // Size mappings
  const sizeMap = {
    small: "h-5 w-5 border-2",
    medium: "h-8 w-8 border-3",
    large: "h-12 w-12 border-4",
  };

  // Color mappings
  const colorMap = {
    primary: "border-blue-600 border-t-transparent",
    secondary: "border-purple-primary border-t-transparent",
    white: "border-white border-t-transparent",
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center">
      <motion.div
        className={`animate-spin rounded-full ${sizeMap[size]} ${colorMap[color]}`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      {message && (
        <p className="mt-4 text-gray-600 dark:text-gray-300 text-sm">
          {message}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50">
        {spinner}
      </div>
    );
  }

  return spinner;
}
