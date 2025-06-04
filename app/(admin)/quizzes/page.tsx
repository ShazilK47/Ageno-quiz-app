/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  deleteDoc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/firebase/client";
import Link from "next/link";
import { FiPlusCircle, FiSearch } from "react-icons/fi";

interface Quiz {
  id: string;
  title: string;
  description: string;
  duration: number;
  accessCode?: string;
  createdAt: any;
  createdBy: string;
  isAutoCheck: boolean;
}

export default function QuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      setIsLoading(true);
      const quizzesRef = collection(db, "quizzes");
      const q = query(quizzesRef, orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);

      const quizzesList: Quiz[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Quiz;
        quizzesList.push({
          id: doc.id,
          title: data.title || "Untitled Quiz",
          description: data.description || "",
          duration: data.duration || 0,
          accessCode: data.accessCode,
          createdAt: data.createdAt,
          createdBy: data.createdBy || "Unknown",
          isAutoCheck: data.isAutoCheck || false,
        });
      });

      setQuizzes(quizzesList);
    } catch (error) {
      console.error("Error fetching quizzes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteQuiz = async (quizId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this quiz? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      // Delete the quiz document
      await deleteDoc(doc(db, "quizzes", quizId));

      // Remove from state
      setQuizzes((prevQuizzes) =>
        prevQuizzes.filter((quiz) => quiz.id !== quizId)
      );
    } catch (error) {
      console.error("Error deleting quiz:", error);
      alert("Failed to delete quiz. Please try again.");
    }
  };

  // Filter quizzes by search term
  const filteredQuizzes = quizzes.filter((quiz) => {
    if (!searchTerm) return true;

    const term = searchTerm.toLowerCase();
    return (
      quiz.title.toLowerCase().includes(term) ||
      quiz.description.toLowerCase().includes(term) ||
      quiz.accessCode?.toLowerCase().includes(term)
    );
  });

  // Sort quizzes
  const sortedQuizzes = [...filteredQuizzes].sort((a, b) => {
    if (sortBy === "title") {
      const comparison = a.title.localeCompare(b.title);
      return sortOrder === "asc" ? comparison : -comparison;
    } else if (sortBy === "duration") {
      const comparison = a.duration - b.duration;
      return sortOrder === "asc" ? comparison : -comparison;
    } else {
      // Default to created date
      const dateA = a.createdAt?.toDate
        ? a.createdAt.toDate()
        : new Date(a.createdAt || 0);
      const dateB = b.createdAt?.toDate
        ? b.createdAt.toDate()
        : new Date(b.createdAt || 0);
      const comparison = dateA.getTime() - dateB.getTime();
      return sortOrder === "asc" ? comparison : -comparison;
    }
  });

  // Toggle sort order
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // Format date to readable string
  const formatDate = (timestamp: any): string => {
    if (!timestamp) return "Unknown";

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format duration in minutes
  const formatDuration = (durationInMinutes: number): string => {
    if (durationInMinutes < 60) {
      return `${durationInMinutes} min`;
    } else {
      const hours = Math.floor(durationInMinutes / 60);
      const minutes = durationInMinutes % 60;
      return `${hours}h ${minutes > 0 ? `${minutes}m` : ""}`;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quiz Management</h1>
          <p className="text-gray-600">Create, edit and manage your quizzes</p>
        </div>
        <Link
          href="/quizzes/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          <FiPlusCircle className="mr-2" />
          New Quiz
        </Link>
      </div>

      {/* Search and filters */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search quizzes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Quizzes Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-center">
            <div className="inline-block animate-spin h-8 w-8 border-4 border-purple-500 border-t-transparent rounded-full"></div>
            <p className="mt-2 text-gray-600">Loading quizzes...</p>
          </div>
        ) : sortedQuizzes.length === 0 ? (
          <div className="p-6 text-center">
            {searchTerm ? (
              <>
                <p className="text-gray-600">
                  No quizzes found matching &quot;{searchTerm}"
                </p>
                <button
                  onClick={() => setSearchTerm("")}
                  className="mt-2 text-purple-600 hover:text-purple-800 underline"
                >
                  Clear search
                </button>
              </>
            ) : (
              <>
                <p className="text-gray-600">No quizzes available.</p>{" "}
                <Link
                  href="/quizzes/new"
                  className="mt-2 text-purple-600 hover:text-purple-800 underline inline-block"
                >
                  Create your first quiz
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("title")}
                  >
                    Quiz Title
                    {sortBy === "title" && (
                      <span className="ml-1">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Access Code
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("duration")}
                  >
                    Duration
                    {sortBy === "duration" && (
                      <span className="ml-1">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort("createdAt")}
                  >
                    Created
                    {sortBy === "createdAt" && (
                      <span className="ml-1">
                        {sortOrder === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Auto Check
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedQuizzes.map((quiz) => (
                  <tr key={quiz.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {quiz.title}
                      </div>
                      <div className="text-sm text-gray-500 line-clamp-1">
                        {quiz.description || "No description"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {quiz.accessCode ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {quiz.accessCode}
                        </span>
                      ) : (
                        <span className="text-gray-400">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDuration(quiz.duration)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(quiz.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {quiz.isAutoCheck ? (
                        <span className="text-green-600">Yes</span>
                      ) : (
                        <span className="text-red-600">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        {" "}
                        <Link
                          href={`/quizzes/${quiz.id}`}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          View
                        </Link>
                        <Link
                          href={`/quizzes/${quiz.id}/edit`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDeleteQuiz(quiz.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
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
