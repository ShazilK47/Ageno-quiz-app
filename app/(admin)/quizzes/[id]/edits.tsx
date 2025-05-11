"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/client";
import { handleFirebaseError } from "@/firebase/utils";
import AdminProtected from "@/components/AdminProtected";
import QuizForm from "@/components/quiz/QuizForm";
import Header from "@/components/Header";

// Define the QuizQuestion type
interface QuizQuestion {
  id: string;
  text: string;
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
  points: number;
  imageUrl?: string;
}

// Define the Quiz type
interface Quiz {
  id?: string;
  title: string;
  description: string;
  active: boolean;
  timeLimit: number;
  code: string;
  questions: QuizQuestion[];
  autoCheck?: boolean;
}

export default function EditQuizPage() {
  const params = useParams();
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    if (params.id) {
      const id = typeof params.id === "string" ? params.id : params.id[0];
      fetchQuizDetails(id);
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
        timeLimit: quizData.timeLimit || 30,
        code: quizData.code || "",
        questions: quizData.questions || [],
        autoCheck: quizData.autoCheck,
      });
    } catch (err) {
      const formattedError = handleFirebaseError(err);
      console.error("Error fetching quiz details:", formattedError);
      setError(formattedError.message);
    } finally {
      setLoading(false);
    }
  };
  const handleSuccess = (quizId: string) => {
    // Navigate back to quiz details page after update
    setTimeout(() => {
      router.push(`/admin/quizzes/${quizId}`);
    }, 1500);
  };

  return (
    <>
      <Header />
      <div className="container mx-auto p-6">
        <AdminProtected
          fallback={
            <div className="p-6 text-center">
              <h3 className="text-lg font-medium text-gray-900">
                You need administrator privileges to edit quizzes
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                Please contact an administrator if you need access.
              </p>
            </div>
          }
        >
          <div className="mb-6 flex items-center">
            <button
              onClick={() => router.back()}
              className="mr-4 text-gray-600 hover:text-gray-900 flex items-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Edit Quiz</h1>
          </div>

          {loading ? (
            <div className="flex justify-center items-center my-12">
              <div className="animate-spin h-12 w-12 border-4 border-purple-500 border-t-transparent rounded-full"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => router.push("/admin/quizzes")}
                className="mt-4 px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300 text-gray-700"
              >
                Back to Quizzes
              </button>
            </div>
          ) : (
            <QuizForm
              mode="edit"
              initialQuiz={quiz || undefined}
              onSubmitSuccess={handleSuccess}
            />
          )}
        </AdminProtected>
      </div>
    </>
  );
}
