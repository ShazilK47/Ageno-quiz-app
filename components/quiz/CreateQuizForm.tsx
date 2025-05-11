"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase/client";
import { useAuth } from "@/contexts/auth-context";
import { handleFirebaseError } from "@/firebase/utils";

interface CreateQuizFormProps {
  onSuccess: (quizId: string) => void;
}

export default function CreateQuizForm({ onSuccess }: CreateQuizFormProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [timeLimit, setTimeLimit] = useState(30);
  const [code, setCode] = useState("");
  const [requiresAccessCode, setRequiresAccessCode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Generate a random quiz code
  const generateCode = () => {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }
    setCode(result);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      setError("You must be logged in to create a quiz");
      return;
    }

    // Validate form
    if (!title.trim()) {
      setError("Quiz title is required");
      return;
    }

    if (!description.trim()) {
      setError("Quiz description is required");
      return;
    }

    if (requiresAccessCode && !code.trim()) {
      setError("Quiz code is required when 'Requires Access Code' is enabled");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      // Create a default quiz with minimal structure
      const quizData = {
        title,
        description,
        timeLimit: Number(timeLimit),
        code,
        requiresAccessCode,
        active: true,
        questions: [],
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Create the quiz document
      const quizzesCollection = collection(db, "quizzes");
      const newQuizRef = doc(quizzesCollection);
      await setDoc(newQuizRef, quizData);

      setSuccess("Quiz created successfully!");

      // Call the success callback with the ID
      if (onSuccess) {
        setTimeout(() => {
          onSuccess(newQuizRef.id);
        }, 1500);
      }
    } catch (err) {
      console.error("Error creating quiz:", err);
      const formattedError = handleFirebaseError(err);
      setError(
        formattedError.message || "Failed to create quiz. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create New Quiz</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 border-l-4 border-red-500 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 text-green-600 border-l-4 border-green-500 rounded-md">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Quiz Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
              placeholder="Enter quiz title"
              required
            />
          </div>
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
              placeholder="Enter quiz description"
              rows={3}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="timeLimit"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Time Limit (minutes) <span className="text-red-500">*</span>
              </label>
              <input
                id="timeLimit"
                type="number"
                min="5"
                max="180"
                value={timeLimit}
                onChange={(e) => setTimeLimit(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                Set time limit between 5-180 minutes
              </p>
            </div>

            <div>
              <div className="flex items-center mb-2">
                <input
                  id="requiresAccessCode"
                  type="checkbox"
                  checked={requiresAccessCode}
                  onChange={(e) => setRequiresAccessCode(e.target.checked)}
                  className="h-4 w-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <label
                  htmlFor="requiresAccessCode"
                  className="ml-2 text-sm font-medium text-gray-700"
                >
                  Require access code to join quiz
                </label>
              </div>

              {requiresAccessCode && (
                <>
                  <label
                    htmlFor="code"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Quiz Code <span className="text-red-500">*</span>
                  </label>
                  <div className="flex">
                    <input
                      id="code"
                      type="text"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:ring-purple-500 focus:border-purple-500"
                      placeholder="e.g. ABC123"
                      required={requiresAccessCode}
                    />
                    <button
                      type="button"
                      onClick={generateCode}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-r-md hover:bg-gray-300"
                    >
                      Generate
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Students will use this code to join your quiz
                  </p>
                </>
              )}
            </div>
          </div>{" "}
          <div className="flex items-center justify-between pt-4">
            <p className="text-sm text-gray-500">
              You&apos;ll be able to add questions after creating the quiz.
            </p>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-400"
              >
                {isLoading ? "Creating..." : "Create Quiz"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
