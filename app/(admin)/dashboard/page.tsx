"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminProtected from "@/components/AdminProtected";
import Header from "@/components/Header";
import { collection, getDocs, query, limit, orderBy, where, getCountFromServer } from "firebase/firestore";
import { db } from "@/firebase/client";
import UserManagement from "@/components/UserManagement";
import { div } from "framer-motion/client";

// Dashboard card component
const StatCard = ({ title, value, subtitle, icon, color = "purple" }) => {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          {subtitle && <p className="text-gray-500 text-xs mt-1">{subtitle}</p>}
        </div>
        <div className={`rounded-full p-2 bg-${color}-100 text-${color}-600`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalQuizzes: 0,
    activeQuizzes: 0,
    totalAttempts: 0,
    recentAttempts: 0,
    avgScore: 0,
    topQuiz: { title: "Loading...", attempts: 0 },
  });
  const [recentQuizzes, setRecentQuizzes] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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
        const quizzesQuery = query(quizzesCollection, orderBy("createdAt", "desc"));
        const quizzesSnapshot = await getDocs(quizzesQuery);
        const totalQuizzes = quizzesSnapshot.size;

        // Count active quizzes
        const activeQuizzes = quizzesSnapshot.docs.filter(
          (doc) => doc.data().active === true
        ).length;

        // Get recent quizzes (top 5)
        const recentQuizzesList = quizzesSnapshot.docs
          .slice(0, 5)
          .map((doc) => ({
            id: doc.id,
            title: doc.data().title,
            questionCount: doc.data().questions?.length || 0,
            createdAt: doc.data().createdAt?.toDate?.() || new Date(),
            active: doc.data().active || false,
          }));
        setRecentQuizzes(recentQuizzesList);

        // Get attempts data
        const attemptsCollection = collection(db, "attempts");
        
        // Get total attempts count
        const attemptsCountSnapshot = await getCountFromServer(attemptsCollection);
        const totalAttempts = attemptsCountSnapshot.data().count;

        // Get recent attempts
        const recentAttemptsQuery = query(
          attemptsCollection,
          orderBy("timestamp", "desc"),
          limit(20)
        );
        const attemptsSnapshot = await getDocs(recentAttemptsQuery);
        const recentAttempts = attemptsSnapshot.size;

        // Calculate average score
        let totalScore = 0;
        const recentActivityList = [];
        
        attemptsSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          totalScore += data.score || 0;
          
          // Add to recent activity list (limited to 5)
          if (recentActivityList.length < 5) {
            recentActivityList.push({
              id: doc.id,
              quizTitle: data.quizTitle || "Unknown Quiz",
              userName: data.userName || "Anonymous User",
              score: data.score || 0,
              totalQuestions: data.totalQuestions || 0,
              timestamp: data.timestamp?.toDate?.() || new Date(),
            });
          }
        });
        
        setRecentActivity(recentActivityList);
        
        const avgScore = attemptsSnapshot.size > 0 
          ? Math.round((totalScore / attemptsSnapshot.size) * 10) / 10 
          : 0;

        // Find top quiz by attempts
        const quizAttemptsMap = {};
        attemptsSnapshot.docs.forEach((doc) => {
          const quizId = doc.data().quizId;
          if (quizId) {
            quizAttemptsMap[quizId] = (quizAttemptsMap[quizId] || 0) + 1;
          }
        });

        let topQuizId = null;
        let topQuizAttempts = 0;
        
        for (const [quizId, attempts] of Object.entries(quizAttemptsMap)) {
          if (attempts > topQuizAttempts) {
            topQuizId = quizId;
            topQuizAttempts = attempts;
          }
        }

        let topQuizTitle = "No attempts yet";
        if (topQuizId) {
          const quiz = quizzesSnapshot.docs.find(doc => doc.id === topQuizId);
          if (quiz) {
            topQuizTitle = quiz.data().title;
          }
        }

        setStats({
          totalUsers,
          totalQuizzes,
          activeQuizzes,
          totalAttempts,
          recentAttempts,
          avgScore,
          topQuiz: {
            title: topQuizTitle,
            attempts: topQuizAttempts,
          },
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <AdminProtected
          fallback={
            <div className="p-6 text-center">
              <h3 className="text-lg font-medium text-gray-900">
                You need administrator privileges to view this page
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Please contact an administrator if you need access.
              </p>
            </div>
          }
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Manage your quizzes, users, and view analytics
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full"></div>
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                <StatCard 
                  title="Total Quizzes" 
                  value={stats.totalQuizzes} 
                  subtitle={`${stats.activeQuizzes} active`}
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  }
                />
                
                <StatCard 
                  title="Total Users" 
                  value={stats.totalUsers}
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  }
                />
                
                <StatCard 
                  title="Quiz Attempts" 
                  value={stats.totalAttempts}
                  subtitle={`${stats.recentAttempts} in the last period`}
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  }
                  color="green"
                />
                
                <StatCard 
                  title="Average Score" 
                  value={`${stats.avgScore}%`}
                  subtitle={`Most popular: ${stats.topQuiz.title}`}
                  icon={
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                    </svg>
                  }
                  color="blue"
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
                {/* Recent Quizzes */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Recent Quizzes</h2>
                    <Link href="/admin/quizzes" className="text-sm text-purple-600 hover:text-purple-800">
                      View All
                    </Link>
                  </div>
                  
                  {recentQuizzes.length > 0 ? (
                    <div className="divide-y">
                      {recentQuizzes.map((quiz) => (
                        <div key={quiz.id} className="py-3">
                          <div className="flex justify-between">
                            <Link 
                              href={`/admin/quizzes/${quiz.id}`}
                              className="font-medium text-gray-900 hover:text-purple-700"
                            >
                              {quiz.title}
                            </Link>
                            <span className={`text-xs px-2 py-1 rounded-full ${quiz.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                              {quiz.active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-sm text-gray-500">{quiz.questionCount} questions</span>
                            <span className="text-sm text-gray-500">
                              {quiz.createdAt instanceof Date 
                                ? quiz.createdAt.toLocaleDateString()
                                : 'Date unavailable'
                              }
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-6">No quizzes created yet</p>
                  )}
                  
                  <div className="mt-4">
                    <Link 
                      href="/admin/quizzes/create-quiz"
                      className="w-full block text-center px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200"
                    >
                      Create New Quiz
                    </Link>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">Recent Activity</h2>
                    <Link href="/admin/quiz-reports" className="text-sm text-purple-600 hover:text-purple-800">
                      View All Reports
                    </Link>
                  </div>
                  
                  {recentActivity.length > 0 ? (
                    <div className="divide-y">
                      {recentActivity.map((activity) => (
                        <div key={activity.id} className="py-3">
                          <div className="flex justify-between">
                            <span className="font-medium text-gray-900">{activity.userName}</span>
                            <span className="text-sm text-gray-500">
                              {activity.timestamp instanceof Date 
                                ? activity.timestamp.toLocaleString()
                                : 'Date unavailable'
                              }
                            </span>
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-sm text-gray-500">
                              Completed <span className="text-purple-700">{activity.quizTitle}</span>
                            </span>
                            <span className="font-medium text-sm">
                              Score: {activity.score}/{activity.totalQuestions}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-6">No quiz attempts yet</p>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-10">
                <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Link
                    href="/admin/quizzes/create-quiz"
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-purple-50 hover:border-purple-200 transition-colors"
                  >
                    <div className="rounded-full bg-purple-100 p-3 mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium">Create Quiz</h3>
                      <p className="text-sm text-gray-500">Add a new quiz for students</p>
                    </div>
                  </Link>
                  
                  <Link
                    href="/admin/users"
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors"
                  >
                    <div className="rounded-full bg-blue-100 p-3 mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium">Manage Users</h3>
                      <p className="text-sm text-gray-500">View and edit user accounts</p>
                    </div>
                  </Link>
                  
                  <Link
                    href="/admin/quiz-reports"
                    className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-green-50 hover:border-green-200 transition-colors"
                  >
                    <div className="rounded-full bg-green-100 p-3 mr-4">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium">View Reports</h3>
                      <p className="text-sm text-gray-500">Analyze quiz performance</p>
                    </div>
                  </Link>
                </div>
              </div>
            </>
          )}
        </AdminProtected>
      </div>
    </>
  );
}
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
          href="/quizzes/create-quiz"
          className="inline-flex items-center text-black px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-purple-primary hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
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
