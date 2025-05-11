"use client";

import { motion } from "framer-motion";

interface ErrorMessageProps {
  title?: string;
  message: string;
  retry?: () => void;
  icon?: React.ReactNode;
}

export default function ErrorMessage({
  title = "Something went wrong",
  message,
  retry,
  icon,
}: ErrorMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg bg-red-50 p-6 text-center"
    >
      <div className="flex flex-col items-center justify-center">
        {icon ? (
          icon
        ) : (
          <div className="mb-4 rounded-full bg-red-100 p-3 text-red-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        )}

        <h3 className="mb-2 text-lg font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{message}</p>

        {retry && (
          <button
            onClick={retry}
            className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Try Again
          </button>
        )}
      </div>
    </motion.div>
  );
}
