import React from "react"
import {
  Composition,
  continueRender,
  delayRender,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion"
import { QuizQuestion } from "./QuizQuestion"
import { QuizAnswer } from "./QuizAnswer"

export interface Question {
  id: string
  text: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: "A" | "B" | "C" | "D"
  explanation: string
}

export const QuizVideo: React.FC<{
  questions: Question[]
  title: string
}> = ({ questions, title }) => {
  const totalDuration = questions.length * 15 // 15 seconds per question (10s question + 5s answer)

  return (
    <Composition
      id="QuizVideo"
      component={QuizVideoComposition}
      durationInFrames={Math.floor(totalDuration * 30)} // 30fps
      fps={30}
      width={1080}
      height={1920} // 9:16 aspect ratio for YouTube Shorts
      defaultProps={{
        questions,
        title,
      }}
    />
  )
}

const QuizVideoComposition: React.FC<{
  questions: Question[]
  title: string
}> = ({ questions, title }) => {
  const frame = useCurrentFrame()
  const { fps, durationInFrames } = useVideoConfig()

  // Calculate timing for the entire video
  const questionDuration = 10 * fps // 10 seconds per question
  const answerDuration = 5 * fps   // 5 seconds per answer
  const totalPerQuestion = questionDuration + answerDuration

  // Determine which question we're currently showing
  const currentQuestionIndex = Math.floor(frame / totalPerQuestion)
  const frameInCycle = frame % totalPerQuestion

  // Determine if we're in question phase or answer phase
  const isQuestionPhase = frameInCycle < questionDuration
  const isAnswerPhase = frameInCycle >= questionDuration

  // Get current question
  const currentQuestion = questions[currentQuestionIndex] || questions[0]

  return (
    <div style={{
      width: "100%",
      height: "100%",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      fontFamily: "Arial, sans-serif",
      position: "relative",
    }}>
      {/* Show question or answer based on timing */}
      {isQuestionPhase ? (
        <QuizQuestion question={currentQuestion} />
      ) : (
        <QuizAnswer question={currentQuestion} />
      )}
    </div>
  )
}
