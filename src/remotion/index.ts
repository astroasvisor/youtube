import { registerRoot } from "remotion"
import React from "react"
import { QuizVideo } from "./compositions/QuizVideo"

// Default sample data for testing
const defaultQuestions: Array<{
  id: string
  text: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: "A" | "B" | "C" | "D"
  explanation: string
}> = [
  {
    id: "1",
    text: "What is the capital of France?",
    optionA: "London",
    optionB: "Berlin",
    optionC: "Paris",
    optionD: "Madrid",
    correctAnswer: "C",
    explanation: "Paris is the capital and most populous city of France.",
  },
  {
    id: "2",
    text: "Which planet is known as the Red Planet?",
    optionA: "Venus",
    optionB: "Mars",
    optionC: "Jupiter",
    optionD: "Saturn",
    correctAnswer: "B",
    explanation: "Mars is called the Red Planet because of its reddish appearance due to iron oxide on its surface.",
  },
]

// Create a root component that renders the QuizVideo composition
const DynamicQuizVideoRoot: React.FC = () => {
  return React.createElement("div", null,
    React.createElement(QuizVideo, {
      questions: defaultQuestions,
      title: "Geography Quiz"
    })
  )
}

// Register the root component
registerRoot(DynamicQuizVideoRoot)
