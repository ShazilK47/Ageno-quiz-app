"use client";

import useSWR from "swr";
import { Quiz, QuizSubmission } from "@/firebase/firestore";
import {
  getQuizById,
  getQuizByAccessCode,
  getQuizzesByUser,
  getQuizSubmissions,
  getUserSubmissions,
} from "@/services/quizService";

/**
 * Custom hook to fetch a quiz by ID with SWR for caching and revalidation
 */
export function useQuiz(quizId: string | undefined | null) {
  const { data, error, isLoading, mutate } = useSWR(
    quizId ? `quiz/${quizId}` : null,
    () => (quizId ? getQuizById(quizId) : null)
  );

  return {
    quiz: data as Quiz | null,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Custom hook to fetch a quiz by access code with SWR
 */
export function useQuizByAccessCode(accessCode: string | undefined | null) {
  const { data, error, isLoading, mutate } = useSWR(
    accessCode ? `quiz/code/${accessCode}` : null,
    () => (accessCode ? getQuizByAccessCode(accessCode) : null)
  );

  return {
    quiz: data as Quiz | null,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Custom hook to fetch quizzes created by a user with SWR
 */
export function useUserQuizzes(userId: string | undefined | null) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? `quizzes/user/${userId}` : null,
    () => (userId ? getQuizzesByUser(userId) : [])
  );

  return {
    quizzes: data as Quiz[] | undefined,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Custom hook to fetch submissions for a quiz with SWR
 */
export function useQuizSubmissions(quizId: string | undefined | null) {
  const { data, error, isLoading, mutate } = useSWR(
    quizId ? `submissions/quiz/${quizId}` : null,
    () => (quizId ? getQuizSubmissions(quizId) : [])
  );

  return {
    submissions: data as QuizSubmission[] | undefined,
    isLoading,
    isError: error,
    mutate,
  };
}

/**
 * Custom hook to fetch submissions by a user with SWR
 */
export function useUserSubmissions(userId: string | undefined | null) {
  const { data, error, isLoading, mutate } = useSWR(
    userId ? `submissions/user/${userId}` : null,
    () => (userId ? getUserSubmissions(userId) : [])
  );

  return {
    submissions: data as QuizSubmission[] | undefined,
    isLoading,
    isError: error,
    mutate,
  };
}
