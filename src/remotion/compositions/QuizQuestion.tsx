import React from "react"
import { useCurrentFrame, useVideoConfig, spring, Audio, staticFile } from "remotion"

/*
🎵 AUDIO FILES CONFIGURED:
Your audio files are set up and ready to use:

✓ celebration.mp3 (1s) - Positive success chime for answer reveals
✓ background-music.mp3 (29s) - Subtle ambient music (loops automatically)
✓ timer-with-chime.mp3 (12s) - Combined timer + chime sound for question phase

Volume levels are optimized:
- Timer: 40% (clear but not overwhelming)
- Celebration: 70% (rewarding success feedback)
- Background: 10% (subtle brand presence)

All audio timing is synchronized with the 20-second video structure.
*/

interface Question {
  id: string
  text: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: "A" | "B" | "C" | "D"
  explanation: string
}

export const QuizQuestion: React.FC<{
  question: Question
}> = ({ question }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // 20 second total duration: 10s question + 10s answer reveal
  const questionPhaseFrames = 10 * fps
  const answerPhaseFrames = 10 * fps

  const isQuestionPhase = frame < questionPhaseFrames
  const isAnswerPhase = frame >= questionPhaseFrames

  // Question phase countdown
  const questionRemainingTime = Math.max(0, 10 - frame / fps)
  const countdownSize = Math.max(
    20,
    100 - (frame / questionPhaseFrames) * 80,
  ) // Shrinking effect

  // --- Animation Logic ---

  // Smoother entrance animations for options
  const optionsStartFrame = 25
  const optionDelay = 10
  const getOptionEntrance = (index: number) => {
    const startFrame = optionsStartFrame + index * optionDelay
    return spring({
      frame: frame - startFrame,
      fps,
      config: {
        damping: 400,
        stiffness: 60,
        mass: 1.5,
      },
      from: 150,
      to: 0,
    })
  }

  const getOptionOpacity = (index: number) => {
    const startFrame = optionsStartFrame + index * optionDelay
    return spring({
      frame: frame - startFrame,
      fps,
      config: { damping: 200, stiffness: 100, mass: 1 },
      from: 0,
      to: 1,
    })
  }

  // Timer pulse animation
  const timerPulse = 1 + Math.sin(frame / 10) * 0.05

  // Cross-fade animation between question and answer elements
  const questionElementsOpacity = spring({
    frame: frame - (questionPhaseFrames - fps * 0.5),
    fps,
    config: { damping: 200, stiffness: 50 },
    from: 1,
    to: 0,
  })

  const answerElementsOpacity = spring({
    frame: frame - questionPhaseFrames,
    fps,
    config: { damping: 200, stiffness: 50 },
    from: 0,
    to: 1,
  })

  // --- Confetti Logic ---

  interface ConfettiParticle {
    x: string
    y: string
    rotation: number
    color: string
    scale: number
  }

  const confettiCount = 35
  const confettiParticles = Array.from({ length: confettiCount }, (_, i) => {
    const delay = (i / confettiCount) * 0.8
    const startFrame = questionPhaseFrames + delay * fps
    const particleProgress = Math.max(0, (frame - startFrame) / (3 * fps))

    if (particleProgress >= 1) return null

    const x = 5 + (i / confettiCount) * 90 + Math.sin(particleProgress * Math.PI * 10) * 5
    const y = particleProgress * 95
    const rotation = particleProgress * 360 * 6
    const colors = ['#fbbf24', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#84cc16', '#06b6d4', '#8b5a2b']
    const color = colors[i % colors.length]

    return {
      x: `${x}%`,
      y: `${y}%`,
      rotation,
      color,
      scale: 0.3 + Math.sin(particleProgress * Math.PI) * 1.0,
    }
  }).filter(Boolean) as ConfettiParticle[]

  // --- Audio Logic ---
  const shouldPlayTimerAudio = isQuestionPhase
  const celebrationSoundFrame = questionPhaseFrames + fps * 0.3
  const shouldPlayCelebration = frame >= celebrationSoundFrame && frame < celebrationSoundFrame + fps * 1.2

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      {/* --- Question Phase Elements --- */}
      <div
        style={{
          opacity: questionElementsOpacity,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          padding: "90px 40px 60px 40px",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        {/* Timer */}
        <div
          style={{
            position: "absolute",
            top: "30px",
            right: "40px",
          }}
        >
          <div
            style={{
              width: `${countdownSize * timerPulse}px`,
              height: `${countdownSize * timerPulse}px`,
              borderRadius: "50%",
              background: "rgba(251, 191, 36, 0.9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "4px solid white",
              boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
              transition: "all 0.1s ease",
            }}
          >
            <span
              style={{
                fontSize: `${countdownSize * 0.35}px`,
                fontWeight: "800",
                color: "white",
                textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
              }}
            >
              {Math.ceil(questionRemainingTime)}
            </span>
          </div>
        </div>

        {/* Question Card */}
        <div
          style={{
            background: "rgba(255,255,255,0.98)",
            borderRadius: "24px",
            padding: "50px 45px",
            marginBottom: "30px",
            width: "96%",
            maxWidth: "1100px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
            border: "1px solid rgba(255,255,255,0.2)",
            position: "relative",
          }}
        >
          <h2
            style={{
              fontSize: "44px",
              fontWeight: "700",
              color: "#1f2937",
              textAlign: "center",
              lineHeight: "1.3",
              fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            }}
          >
            {question.text}
          </h2>
        </div>

        {/* Options */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            width: "96%",
            maxWidth: "1100px",
          }}
        >
          {[
            { letter: "A", text: question.optionA },
            { letter: "B", text: question.optionB },
            { letter: "C", text: question.optionC },
            { letter: "D", text: question.optionD },
          ].map((option, index) => (
            <div
              key={option.letter}
              style={{
                background: "#ffffff",
                borderRadius: "20px",
                padding: "30px 35px",
                border: "3px solid #e2e8f0",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                transform: `translateX(${getOptionEntrance(index)}px)`,
                opacity: getOptionOpacity(index),
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                }}
              >
                <span
                  style={{
                    background: "#1e40af",
                    color: "white",
                    width: "60px",
                    height: "60px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "25px",
                    fontSize: "28px",
                    fontWeight: "bold",
                    flexShrink: 0,
                  }}
                >
                  {option.letter}
                </span>
                <span
                  style={{
                    flex: 1,
                    fontSize: "28px",
                    fontWeight: "500",
                    color: "#374151",
                    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                  }}
                >
                  {option.text}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* --- Answer Phase Elements --- */}
      <div
        style={{
          opacity: answerElementsOpacity,
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "flex-start",
          padding: "90px 40px 60px 40px",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      >
        {/* Answer Title */}
        <div
          style={{
            background: "rgba(255,255,255,0.98)",
            borderRadius: "24px",
            padding: "40px 45px",
            marginBottom: "30px",
            width: "96%",
            maxWidth: "1100px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
          }}
        >
          <h3
            style={{
              fontSize: "42px",
              fontWeight: "700",
              color: "#1f2937",
              textAlign: "center",
              fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            }}
          >
            Answer
          </h3>
        </div>

        {/* Options with correct/incorrect indication */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            marginBottom: "30px",
            width: "96%",
            maxWidth: "1100px",
          }}
        >
          {[
            { letter: "A", text: question.optionA },
            { letter: "B", text: question.optionB },
            { letter: "C", text: question.optionC },
            { letter: "D", text: question.optionD },
          ].map((option) => {
            const isCorrect = option.letter === question.correctAnswer
            return (
              <div
                key={option.letter}
                style={{
                  background: isCorrect ? "#dcfce7" : "#fef2f2",
                  borderRadius: "20px",
                  padding: "30px 35px",
                  border: `4px solid ${isCorrect ? "#16a34a" : "#dc2626"}`,
                  boxShadow: `0 8px 20px ${
                    isCorrect
                      ? "rgba(22, 163, 74, 0.3)"
                      : "rgba(220, 38, 38, 0.3)"
                  }`,
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <span
                    style={{
                      background: isCorrect ? "#16a34a" : "#dc2626",
                      color: "white",
                      width: "60px",
                      height: "60px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: "25px",
                      fontSize: "28px",
                      fontWeight: "bold",
                      flexShrink: 0,
                    }}
                  >
                    {option.letter}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      fontSize: "28px",
                      fontWeight: "500",
                      color: "#374151",
                      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                    }}
                  >
                    {option.text}
                  </span>
                  {isCorrect ? (
                    <span style={{ color: "#16a34a", fontSize: "36px" }}>✓</span>
                  ) : (
                    <span style={{ color: "#dc2626", fontSize: "32px" }}>✗</span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        {/* Explanation Card */}
        <div style={{
          background: "rgba(255,255,255,0.98)",
          borderRadius: "24px",
          padding: "45px 50px",
          width: "96%",
          maxWidth: "1100px",
          boxShadow: "0 15px 40px rgba(0,0,0,0.3)",
        }}>
          <h4 style={{
            fontSize: "32px",
            fontWeight: "bold",
            color: "#0ea5e9",
            marginBottom: "20px",
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
          }}>
            Explanation
          </h4>
          <p style={{
            fontSize: "26px",
            color: "#374151",
            lineHeight: "1.4",
            fontWeight: "500",
            fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
          }}>
            {question.explanation}
          </p>
        </div>
      </div>

      {/* --- Shared Elements (Audio & Confetti) --- */}
      {shouldPlayTimerAudio && (
        <Audio
          src={staticFile("audio/timer-with-chime.mp3")}
          startFrom={0}
          volume={0.4}
        />
      )}
      {shouldPlayCelebration && (
        <Audio
          src={staticFile("audio/celebration.mp3")}
          startFrom={0}
          volume={0.7}
        />
      )}
      {isAnswerPhase &&
        confettiParticles.map((particle, index) => (
          <div
            key={index}
            style={{
              position: "fixed",
              left: particle.x,
              top: particle.y,
              width: "16px",
              height: "16px",
              background: particle.color,
              borderRadius: Math.random() > 0.5 ? "50%" : "4px",
              transform: `rotate(${particle.rotation}deg) scale(${particle.scale})`,
              zIndex: 999,
            }}
          />
        ))}
    </div>
  )
}
