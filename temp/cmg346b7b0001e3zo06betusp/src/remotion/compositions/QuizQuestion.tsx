import React from "react"
import { useCurrentFrame, useVideoConfig, spring, Audio } from "remotion"

/*
🎵 AUDIO FILES CONFIGURED:
Your audio files are set up and ready to use:

✓ celebration.mp3 (1s) - Positive success chime for answer reveals
✓ background-music.mp3 (29s) - Subtle ambient music (loops automatically)
✓ timer-with-chime.mp3 (12s) - Combined timer + chime sound for question phase

Volume levels are optimized:
- Timer: 40% (clear but not overwhelming)
- Celebration: 50% (rewarding success feedback)
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
  const totalFrames = questionPhaseFrames + answerPhaseFrames

  const isQuestionPhase = frame < questionPhaseFrames
  const isAnswerPhase = frame >= questionPhaseFrames

  // Question phase countdown
  const questionRemainingTime = Math.max(0, 10 - (isQuestionPhase ? frame / fps : 0))
  const countdownSize = Math.max(20, 100 - (isQuestionPhase ? (frame / questionPhaseFrames) * 80 : 80)) // Shrinking effect

  // Entrance animations
  const questionEntrance = spring({
    frame,
    fps,
    config: {
      damping: 200,
      stiffness: 100,
      mass: 1,
    },
    from: frame < 10 ? -50 : 0,
    to: 0,
  })

  const optionsStartFrame = 15
  const optionDelay = 5
  const getOptionEntrance = (index: number) => {
    const startFrame = optionsStartFrame + (index * optionDelay)
    return spring({
      frame: frame - startFrame,
      fps,
      config: {
        damping: 200,
        stiffness: 100,
        mass: 1,
      },
      from: frame < startFrame ? 100 : 0,
      to: 0,
    })
  }

  const getOptionOpacity = (index: number) => {
    const startFrame = optionsStartFrame + (index * optionDelay)
    return spring({
      frame: frame - startFrame,
      fps,
      config: {
        damping: 200,
        stiffness: 100,
        mass: 1,
      },
      from: frame < startFrame ? 0 : 1,
      to: 1,
    })
  }

  // Timer pulse animation
  const timerPulse = 1 + Math.sin(frame / 10) * 0.05 // Subtle pulsing effect

  // Answer reveal animations
  const answerRevealProgress = Math.max(0, (frame - questionPhaseFrames) / answerPhaseFrames)
  const correctAnswerGlow = isAnswerPhase ? 1 + Math.sin(answerRevealProgress * Math.PI * 4) * 0.3 : 0

  const getOptionGlow = (optionLetter: string) => {
    if (!isAnswerPhase) return 0
    const isCorrect = optionLetter === question.correctAnswer
    return isCorrect ? correctAnswerGlow : 0
  }

  const getOptionScale = (optionLetter: string) => {
    if (!isAnswerPhase) return 1
    const isCorrect = optionLetter === question.correctAnswer
    return isCorrect ? 1 + (answerRevealProgress * 0.1) : 1 - (answerRevealProgress * 0.05)
  }

  // Confetti animation
  interface ConfettiParticle {
    x: string
    y: string
    rotation: number
    color: string
    scale: number
  }

  const confettiCount = 20
  const confettiParticles = Array.from({ length: confettiCount }, (_, i) => {
    const delay = (i / confettiCount) * 2 // Spread over 2 seconds
    const startFrame = questionPhaseFrames + (delay * fps)
    const particleProgress = Math.max(0, (frame - startFrame) / (5 * fps)) // 5 second fall

    if (particleProgress >= 1) return null

    const x = 20 + (i / confettiCount) * 60 + Math.sin(particleProgress * Math.PI * 4) * 10 // Wavy motion
    const y = particleProgress * 80 // Fall from top
    const rotation = particleProgress * 360 * 3 // Spin
    const colors = ['#fbbf24', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6']
    const color = colors[i % colors.length]

    return {
      x: `${x}%`,
      y: `${y}%`,
      rotation,
      color,
      scale: 0.8 + Math.sin(particleProgress * Math.PI) * 0.4,
    }
  }).filter(Boolean) as ConfettiParticle[]

  // Audio logic
  // Timer with chime - plays during question phase (12s file with 10s timer + 2s chime)
  const timerAudioStartFrame = 0 // Start immediately when question phase begins
  const shouldPlayTimerAudio = isQuestionPhase && frame >= timerAudioStartFrame

  // Celebration sound - plays when answer is revealed (1s file)
  const celebrationSoundFrame = questionPhaseFrames + fps * 0.2 // Play 0.2s after answer phase starts
  const shouldPlayCelebration = isAnswerPhase && frame >= celebrationSoundFrame && frame < celebrationSoundFrame + fps * 1

  return (
    <div style={{
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-start",
      alignItems: "center",
      padding: "90px 40px 60px 40px", // More top padding for timer, more bottom for stacked cards
      position: "relative",
      background: `
        linear-gradient(135deg, #4F46E5 0%, #059669 100%),
        repeating-linear-gradient(
          0deg,
          transparent,
          transparent 98px,
          rgba(255,255,255,0.03) 98px,
          rgba(255,255,255,0.03) 100px
        )
      `,
    }}>
      {/* Timer at top - only show during question phase */}
      {isQuestionPhase && (
        <div style={{
          position: "absolute",
          top: "30px",
          right: "40px",
        }}>
          <div style={{
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
          }}>
            <span style={{
              fontSize: `${countdownSize * 0.35}px`,
              fontWeight: "800",
              color: "white",
              textShadow: "0 2px 4px rgba(0,0,0,0.5)",
              fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            }}>
              {Math.ceil(questionRemainingTime)}
            </span>
          </div>
        </div>
      )}

      {/* Question Card */}
      <div style={{
        background: "rgba(255,255,255,0.98)",
        borderRadius: "24px",
        padding: "50px 45px",
        marginBottom: "30px",
        width: "96%",
        maxWidth: "1100px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        border: "1px solid rgba(255,255,255,0.2)",
        position: "relative",
        transform: `translateY(${questionEntrance}px)`,
        opacity: frame < 10 ? 0 : 1,
      }}>
        {/* Question */}
        <h2 style={{
          fontSize: "44px",
          fontWeight: "700",
          color: "#1f2937",
          textAlign: "center",
          lineHeight: "1.3",
          marginBottom: "0",
          padding: "0 20px",
          fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
          textShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}>
          {question.text}
        </h2>

        {/* Decorative corner elements */}
        <div style={{
          position: "absolute",
          top: "15px",
          left: "15px",
          width: "30px",
          height: "30px",
          borderTop: "3px solid #3b82f6",
          borderLeft: "3px solid #3b82f6",
          opacity: 0.3,
        }} />
        <div style={{
          position: "absolute",
          top: "15px",
          right: "15px",
          width: "30px",
          height: "30px",
          borderTop: "3px solid #3b82f6",
          borderRight: "3px solid #3b82f6",
          opacity: 0.3,
        }} />
        <div style={{
          position: "absolute",
          bottom: "15px",
          left: "15px",
          width: "30px",
          height: "30px",
          borderBottom: "3px solid #3b82f6",
          borderLeft: "3px solid #3b82f6",
          opacity: 0.3,
        }} />
        <div style={{
          position: "absolute",
          bottom: "15px",
          right: "15px",
          width: "30px",
          height: "30px",
          borderBottom: "3px solid #3b82f6",
          borderRight: "3px solid #3b82f6",
          opacity: 0.3,
        }} />
      </div>

      {/* Options - Each in its own separate card */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        width: "96%",
        maxWidth: "1100px",
      }}>
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
              border: `3px solid ${getOptionGlow(option.letter) > 0 ? '#10b981' : '#e2e8f0'}`,
              transition: "all 0.3s ease",
              cursor: "pointer",
              boxShadow: `
                0 4px 12px rgba(0,0,0,0.1),
                0 0 ${getOptionGlow(option.letter) * 30}px rgba(16, 185, 129, ${getOptionGlow(option.letter)})
              `,
              minHeight: "100px",
              transform: `
                translateX(${getOptionEntrance(index)}px)
                scale(${getOptionScale(option.letter)})
              `,
              opacity: getOptionOpacity(index),
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "#3b82f6"
              e.currentTarget.style.background = "#eff6ff"
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(59, 130, 246, 0.3)"
              e.currentTarget.style.transform = "translateY(-3px)"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "#e2e8f0"
              e.currentTarget.style.background = "#ffffff"
              e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)"
              e.currentTarget.style.transform = "translateY(0)"
            }}
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
            }}>
              <span style={{
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
                boxShadow: "0 4px 10px rgba(30, 64, 175, 0.4)",
                flexShrink: 0,
              }}>
                {option.letter}
              </span>
              <span style={{
                flex: 1,
                fontSize: "28px",
                fontWeight: "500",
                color: "#374151",
                lineHeight: "1.4",
                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
              }}>{option.text}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Answer Explanation - show during answer phase */}
      {isAnswerPhase && (
        <div style={{
          background: "rgba(16, 185, 129, 0.95)",
          borderRadius: "20px",
          padding: "40px 45px",
          marginTop: "30px",
          width: "96%",
          maxWidth: "1100px",
          boxShadow: "0 15px 40px rgba(16, 185, 129, 0.3)",
          border: "2px solid rgba(255,255,255,0.3)",
          transform: `translateY(${spring({
            frame: frame - questionPhaseFrames,
            fps,
            config: { damping: 200, stiffness: 100, mass: 1 },
            from: 50,
            to: 0,
          })}px)`,
          opacity: spring({
            frame: frame - questionPhaseFrames,
            fps,
            config: { damping: 200, stiffness: 100, mass: 1 },
            from: 0,
            to: 1,
          }),
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            width: "100%",
          }}>
            <span style={{
              background: "#ffffff",
              color: "#059669",
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginRight: "20px",
              fontSize: "24px",
              fontWeight: "bold",
              boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
              flexShrink: 0,
            }}>
              ✓
            </span>
            <span style={{
              flex: 1,
              fontSize: "26px",
              fontWeight: "600",
              color: "white",
              lineHeight: "1.4",
              fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            }}>
              {question.explanation}
            </span>
          </div>
        </div>
      )}

      {/* Confetti particles */}
      {isAnswerPhase && confettiParticles.map((particle, index) => (
        <div
          key={index}
          style={{
            position: "absolute",
            left: particle.x,
            top: particle.y,
            width: "12px",
            height: "12px",
            background: particle.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
            transform: `rotate(${particle.rotation}deg) scale(${particle.scale})`,
            pointerEvents: "none",
            zIndex: 10,
          }}
        />
        ))}

      {/* Audio Elements */}
      {/* Timer with chime - plays during question phase */}
      {/* File: /public/audio/timer-with-chime.mp3 - 12s file (10s timer + 2s chime) */}
      {shouldPlayTimerAudio && (
        <Audio
          src="/audio/timer-with-chime.mp3"
          startFrom={0}
          volume={0.4}
        />
      )}

      {/* Celebration sound - plays when answer is revealed */}
      {/* File: /public/audio/celebration.mp3 - 1s positive chime */}
      {shouldPlayCelebration && (
        <Audio
          src="/audio/celebration.mp3"
          startFrom={0}
          volume={0.5}
        />
      )}

      {/* Background music - subtle ambient track (29s file) */}
      {/* File: /public/audio/background-music.mp3 - Gentle ambient music */}
      <Audio
        src="/audio/background-music.mp3"
        startFrom={0}
        volume={0.1}
        loop={true}
      />

      {/* Progress Indicator - Moved up */}
      <div style={{
        position: "absolute",
        bottom: "60px",
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: "10px",
      }}>
        {[1, 2, 3, 4, 5].map((dot) => (
          <div
            key={dot}
            style={{
              width: "14px",
              height: "14px",
              borderRadius: "50%",
              background: dot === 1 ? "#3b82f6" : "rgba(255,255,255,0.4)",
              border: dot === 1 ? "2px solid #ffffff" : "none",
              boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
            }}
          />
        ))}
      </div>
    </div>
  )
}
