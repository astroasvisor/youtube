import React from "react"
import {
  Composition,
  continueRender,
  delayRender,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
  Audio,
} from "remotion"
import { QuizQuestion } from "./QuizQuestion"

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
  const totalDuration = questions.length * 20 // 20 seconds per question (10s question + 10s answer)

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
}> = ({ questions }) => {
  const { fps, durationInFrames } = useVideoConfig()

  // Calculate timing for the entire video
  const questionDuration = 10 * fps // 10 seconds per question
  const answerDuration = 10 * fps // 10 seconds per answer
  const totalPerQuestion = questionDuration + answerDuration

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: "linear-gradient(135deg, #4F46E5 0%, #059669 100%)",
        position: "relative",
      }}
    >
      {/* Continuous background music */}
      <Sequence from={0} durationInFrames={durationInFrames}>
        <Audio
          src={staticFile("audio/background-music.mp3")}
          startFrom={0}
          volume={0.1}
          loop={true}
        />
      </Sequence>

      {/* Sequence for each question */}
      {questions.map((question, index) => (
        <Sequence
          key={question.id}
          from={index * totalPerQuestion}
          durationInFrames={totalPerQuestion}
        >
          <QuizQuestion question={question} />
        </Sequence>
      ))}
    </div>
  )
}
