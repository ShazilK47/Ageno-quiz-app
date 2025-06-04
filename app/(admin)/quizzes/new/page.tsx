/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  addDoc,
  serverTimestamp,
  writeBatch,
  doc,
} from "firebase/firestore";
import { db } from "@/firebase/client";
import { FiPlus, FiTrash, FiSave, FiArrowLeft } from "react-icons/fi";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { QuizDifficulty } from "@/types/quiz";

interface QuizQuestion {
  text: string;
  options: string[];
  correctIndex: number;
  type: "mcq"; // Can expand to support more types later
}

export default function NewQuizPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Quiz details state
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [duration, setDuration] = useState<number>(30); // Default duration in minutes
  const [accessCode, setAccessCode] = useState<string>("");
  const [isAutoCheck, setIsAutoCheck] = useState<boolean>(true);

  // Difficulty settings
  const [availableDifficulties] = useState<QuizDifficulty[]>([
    "easy",
    "medium",
    "hard",
  ]);
  const [activeDifficulty, setActiveDifficulty] =
    useState<QuizDifficulty>("medium");

  // Questions state by difficulty
  const [questionsByDifficulty, setQuestionsByDifficulty] = useState<
    Record<QuizDifficulty, QuizQuestion[]>
  >({
    easy: [
      {
        text: "",
        options: ["", "", "", ""],
        correctIndex: 0,
        type: "mcq",
      },
    ],
    medium: [
      {
        text: "",
        options: ["", "", "", ""],
        correctIndex: 0,
        type: "mcq",
      },
    ],
    hard: [
      {
        text: "",
        options: ["", "", "", ""],
        correctIndex: 0,
        type: "mcq",
      },
    ],
  });

  // Convenient getter for current questions
  const questions = questionsByDifficulty[activeDifficulty];

  const handleAddQuestion = () => {
    setQuestionsByDifficulty((prev) => ({
      ...prev,
      [activeDifficulty]: [
        ...prev[activeDifficulty],
        {
          text: "",
          options: ["", "", "", ""],
          correctIndex: 0,
          type: "mcq",
        },
      ],
    }));
  };

  const handleRemoveQuestion = (index: number) => {
    if (questionsByDifficulty[activeDifficulty].length > 1) {
      const updatedQuestions = [...questionsByDifficulty[activeDifficulty]];
      updatedQuestions.splice(index, 1);

      setQuestionsByDifficulty((prev) => ({
        ...prev,
        [activeDifficulty]: updatedQuestions,
      }));
    } else {
      setError(
        `You need at least one question for ${activeDifficulty} difficulty.`
      );
    }
  };

  const handleQuestionChange = (
    index: number,
    field: keyof QuizQuestion,
    value: any
  ) => {
    const updatedQuestions = [...questionsByDifficulty[activeDifficulty]];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value,
    };

    setQuestionsByDifficulty((prev) => ({
      ...prev,
      [activeDifficulty]: updatedQuestions,
    }));
  };

  const handleOptionChange = (
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => {
    const updatedQuestions = [...questionsByDifficulty[activeDifficulty]];
    updatedQuestions[questionIndex].options[optionIndex] = value;

    setQuestionsByDifficulty((prev) => ({
      ...prev,
      [activeDifficulty]: updatedQuestions,
    }));
  };

  const handleAddOption = (questionIndex: number) => {
    const updatedQuestions = [...questionsByDifficulty[activeDifficulty]];
    updatedQuestions[questionIndex].options.push("");

    setQuestionsByDifficulty((prev) => ({
      ...prev,
      [activeDifficulty]: updatedQuestions,
    }));
  };

  const handleRemoveOption = (questionIndex: number, optionIndex: number) => {
    if (
      questionsByDifficulty[activeDifficulty][questionIndex].options.length > 2
    ) {
      const updatedQuestions = [...questionsByDifficulty[activeDifficulty]];
      updatedQuestions[questionIndex].options.splice(optionIndex, 1);

      // If we're removing the correct option or an option before it, adjust the correct index
      if (optionIndex === updatedQuestions[questionIndex].correctIndex) {
        updatedQuestions[questionIndex].correctIndex = 0;
      } else if (optionIndex < updatedQuestions[questionIndex].correctIndex) {
        updatedQuestions[questionIndex].correctIndex--;
      }

      setQuestionsByDifficulty((prev) => ({
        ...prev,
        [activeDifficulty]: updatedQuestions,
      }));
    } else {
      setError("Each question must have at least 2 options.");
    }
  };

  const validateQuiz = () => {
    if (!title.trim()) {
      setError("Quiz title is required.");
      return false;
    }

    if (duration <= 0) {
      setError("Quiz duration must be greater than 0 minutes.");
      return false;
    }

    // Validate all questions for all difficulties
    for (const difficulty of availableDifficulties) {
      const difficultyQuestions = questionsByDifficulty[difficulty];

      for (let i = 0; i < difficultyQuestions.length; i++) {
        const question = difficultyQuestions[i];

        if (!question.text.trim()) {
          setError(
            `${
              difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
            } difficulty - Question ${i + 1} is missing text.`
          );
          setActiveDifficulty(difficulty);
          return false;
        }

        for (let j = 0; j < question.options.length; j++) {
          if (!question.options[j].trim()) {
            setError(
              `${
                difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
              } difficulty - Question ${i + 1}, Option ${j + 1} is empty.`
            );
            setActiveDifficulty(difficulty);
            return false;
          }
        }
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateQuiz()) {
      return;
    }

    try {
      setIsLoading(true);

      // Create the quiz document
      const quizData = {
        title,
        description,
        duration,
        difficulty: activeDifficulty, // Add difficulty to quiz document
        accessCode: accessCode || null, // If empty, store as null
        createdAt: serverTimestamp(),
        createdBy: user?.uid || "Unknown",
        isAutoCheck,
      };

      // Save quiz to Firestore
      const quizRef = await addDoc(collection(db, "quizzes"), quizData);

      // Save each question as a document in a subcollection
      const questionsCollectionRef = collection(
        db,
        "quizzes",
        quizRef.id,
        "questions"
      );

      // Batch write for efficiency
      const batch = writeBatch(db);

      for (const difficulty of availableDifficulties) {
        const difficultyQuestions = questionsByDifficulty[difficulty];

        for (const question of difficultyQuestions) {
          const questionDocRef = doc(questionsCollectionRef);
          batch.set(questionDocRef, {
            text: question.text,
            options: question.options,
            correctIndex: question.correctIndex,
            type: question.type,
            difficulty, // Store the difficulty with each question
          });
        }
      }

      // Commit the batch
      await batch.commit();

      // Navigate back to the quiz management page
      router.push("/admin/quizzes");
    } catch (error: any) {
      console.error("Error creating quiz:", error);
      setError(error.message || "Failed to create quiz.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center mb-4">
          <Link
            href="/admin/quizzes"
            className="mr-4 text-gray-600 hover:text-gray-800"
          >
            <FiArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Create New Quiz</h1>
        </div>
        <p className="text-gray-600">
          Add a new quiz with questions and options
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Quiz Details</h2>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <label
                htmlFor="title"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Quiz Title<span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter quiz title"
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                required
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter a description for this quiz"
                rows={3}
                className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label
                  htmlFor="duration"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Duration (minutes)<span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="duration"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                  min="1"
                  max="180"
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="accessCode"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Access Code (Optional)
                </label>
                <input
                  type="text"
                  id="accessCode"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  placeholder="e.g., QUIZ123"
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Leave blank for no access restriction
                </p>
              </div>
              <div className="flex items-start pt-6">
                <div className="flex items-center h-5">
                  <input
                    id="isAutoCheck"
                    type="checkbox"
                    checked={isAutoCheck}
                    onChange={(e) => setIsAutoCheck(e.target.checked)}
                    className="focus:ring-purple-500 h-4 w-4 text-purple-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label
                    htmlFor="isAutoCheck"
                    className="font-medium text-gray-700"
                  >
                    Auto Check Answers
                  </label>
                  <p className="text-gray-500">
                    Automatically grade quiz attempts
                  </p>
                </div>
              </div>{" "}
              <div>
                <label
                  htmlFor="difficulty"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Default Difficulty Level
                  <span className="text-red-500">*</span>
                </label>
                <select
                  id="difficulty"
                  value={activeDifficulty}
                  onChange={(e) =>
                    setActiveDifficulty(e.target.value as QuizDifficulty)
                  }
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                  required
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  This will be the default difficulty shown when users take the
                  quiz
                </p>
              </div>
            </div>
          </div>
        </div>{" "}
        {/* Questions */}
        <div className="mt-8 space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Questions</h2>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="inline-flex items-center px-3 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <FiPlus className="mr-2" /> Add Question
            </button>
          </div>

          {/* Difficulty Tabs */}
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <nav
                className="-mb-px flex space-x-4"
                aria-label="Difficulty Tabs"
              >
                {availableDifficulties.map((tabDifficulty) => (
                  <button
                    key={tabDifficulty}
                    onClick={() => setActiveDifficulty(tabDifficulty)}
                    className={`whitespace-nowrap py-3 px-3 border-b-2 font-medium text-sm ${
                      activeDifficulty === tabDifficulty
                        ? "border-purple-500 text-purple-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mr-2 ${
                        tabDifficulty === "easy"
                          ? "bg-green-100 text-green-800"
                          : tabDifficulty === "hard"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {tabDifficulty.charAt(0).toUpperCase() +
                        tabDifficulty.slice(1)}
                    </span>
                    Questions{" "}
                    {questionsByDifficulty[tabDifficulty]?.length || 0}
                  </button>
                ))}
              </nav>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Create questions for each difficulty level. All difficulty levels
              will be available to users when taking the quiz.
            </p>
          </div>

          {questions.map((question, questionIndex) => (
            <div
              key={questionIndex}
              className="bg-white rounded-lg shadow overflow-hidden"
            >
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-md font-medium text-gray-900">
                  Question {questionIndex + 1}
                </h3>
                <button
                  type="button"
                  onClick={() => handleRemoveQuestion(questionIndex)}
                  className="text-red-600 hover:text-red-900"
                >
                  <FiTrash />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label
                    htmlFor={`question-${questionIndex}-text`}
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Question Text<span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id={`question-${questionIndex}-text`}
                    value={question.text}
                    onChange={(e) =>
                      handleQuestionChange(
                        questionIndex,
                        "text",
                        e.target.value
                      )
                    }
                    placeholder="Enter the question"
                    rows={2}
                    className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Options<span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => handleAddOption(questionIndex)}
                      className="text-sm text-purple-600 hover:text-purple-800 flex items-center"
                    >
                      <FiPlus className="mr-1" size={14} /> Add Option
                    </button>
                  </div>

                  <div className="space-y-2">
                    {question.options.map((option, optionIndex) => (
                      <div
                        key={optionIndex}
                        className="flex items-center space-x-2"
                      >
                        <div className="flex-grow">
                          <div className="relative flex items-center">
                            <input
                              type="radio"
                              name={`question-${questionIndex}-correct`}
                              checked={question.correctIndex === optionIndex}
                              onChange={() =>
                                handleQuestionChange(
                                  questionIndex,
                                  "correctIndex",
                                  optionIndex
                                )
                              }
                              className="focus:ring-purple-500 h-4 w-4 text-purple-600 border-gray-300"
                            />
                            <input
                              type="text"
                              value={option}
                              onChange={(e) =>
                                handleOptionChange(
                                  questionIndex,
                                  optionIndex,
                                  e.target.value
                                )
                              }
                              placeholder={`Option ${optionIndex + 1}`}
                              className="ml-2 block w-full border-gray-300 rounded-md shadow-sm focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                              required
                            />
                          </div>
                          <div className="pl-6 text-xs text-gray-500 mt-0.5">
                            {question.correctIndex === optionIndex &&
                              "Correct answer"}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveOption(questionIndex, optionIndex)
                          }
                          className="text-red-400 hover:text-red-600"
                        >
                          <FiTrash size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={() => router.push("/admin/quizzes")}
            className="mr-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Saving...
              </>
            ) : (
              <>
                <FiSave className="mr-2" /> Save Quiz
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
