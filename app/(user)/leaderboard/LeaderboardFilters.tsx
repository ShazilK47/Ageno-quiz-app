"use client";

import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/client";

interface LeaderboardFiltersProps {
  timeFrame: "all" | "week" | "month";
  category: string;
  difficulty: string;
  onFilterChange: (
    type: "timeFrame" | "category" | "difficulty",
    value: string
  ) => void;
}

export default function LeaderboardFilters({
  timeFrame,
  category,
  difficulty,
  onFilterChange,
}: LeaderboardFiltersProps) {
  const [categories, setCategories] = useState<
    Array<{ id: string; title: string }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch categories from Firestore
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoading(true);
        const quizzesCollection = collection(db, "quizzes");
        const quizSnapshot = await getDocs(quizzesCollection);

        const uniqueCategories = new Map<string, string>();

        quizSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          // Use either title or id as the category identifier
          const title = data.title || doc.id;
          uniqueCategories.set(doc.id, title);
        });

        const categoryArray = Array.from(uniqueCategories.entries()).map(
          ([id, title]) => ({
            id,
            title,
          })
        );

        setCategories(categoryArray);
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, []);
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm mb-6">
      <div className="mb-3">
        <h3 className="font-medium text-gray-800">
          {category
            ? `Viewing: ${
                categories.find((c) => c.id === category)?.title ||
                "Quiz Rankings"
              }`
            : "Global Rankings"}
        </h3>
        <p className="text-sm text-gray-500">
          {category
            ? "Showing specific quiz performance ranked by score, time and difficulty"
            : "Showing overall user performance across all completed quizzes"}
        </p>
      </div>
      <div className="flex flex-wrap gap-4 items-end">
        {/* Time Period Filter */}
        <div className="flex-1 min-w-[180px]">
          <label className="text-sm font-medium block mb-2 text-gray-700">
            Time Period
          </label>
          <div className="flex bg-gray-100 rounded-lg overflow-hidden">
            <button
              onClick={() => onFilterChange("timeFrame", "all")}
              className={`flex-1 px-4 py-2 text-sm ${
                timeFrame === "all"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => onFilterChange("timeFrame", "month")}
              className={`flex-1 px-4 py-2 text-sm ${
                timeFrame === "month"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              Month
            </button>
            <button
              onClick={() => onFilterChange("timeFrame", "week")}
              className={`flex-1 px-4 py-2 text-sm ${
                timeFrame === "week"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              Week
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex-1 min-w-[180px]">
          <label className="text-sm font-medium block mb-2 text-gray-700">
            Quiz
          </label>
          <select
            value={category}
            onChange={(e) => onFilterChange("category", e.target.value)}
            className="w-full rounded-lg border-gray-300 py-2 px-3 bg-white border text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            disabled={isLoading}
          >
            <option value="">All Quizzes</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.title}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty Filter */}
        <div className="flex-1 min-w-[180px]">
          <label className="text-sm font-medium block mb-2 text-gray-700">
            Difficulty
          </label>
          <select
            value={difficulty}
            onChange={(e) => onFilterChange("difficulty", e.target.value)}
            className="w-full rounded-lg border-gray-300 py-2 px-3 bg-white border text-gray-700 shadow-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Difficulties</option>
            <option value="basic">Basic</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </div>
      </div>
    </div>
  );
}
