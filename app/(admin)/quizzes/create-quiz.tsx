"use client";

import { useRouter } from "next/navigation";
import AdminProtected from "@/components/AdminProtected";
import QuizForm from "@/components/quiz/QuizForm";
import Header from "@/components/Header";

export default function CreateQuizPage() {
  const router = useRouter();

  const handleSuccess = (quizId: string) => {
    // Navigate to quiz details page after creation
    router.push(`/admin/quizzes/${quizId}`);
  };

  return (
    <>
      <Header />
      <div className="container mx-auto p-6">
        <AdminProtected
          fallback={
            <div className="p-6 text-center">
              <h3 className="text-lg font-medium text-gray-900">
                You need administrator privileges to create quizzes
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
            <h1 className="text-2xl font-bold text-gray-900">
              Create New Quiz
            </h1>
          </div>

          <QuizForm mode="create" onSubmitSuccess={handleSuccess} />
        </AdminProtected>
      </div>
    </>
  );
}
