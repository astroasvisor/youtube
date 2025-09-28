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
import { IntroScreen } from "./IntroScreen"
import { ReadyForTeaser } from "./ReadyForTeaser"

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
  // 5 seconds intro + 50 seconds per question (35s question + 15s answer)
  const introDuration = 6 // 3s intro + 3s teaser
  const totalDuration = introDuration + (questions.length * 50)

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
  const introDuration = 3 * fps // 3 seconds for intro screen
  const teaserDuration = 3 * fps // 3 seconds for teaser screen
  const questionDuration = 35 * fps // 35 seconds per question
  const answerDuration = 15 * fps // 15 seconds per answer
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
      {/* Background music - starts at t=3s (at teaser screen onset) */}
      <Sequence from={3 * fps} durationInFrames={durationInFrames - (3 * fps)}>
        <Audio
          src={staticFile("audio/background-music.mp3")}
          startFrom={0}
          volume={0.08}
          loop={true}
        />
      </Sequence>

      {/* Intro Screen - 3 seconds */}
      <Sequence from={0} durationInFrames={introDuration}>
        <IntroScreen />
      </Sequence>

      {/* Teaser Screen - 2 seconds */}
      <Sequence from={introDuration} durationInFrames={teaserDuration}>
        <ReadyForTeaser />
      </Sequence>

      {/* Sequence for each question - starts after 5 second intro */}
      {questions.map((question, index) => (
        <Sequence
          key={question.id}
          from={(6 * fps) + (index * totalPerQuestion)}
          durationInFrames={totalPerQuestion}
        >
          <QuizQuestion question={question} />
        </Sequence>
      ))}
    </div>
  )
}
