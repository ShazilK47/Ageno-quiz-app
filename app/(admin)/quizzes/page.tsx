"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  collection,
  query,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/firebase/client";
import { handleFirebaseError } from "@/firebase/utils";

interface Quiz {
  id: string;
  title: string;
  description: string;
  active: boolean;
  timeLimit: number;
  createdAt: any;
  questionsCount: number;
  code: string;
}

export default function QuizListPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      setError(null);

      const quizzesRef = collection(db, "quizzes");
      const q = query(quizzesRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const quizList: Quiz[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        quizList.push({
          id: doc.id,
          title: data.title,
          description: data.description,
          active: data.active || false,
          timeLimit: data.timeLimit || 0,
          createdAt: data.createdAt,
          questionsCount: data.questions?.length || 0,
          code: data.code || "N/A",
        });
      });

      setQuizzes(quizList);
    } catch (err) {
      const formattedError = handleFirebaseError(err);
      console.error("Error fetching quizzes:", formattedError);
      setError(formattedError.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleQuizStatus = async (quizId: string, currentStatus: boolean) => {
    try {
      setActionInProgress(quizId);
      setError(null);
      setSuccessMessage(null);

      const quizRef = doc(db, "quizzes", quizId);
      await updateDoc(quizRef, {
        active: !currentStatus,
      });

      // Update local state
      setQuizzes(
        quizzes.map((quiz) =>
          quiz.id === quizId ? { ...quiz, active: !currentStatus } : quiz
        )
      );

      setSuccessMessage(
        `Quiz ${!currentStatus ? "activated" : "deactivated"} successfully`
      );
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const formattedError = handleFirebaseError(err);
      console.error("Error toggling quiz status:", formattedError);
      setError(formattedError.message);
    } finally {
      setActionInProgress(null);
    }
  };

  const deleteQuiz = async (quizId: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this quiz? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setActionInProgress(quizId);
      setError(null);
      setSuccessMessage(null);

      const quizRef = doc(db, "quizzes", quizId);
      await deleteDoc(quizRef);

      // Update local state
      setQuizzes(quizzes.filter((quiz) => quiz.id !== quizId));

      setSuccessMessage("Quiz deleted successfully");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      const formattedError = handleFirebaseError(err);
      console.error("Error deleting quiz:", formattedError);
      setError(formattedError.message);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quiz Management</h1>
          <p className="text-gray-600 mt-2">
            Create, edit, and manage your quizzes
          </p>
        </div>
        <Link
          href="/admin/quizzes/create-quiz"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-primary hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          <svg
            className="-ml-1 mr-2 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Create New Quiz
        </Link>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 text-green-700">
          {successMessage}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700">
          {error}
        </div>
      )}

      {/* Quiz List */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden border border-gray-200">
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin h-8 w-8 border-4 border-purple-primary border-t-transparent rounded-full"></div>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">
              No quizzes found. Create your first quiz!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Quiz
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Code
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Questions
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Time Limit
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {quizzes.map((quiz) => (
                  <tr key={quiz.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <div className="text-sm font-medium text-gray-900">
                          {quiz.title}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {quiz.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-md">
                        {quiz.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {quiz.questionsCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {quiz.timeLimit ? `${quiz.timeLimit} min` : "No limit"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          quiz.active
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {quiz.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Link
                          href={`/admin/quizzes/${quiz.id}`}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          View
                        </Link>
                        <Link
                          href={`/admin/quizzes/${quiz.id}/edits`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => toggleQuizStatus(quiz.id, quiz.active)}
                          disabled={actionInProgress === quiz.id}
                          className={`${
                            quiz.active
                              ? "text-amber-600 hover:text-amber-900"
                              : "text-green-600 hover:text-green-900"
                          } ${
                            actionInProgress === quiz.id
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          {actionInProgress === quiz.id
                            ? "Updating..."
                            : quiz.active
                            ? "Deactivate"
                            : "Activate"}
                        </button>
                        <button
                          onClick={() => deleteQuiz(quiz.id)}
                          disabled={actionInProgress === quiz.id}
                          className={`text-red-600 hover:text-red-900 ${
                            actionInProgress === quiz.id
                              ? "opacity-50 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          {actionInProgress === quiz.id &&
                          actionInProgress === "delete"
                            ? "Deleting..."
                            : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
