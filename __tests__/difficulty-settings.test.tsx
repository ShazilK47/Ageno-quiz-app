// tests/difficulty-settings.test.tsx
import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { act } from "react-dom/test-utils";
import mockRouter from "next-router-mock";
import DifficultySettings from "@/components/quiz/DifficultySettings";
import DifficultySelect from "@/components/quiz/DifficultySelect";
import QuizForm from "@/components/quiz/QuizForm";
import * as firestore from "@/firebase/firestore";
import test, { describe, beforeEach } from "node:test";

// Mock the useFirestore hook
jest.mock("@/hooks/useFirestore", () => ({
  useFirestore: jest.fn(() => ({
    createDocument: jest.fn().mockResolvedValue({ id: "mock-quiz-id" }),
    updateDocument: jest.fn().mockResolvedValue(true),
    isLoading: false,
  })),
}));

// Mock the useAuth hook
jest.mock("@/contexts/auth-context", () => ({
  useAuth: jest.fn(() => ({
    user: { uid: "mock-user-id" },
  })),
}));

// Mock the quiz difficulty functions
jest.mock("@/firebase/quizDifficulty", () => ({
  saveAllQuestionsByDifficulty: jest.fn().mockResolvedValue(true),
  getQuestionsByDifficulty: jest.fn().mockResolvedValue([]),
}));

// Mock router
jest.mock("next/navigation", () => require("next-router-mock"));

describe("Difficulty Settings Component", () => {
  test("renders difficulty settings correctly", () => {
    const mockSettings = {
      easy: { duration: 30, pointsMultiplier: 1.0 },
      medium: { duration: 25, pointsMultiplier: 1.5 },
      hard: { duration: 20, pointsMultiplier: 2.0 },
    };

    const handleDurationChange = jest.fn();
    const handleMultiplierChange = jest.fn();

    render(
      <DifficultySettings
        availableDifficulties={["easy", "medium", "hard"]}
        difficultySettings={mockSettings}
        onDurationChange={handleDurationChange}
        onMultiplierChange={handleMultiplierChange}
      />
    );

    // Check if difficulty settings title is displayed
    expect(screen.getByText("Difficulty Settings")).toBeInTheDocument();

    // Check if all difficulty levels are rendered
    expect(screen.getByText("Easy Difficulty")).toBeInTheDocument();
    expect(screen.getByText("Medium Difficulty")).toBeInTheDocument();
    expect(screen.getByText("Hard Difficulty")).toBeInTheDocument();

    // Check if the duration and multiplier inputs are present with correct values
    const durationInputs = screen.getAllByLabelText(/Time Limit/);
    expect(durationInputs).toHaveLength(3);
    expect(durationInputs[0]).toHaveValue(30);
    expect(durationInputs[1]).toHaveValue(25);
    expect(durationInputs[2]).toHaveValue(20);

    const multiplierInputs = screen.getAllByLabelText(/Points Multiplier/);
    expect(multiplierInputs).toHaveLength(3);
    expect(multiplierInputs[0]).toHaveValue(1.0);
    expect(multiplierInputs[1]).toHaveValue(1.5);
    expect(multiplierInputs[2]).toHaveValue(2.0);
  });

  test("updates duration when changed", () => {
    const mockSettings = {
      easy: { duration: 30, pointsMultiplier: 1.0 },
      medium: { duration: 25, pointsMultiplier: 1.5 },
      hard: { duration: 20, pointsMultiplier: 2.0 },
    };

    const handleDurationChange = jest.fn();
    const handleMultiplierChange = jest.fn();

    render(
      <DifficultySettings
        availableDifficulties={["easy", "medium", "hard"]}
        difficultySettings={mockSettings}
        onDurationChange={handleDurationChange}
        onMultiplierChange={handleMultiplierChange}
      />
    );

    // Get the duration input for easy difficulty
    const easyDurationInput = screen.getAllByLabelText(/Time Limit/)[0];

    // Change the duration value
    fireEvent.change(easyDurationInput, { target: { value: 40 } });

    // Check if the handler was called with the correct parameters
    expect(handleDurationChange).toHaveBeenCalledWith("easy", 40);
  });

  test("updates multiplier when changed", () => {
    const mockSettings = {
      easy: { duration: 30, pointsMultiplier: 1.0 },
      medium: { duration: 25, pointsMultiplier: 1.5 },
      hard: { duration: 20, pointsMultiplier: 2.0 },
    };

    const handleDurationChange = jest.fn();
    const handleMultiplierChange = jest.fn();

    render(
      <DifficultySettings
        availableDifficulties={["easy", "medium", "hard"]}
        difficultySettings={mockSettings}
        onDurationChange={handleDurationChange}
        onMultiplierChange={handleMultiplierChange}
      />
    );

    // Get the multiplier input for medium difficulty
    const mediumMultiplierInput =
      screen.getAllByLabelText(/Points Multiplier/)[1];

    // Change the multiplier value
    fireEvent.change(mediumMultiplierInput, { target: { value: 2.5 } });

    // Check if the handler was called with the correct parameters
    expect(handleMultiplierChange).toHaveBeenCalledWith("medium", 2.5);
  });
});

describe("Difficulty Select Component", () => {
  test("renders difficulty options correctly", () => {
    const handleSelectDifficulty = jest.fn();

    render(
      <DifficultySelect
        availableDifficulties={["easy", "medium", "hard"]}
        selectedDifficulty="medium"
        onSelectDifficulty={handleSelectDifficulty}
      />
    );

    // Check if title is displayed
    expect(screen.getByText("Select Difficulty Level:")).toBeInTheDocument();

    // Check if all difficulty buttons are rendered
    expect(screen.getByText("Easy")).toBeInTheDocument();
    expect(screen.getByText("Medium")).toBeInTheDocument();
    expect(screen.getByText("Hard")).toBeInTheDocument();

    // Check if the correct difficulty is selected (medium)
    const mediumButton = screen.getByText("Medium").closest("button");
    expect(mediumButton).toHaveClass("bg-purple-600");
    expect(mediumButton).toHaveClass("text-white");

    // Check if other difficulties are not selected
    const easyButton = screen.getByText("Easy").closest("button");
    expect(easyButton).not.toHaveClass("bg-purple-600");
    expect(easyButton).not.toHaveClass("text-white");
  });

  test("calls onSelectDifficulty when a difficulty is clicked", () => {
    const handleSelectDifficulty = jest.fn();

    render(
      <DifficultySelect
        availableDifficulties={["easy", "medium", "hard"]}
        selectedDifficulty="medium"
        onSelectDifficulty={handleSelectDifficulty}
      />
    );

    // Click on the easy difficulty button
    fireEvent.click(screen.getByText("Easy"));

    // Check if the handler was called with the correct parameter
    expect(handleSelectDifficulty).toHaveBeenCalledWith("easy");
  });
});

describe("Quiz Form with Difficulty Settings", () => {
  const mockInitialQuiz = {
    title: "Test Quiz",
    description: "This is a test quiz",
    timeLimit: 30,
    active: true,
    code: "TEST123",
    questions: [],
    availableDifficulties: ["medium"],
    difficultySettings: {
      easy: { duration: 30, pointsMultiplier: 1.0 },
      medium: { duration: 25, pointsMultiplier: 1.5 },
      hard: { duration: 20, pointsMultiplier: 2.0 },
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("renders difficulty settings section when availableDifficulties exist", async () => {
    render(<QuizForm initialQuiz={mockInitialQuiz} mode="edit" />);

    // Wait for the component to finish rendering
    await waitFor(() => {
      // Check if the difficulty settings section is rendered
      expect(screen.getByText("Difficulty Settings")).toBeInTheDocument();
    });
  });

  test("can toggle available difficulties", async () => {
    render(<QuizForm initialQuiz={mockInitialQuiz} mode="edit" />);

    // Wait for component to finish rendering
    await waitFor(() => {
      expect(screen.getByText("Easy")).toBeInTheDocument();
    });

    // Initially only medium should be enabled
    const easyButton = screen.getAllByText("Easy")[1]; // Get the toggle button, not the tab
    const mediumButton = screen.getAllByText("Medium")[1]; // Get the toggle button, not the tab

    // Medium should be enabled (selected)
    expect(mediumButton.closest("button")).toHaveClass("bg-purple-600");

    // Easy should be disabled (not selected)
    expect(easyButton.closest("button")).not.toHaveClass("bg-purple-600");

    // Click on Easy to enable it
    fireEvent.click(easyButton);

    // Now both Easy and Medium should be enabled
    await waitFor(() => {
      expect(easyButton.closest("button")).toHaveClass("bg-purple-600");
      expect(mediumButton.closest("button")).toHaveClass("bg-purple-600");
    });
  });
});

describe("Quiz Taking with Difficulty Settings", () => {
  // This would test the quiz-taking experience with difficulty settings
  // You'd need to mock the getQuizByCode function and other dependencies

  test("displays correct duration based on selected difficulty", async () => {
    // Implement this test to verify that the correct duration is displayed
    // based on the selected difficulty level
  });

  test("applies correct point multiplier when calculating score", async () => {
    // Implement this test to verify that the correct point multiplier is applied
    // when calculating the final score
  });

  // Add more test cases as needed
});
