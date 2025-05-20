/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { db } from "@/firebase/client";
import { handleFirebaseError } from "@/firebase/utils";
import AdminProtected from "@/components/AdminProtected";
import Header from "@/components/Header";
import ScoresByDifficultyChart from "@/components/analytics/ScoresByDifficultyChart";

interface Question {
  id: string;
  text: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  points: number;
  imageUrl?: string;
}

interface Quiz {
  id: string;
  title: string;
  description: string;
  active: boolean;
  timeLimit: number;

  createdAt: any;

  updatedAt: any;
  code: string;
  questions: Question[];
  autoCheck: boolean;
}

export default function QuizDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchQuizDetails(params.id as string);
    }
  }, [params.id]);

  const fetchQuizDetails = async (quizId: string) => {
    try {
      setLoading(true);
      setError(null);

      const quizRef = doc(db, "quizzes", quizId);
      const quizSnapshot = await getDoc(quizRef);

      if (!quizSnapshot.exists()) {
        setError("Quiz not found");
        return;
      }

      const quizData = quizSnapshot.data();
      setQuiz({
        id: quizSnapshot.id,
        title: quizData.title,
        description: quizData.description,
        active: quizData.active || false,
        timeLimit: quizData.timeLimit || 0,
        createdAt: quizData.createdAt,
        updatedAt: quizData.updatedAt,
        code: quizData.code || "N/A",
        questions: quizData.questions || [],
        autoCheck: quizData.autoCheck ?? true,
      });
    } catch (err) {
      const formattedError = handleFirebaseError(err);
      console.error("Error fetching quiz details:", formattedError);
      setError(formattedError.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      return "Invalid date";
    }
  };

  const toggleQuizActive = async () => {
    if (!quiz) return;

    try {
      setUpdateLoading(true);

      const quizRef = doc(db, "quizzes", quiz.id);
      await updateDoc(quizRef, {
        active: !quiz.active,
        updatedAt: new Date(),
      });

      setQuiz({
        ...quiz,
        active: !quiz.active,
      });

      setUpdateSuccess(
        `Quiz ${!quiz.active ? "activated" : "deactivated"} successfully`
      );

      setTimeout(() => {
        setUpdateSuccess(null);
      }, 3000);
    } catch (err) {
      const formattedError = handleFirebaseError(err);
      console.error("Error updating quiz:", formattedError);
      setError(formattedError.message);

      setTimeout(() => {
        setError(null);
      }, 3000);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleDeleteQuiz = async () => {
    if (!quiz) return;

    try {
      setUpdateLoading(true);
      // Delete quiz attempts first
      const attemptsQuery = query(
        collection(db, "attempts"),
        where("quizId", "==", quiz.id)
      );
      const attemptsSnapshot = await getDocs(attemptsQuery);

      if (!attemptsSnapshot.empty) {
        const deletePromises = attemptsSnapshot.docs.map((doc) =>
          deleteDoc(doc.ref)
        );
        await Promise.all(deletePromises);
      }

      // Delete the quiz document
      const quizRef = doc(db, "quizzes", quiz.id);
      await deleteDoc(quizRef);

      setDeleteConfirmation(false);
      router.push("/admin/quizzes");
    } catch (err) {
      const formattedError = handleFirebaseError(err);
      setError(formattedError.message);
      setUpdateLoading(false);
    }
  };

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <AdminProtected
          fallback={
            <div className="p-6 text-center">
              <h3 className="text-lg font-medium text-gray-900">
                You need administrator privileges to view quiz details
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Please contact an administrator if you need access.
              </p>
            </div>
          }
        >
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full"></div>
            </div>
          ) : error || !quiz ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <p className="text-red-700">{error || "Failed to load quiz"}</p>
              <Link
                href="/admin/quizzes"
                className="mt-4 inline-block px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 text-gray-700"
              >
                Back to Quizzes
              </Link>
            </div>
          ) : (
            <div>
              <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between">
                <div>
                  <div className="flex items-center">
                    <Link
                      href="/admin/quizzes"
                      className="mr-2 text-gray-600 hover:text-gray-900"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">
                      {quiz.title}
                    </h1>
                  </div>
                  <p className="mt-2 text-gray-600">{quiz.description}</p>
                </div>

                <div className="mt-4 md:mt-0 flex items-center space-x-2">
                  <button
                    onClick={toggleQuizActive}
                    disabled={updateLoading}
                    className={`px-4 py-2 rounded-md font-medium ${
                      quiz.active
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    }`}
                  >
                    {updateLoading
                      ? "Updating..."
                      : quiz.active
                      ? "Deactivate"
                      : "Activate"}
                  </button>

                  <Link
                    href={`/admin/quizzes/${quiz.id}/edits`}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                  >
                    Edit Quiz
                  </Link>
                </div>
              </div>
              {updateSuccess && (
                <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-md">
                  {updateSuccess}
                </div>
              )}
              {error && (
                <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-md">
                  {error}
                </div>
              )}{" "}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-100">
                  <h2 className="text-xl font-semibold mb-4">
                    Quiz Information
                  </h2>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                      <span className="text-gray-600">Status</span>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          quiz.active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {quiz.active ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                      <span className="text-gray-600">Access Code</span>
                      <span className="font-medium bg-gray-100 px-3 py-1 rounded-md">
                        {quiz.code}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                      <span className="text-gray-600">Time Limit</span>
                      <span className="font-medium">
                        {quiz.timeLimit} minutes
                      </span>
                    </div>

                    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                      <span className="text-gray-600">Questions</span>
                      <span className="font-medium">
                        {quiz.questions.length}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                      <span className="text-gray-600">Auto-Check Answers</span>
                      <span className="font-medium">
                        {quiz.autoCheck ? "Yes" : "No"}
                      </span>
                    </div>

                    <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                      <span className="text-gray-600">Created</span>
                      <span className="text-sm">
                        {formatDate(quiz.createdAt)}
                      </span>
                    </div>

                    {quiz.updatedAt && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Last Updated</span>
                        <span className="text-sm">
                          {formatDate(quiz.updatedAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-100">
                  <h2 className="text-xl font-semibold mb-4">Quiz Actions</h2>
                  <div className="space-y-4">
                    <Link
                      href={`/quiz/join?code=${quiz.code}`}
                      target="_blank"
                      className="block w-full text-center px-4 py-3 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200"
                    >
                      Preview Quiz
                    </Link>

                    <button
                      onClick={() => {
                        // Copy the join link to clipboard
                        const joinUrl = `${window.location.origin}/quiz/join?code=${quiz.code}`;
                        navigator.clipboard.writeText(joinUrl);

                        setUpdateSuccess("Join link copied to clipboard!");
                        setTimeout(() => setUpdateSuccess(null), 3000);
                      }}
                      className="block w-full text-center px-4 py-3 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                    >
                      Copy Join Link
                    </button>

                    <Link
                      href={`/admin/quiz-reports?filter=${quiz.id}`}
                      className="block w-full text-center px-4 py-3 bg-green-100 text-green-700 rounded-md hover:bg-green-200"
                    >
                      View Results
                    </Link>

                    <button
                      onClick={() => setDeleteConfirmation(true)}
                      className="block w-full text-center px-4 py-3 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                    >
                      Delete Quiz
                    </button>
                  </div>{" "}
                </div>
              </div>
              <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-100 mb-8">
                <h2 className="text-xl font-semibold mb-4">
                  Performance Analytics
                </h2>
                <ScoresByDifficultyChart quizId={quiz.id} />
              </div>
              <div className="bg-white shadow-sm rounded-lg p-6 border border-gray-100">
                <h2 className="text-xl font-semibold mb-4">Questions</h2>

                {quiz.questions.length === 0 ? (
                  <p className="text-gray-500 p-4 text-center">
                    No questions added to this quiz yet.
                  </p>
                ) : (
                  <div className="space-y-6">
                    {quiz.questions.map((question, index) => (
                      <div
                        key={question.id}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-medium">
                            Question {index + 1}
                            {question.points > 1 && (
                              <span className="ml-2 text-sm text-gray-600">
                                ({question.points} points)
                              </span>
                            )}
                          </h3>
                        </div>

                        <p className="mb-4">{question.text}</p>

                        {question.imageUrl && (
                          <div className="mb-4">
                            <img
                              src={question.imageUrl}
                              alt={`Image for question ${index + 1}`}
                              className="max-h-64 rounded-md border border-gray-200"
                            />
                          </div>
                        )}

                        <div className="space-y-2">
                          {question.options.map((option) => (
                            <div
                              key={option.id}
                              className={`p-2 rounded-md ${
                                option.isCorrect
                                  ? "bg-green-50 border border-green-200"
                                  : "bg-gray-50 border border-gray-200"
                              }`}
                            >
                              <div className="flex items-center">
                                {option.isCorrect && (
                                  <svg
                                    className="h-5 w-5 text-green-600 mr-2"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                )}
                                <span>{option.text}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Delete Confirmation Modal */}
              {deleteConfirmation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 max-w-md w-full">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      Delete Quiz
                    </h3>
                    <p className="text-gray-600 mb-6">
                      Are you sure you want to delete this quiz? This will
                      remove all associated data, including student attempts.
                      This action cannot be undone.
                    </p>
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => setDeleteConfirmation(false)}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleDeleteQuiz}
                        disabled={updateLoading}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-red-400"
                      >
                        {updateLoading ? "Deleting..." : "Delete Quiz"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </AdminProtected>
      </div>
    </>
  );
}
