"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import UserManagement from "@/components/UserManagement";
import { useAuth } from "@/contexts/auth-context";
import { collection, getDocs, query, limit, orderBy } from "firebase/firestore";
import { db } from "@/firebase/client";

const Dashboard = () => {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalQuizzes: 0,
    activeQuizzes: 0,
    recentAttempts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If not loading and not admin, redirect to home
    if (!loading && !isAdmin) {
      router.push("/");
    }
  }, [loading, isAdmin, router]);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        setIsLoading(true);

        // Get total users count
        const usersCollection = collection(db, "users");
        const usersSnapshot = await getDocs(usersCollection);
        const totalUsers = usersSnapshot.size;

        // Get quizzes data
        const quizzesCollection = collection(db, "quizzes");
        const quizzesSnapshot = await getDocs(quizzesCollection);
        const totalQuizzes = quizzesSnapshot.size;

        // Count active quizzes (assuming there's an 'active' field in quiz documents)
        const activeQuizzes = quizzesSnapshot.docs.filter(
          (doc) => doc.data().active === true
        ).length;

        // Get recent quiz attempts (assuming there's a 'attempts' collection)
        let recentAttempts = 0;
        try {
          const attemptsCollection = collection(db, "attempts");
          const recentAttemptsQuery = query(
            attemptsCollection,
            orderBy("timestamp", "desc"),
            limit(20)
          );
          const attemptsSnapshot = await getDocs(recentAttemptsQuery);
          recentAttempts = attemptsSnapshot.size;
        } catch (error) {
          console.error("Error fetching attempts:", error);
        }

        setStats({
          totalUsers,
          totalQuizzes,
          activeQuizzes,
          recentAttempts,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (isAdmin) {
      fetchDashboardStats();
    }
  }, [isAdmin]);

  if (loading || !isAdmin) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-4 border-purple-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Manage your quizzes, users, and view analytics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-50 text-purple-primary">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="font-semibold text-gray-400 text-sm">
                TOTAL USERS
              </h2>
              <p className="font-bold text-2xl text-gray-900">
                {isLoading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  stats.totalUsers
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-50 text-blue-600">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="font-semibold text-gray-400 text-sm">
                TOTAL QUIZZES
              </h2>
              <p className="font-bold text-2xl text-gray-900">
                {isLoading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  stats.totalQuizzes
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-50 text-green-600">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="font-semibold text-gray-400 text-sm">
                ACTIVE QUIZZES
              </h2>
              <p className="font-bold text-2xl text-gray-900">
                {isLoading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  stats.activeQuizzes
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-amber-50 text-amber-600">
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                />
              </svg>
            </div>
            <div className="ml-4">
              <h2 className="font-semibold text-gray-400 text-sm">
                RECENT ATTEMPTS
              </h2>
              <p className="font-bold text-2xl text-gray-900">
                {isLoading ? (
                  <span className="animate-pulse">...</span>
                ) : (
                  stats.recentAttempts
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-10">
        <Link
          href="/admin/quizzes/create-quiz"
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-primary hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          <svg
            className="-ml-1 mr-2 h-5 w-5"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          Create Quiz
        </Link>

        <Link
          href="/admin/quiz-reports"
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          <svg
            className="-ml-1 mr-2 h-5 w-5 text-gray-500"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm4-1a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-2-6a1 1 0 10-2 0v1a1 1 0 102 0V5z"
              clipRule="evenodd"
            />
          </svg>
          View Reports
        </Link>

        <Link
          href="/admin/settings"
          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          <svg
            className="-ml-1 mr-2 h-5 w-5 text-gray-500"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
              clipRule="evenodd"
            />
          </svg>
          Settings
        </Link>
      </div>

      {/* User Management Section */}
      <div className="mb-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          User Management
        </h2>
        <UserManagement />
      </div>
    </div>
  );
};

export default Dashboard;
