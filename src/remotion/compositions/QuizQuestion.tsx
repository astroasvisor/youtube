import React from "react"
import { useCurrentFrame, useVideoConfig, spring, Audio, staticFile, Sequence } from "remotion"

// Character entrance animation - appears after last option
const getCharacterOpacity = (frame: number, fps: number) => {
  const startFrame = 60 // Start appearing 5 frames after last option (frame 55)
  return spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 200, stiffness: 100 },
    from: 0,
    to: 1,
  })
}

const getCharacterTranslateY = (frame: number, fps: number) => {
  const startFrame = 60 // Start appearing 5 frames after last option (frame 55)
  return spring({
    frame: frame - startFrame,
    fps,
    config: { damping: 200, stiffness: 100 },
    from: 100,
    to: 0,
  })
}

/*
🎵 AUDIO FILES CONFIGURED:
Your audio files are set up and ready to use:

✓ timer.mp3 (10s) - Timer sound that loops 3 times during 30s countdown
✓ chime.mp3 (1s) - Transition sound at question→answer phase change
✓ celebration.mp3 (1s) - Positive success chime for answer reveals
✓ background-music.mp3 (29s) - Subtle ambient music (loops automatically)

Volume levels are optimized:
- Timer: 40% (clear but not overwhelming)
- Chime: 60% (clear transition signal)
- Celebration: 70% (rewarding success feedback)
- Background: 10% (subtle brand presence)

All audio timing is synchronized with the 50-second video structure.
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

  const fadeInOpacity = spring({
    frame,
    fps,
    from: 0,
    to: 1,
    durationInFrames: 15
  });

  // 50 second total duration: 35s question + 15s answer reveal
  const questionPhaseFrames = 35 * fps
  const answerPhaseFrames = 15 * fps

  const isQuestionPhase = frame < questionPhaseFrames
  const isAnswerPhase = frame >= questionPhaseFrames

  // Fixed Countdown Logic: Start at t=5s, count down from 30s for 30 seconds
  const countdownStartsAt = 5 * fps
  const countdownEndsAt = 35 * fps
  const countdownDuration = countdownEndsAt - countdownStartsAt
  const timeDisplayed = Math.max(0, Math.ceil(
    30 - ((frame - countdownStartsAt) / fps)
  ))
  const isCountdownVisible = frame >= countdownStartsAt && frame < countdownEndsAt

  const countdownSize = Math.max(
    120,
    200 -
      (Math.max(0, frame - countdownStartsAt) / countdownDuration) * 80,
  ) // Shrinking effect

  // "Your time starts now" message animation
  const messageStart = 2 * fps
  const messageEnd = 5 * fps
  const messageOpacity =
    frame >= messageStart && frame < messageEnd
      ? spring({
          frame: frame - messageStart,
          fps,
          config: { damping: 200, stiffness: 100 },
          from: 0,
          to: 1,
        }) -
        spring({
          frame: frame - (messageEnd - fps),
          fps,
          config: { damping: 200, stiffness: 100 },
          from: 0,
          to: 1,
        })
      : 0

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

  // Timer fade out as it approaches the end
  const timeLeftRatio = timeDisplayed / 30
  const timerOpacity = timeLeftRatio > 0.2 ? 1 : Math.max(0, timeLeftRatio / 0.2) // Fade out in last 6 seconds

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
  // Timer audio: Loop timer.mp3 (10s) 3 times during countdown
  const shouldPlayTimerAudio = isCountdownVisible
  const timerLoopCount = 3
  const timerLoopDuration = 10 * fps // 10 seconds per loop
  
  // Audio timing frames
  const chimeStartFrame = questionPhaseFrames
  const celebrationStartFrame = chimeStartFrame + (1.5 * fps)

  // Like button timing (appears at 15s and shows for rest of question phase)
  const likeButtonStartFrame = 15 * fps
  const shouldShowLikeButton = frame >= likeButtonStartFrame && isQuestionPhase

  // Explanation card timing (appears 2 seconds after answer phase starts to sync with celebration)
  const explanationStartFrame = questionPhaseFrames + 2 * fps
  const shouldShowExplanation = frame >= explanationStartFrame && isAnswerPhase

  // Subscribe button timing (appears after explanation card is fully visible)
  const subscribeStartFrame = explanationStartFrame + 1 * fps // 1 second after explanation appears
  const shouldShowSubscribe = frame >= subscribeStartFrame && isAnswerPhase

  // Debug: Log when we're at the transition point
  if (frame === chimeStartFrame) {
    console.log(`🎵 Chime should play at frame ${chimeStartFrame} (t=${chimeStartFrame/fps}s)`)
  }
  if (frame === celebrationStartFrame) {
    console.log(`🎉 Celebration should play at frame ${celebrationStartFrame} (t=${celebrationStartFrame/fps}s)`)
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        opacity: fadeInOpacity,
      }}
    >
      <style>
        {`
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
        `}
      </style>
      {/* --- Question Phase Elements --- */}
      <div style={{ opacity: questionElementsOpacity, width: "100%", height: "100%", display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '90px 40px 60px 40px', position: 'absolute', top: 0, left: 0 }}>
        {/* "Your time starts now" message */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            opacity: messageOpacity,
            background: "rgba(0,0,0,0.7)",
            color: "white",
            padding: "20px 40px",
            borderRadius: "15px",
            fontSize: "48px",
            fontWeight: "bold",
            zIndex: 200,
          }}
        >
          Your time starts now
        </div>

        {/* Timer */}
        <div
          style={{
            position: "absolute",
            top: "30px",
            right: "40px",
            opacity: isCountdownVisible ? timerOpacity : 0,
            zIndex: 100, // High z-index to stay in front of question card
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
                fontSize: `${countdownSize * 0.3}px`, // Adjusted for larger timer
                fontWeight: "800",
                color: "white",
                textShadow: "0 2px 4px rgba(0,0,0,0.5)",
                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
              }}
            >
              {isCountdownVisible && timeDisplayed}
            </span>
          </div>
        </div>

        {/* Question Card */}
        <div
          style={{
            background: "transparent", // No background on the main card
            borderRadius: "30px",
            padding: "0", // No padding on the main card
            marginBottom: "30px",
            width: "90%",
            maxWidth: "1000px",
            boxShadow: "none", // No shadow on the main card
            position: "relative",
            marginTop: "100px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            {question.text.split("\n").map((line, i) => (
              <span
                key={i}
                style={{
                  background: "#fde047",
                  padding: "10px 20px",
                  borderRadius: "15px",
                  fontSize: "66px", // Increased by 50%
                  fontWeight: "700",
                  color: "#1f2937",
                  lineHeight: "1.5",
                  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                  boxDecorationBreak: "clone",
                  WebkitBoxDecorationBreak: "clone",
                  display: "inline",
                }}
              >
                {line}
              </span>
            ))}
          </div>
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
                background: "#fde047", // Yellow background
                borderRadius: "20px",
                padding: "30px 35px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                transform: `translateX(${getOptionEntrance(index)}px)`,
                opacity: getOptionOpacity(index),
                border: "4px solid #1f2937", // Black border
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
                    color: "#1f2937", // Dark text
                    fontSize: "48px", // Increased by 50%
                    fontWeight: "bold",
                    marginRight: "20px",
                  }}
                >
                  {String.fromCharCode(97 + index)})
                </span>
                <span
                  style={{
                    flex: 1,
                    fontSize: "42px", // Increased by 50%
                    fontWeight: "500",
                    color: "#1f2937", // Dark text
                    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                  }}
                >
                  {option.text}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Like Button Section */}
        {shouldShowLikeButton && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "80px",
              opacity: spring({
                frame: frame - likeButtonStartFrame,
                fps,
                config: { damping: 200, stiffness: 100 },
                from: 0,
                to: 1,
              }),
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "25px",
                transform: `translateY(${Math.sin((frame - likeButtonStartFrame) / 8) * 3}px)`,
              }}
            >
              <span
                style={{
                  fontSize: "48px",
                  fontWeight: "700",
                  background: "linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57)",
                  backgroundSize: "300% 300%",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                  textShadow: "0 0 20px rgba(255, 255, 255, 0.5)",
                  filter: "drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))",
                  animation: "gradientShift 3s ease-in-out infinite",
                }}
              >
                Hit like button if you found the answer
              </span>
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  background: "linear-gradient(45deg, #ff6b6b, #4ecdc4)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${1 + Math.sin((frame - likeButtonStartFrame) / 4) * 0.15}) rotate(${Math.sin((frame - likeButtonStartFrame) / 6) * 5}deg)`,
                  boxShadow: "0 0 20px rgba(255, 107, 107, 0.4), 0 0 40px rgba(78, 205, 196, 0.3)",
                  filter: "drop-shadow(0 0 10px rgba(255, 255, 255, 0.5))",
                }}
              >
                <span
                  style={{
                    fontSize: "28px",
                    filter: "drop-shadow(0 0 5px rgba(255, 255, 255, 0.8))",
                  }}
                >
                  👍
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- Answer Phase Elements --- */}
      <div style={{ opacity: answerElementsOpacity, width: "100%", height: '100%', position: 'absolute', top: 0, left: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '90px 40px 60px 40px' }}>
        {/* Answer Title */}
        <div
          style={{
            background: "transparent",
            padding: "0",
            marginBottom: "30px",
            width: "90%",
            maxWidth: "1000px",
            boxShadow: "none",
            position: "relative",
            marginTop: "100px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <span
              style={{
                background: "#fde047",
                padding: "10px 20px",
                borderRadius: "15px",
                fontSize: "63px",
                fontWeight: "700",
                color: "#1f2937",
                lineHeight: "1.5",
                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                boxDecorationBreak: "clone",
                WebkitBoxDecorationBreak: "clone",
                display: "inline",
              }}
            >
              Correct Answer
            </span>
          </div>
        </div>

        {/* Correct Answer Only */}
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
          {(() => {
            const correctOption = [
              { letter: "A", text: question.optionA },
              { letter: "B", text: question.optionB },
              { letter: "C", text: question.optionC },
              { letter: "D", text: question.optionD },
            ].find(option => option.letter === question.correctAnswer)
            
            return (
              <div
                style={{
                  background: "#fde047",
                  borderRadius: "20px",
                  padding: "30px 35px",
                  border: `4px solid #1f2937`,
                  boxShadow: `0 8px 20px rgba(0,0,0,0.1)`,
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center" }}
                >
                  <span
                    style={{
                      background: "#16a34a",
                      color: "white",
                      width: "80px",
                      height: "80px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: "25px",
                      fontSize: "36px",
                      fontWeight: "bold",
                      flexShrink: 0,
                    }}
                  >
                    {correctOption?.letter}
                  </span>
                  <span
                    style={{
                      flex: 1,
                      fontSize: "48px",
                      fontWeight: "500",
                      color: "#111827",
                      fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                    }}
                  >
                    {correctOption?.text}
                  </span>
                  <span style={{ color: "#16a34a", fontSize: "48px" }}>✓</span>
                </div>
              </div>
            )
          })()}
        </div>
        
        {/* Explanation Card - appears 2 seconds after answer phase starts */}
        {shouldShowExplanation && (
          <div style={{
            background: "#fde047",
            borderRadius: "20px",
            padding: "45px 50px",
            width: "90%",
            maxWidth: "1000px",
            boxShadow: "0 10px 20px rgba(0,0,0,0.2)",
            border: '4px solid #1f2937',
            opacity: spring({
              frame: frame - explanationStartFrame,
              fps,
              config: { damping: 200, stiffness: 100 },
              from: 0,
              to: 1,
            }),
            transform: `translateY(${spring({
              frame: frame - explanationStartFrame,
              fps,
              config: { damping: 200, stiffness: 100 },
              from: 50,
              to: 0,
            })}px)`,
          }}>
            <h4 style={{
              fontSize: "48px",
              fontWeight: "bold",
              color: "#1f2937",
              marginBottom: "20px",
              fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            }}>
              Explanation
            </h4>
            <p style={{
              fontSize: "45px",
              color: "#1f2937",
              lineHeight: "1.4",
              fontWeight: "500",
              fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
            }}>
              {question.explanation}
            </p>
          </div>
        )}

        {/* Subscribe Button Section - appears after explanation card */}
        {shouldShowSubscribe && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginTop: "40px",
              opacity: spring({
                frame: frame - subscribeStartFrame,
                fps,
                config: { damping: 200, stiffness: 100 },
                from: 0,
                to: 1,
              }),
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "25px",
                transform: `translateY(${Math.sin((frame - subscribeStartFrame) / 8) * 3}px)`,
              }}
            >
              <span
                style={{
                  fontSize: "48px",
                  fontWeight: "700",
                  background: "linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #feca57)",
                  backgroundSize: "300% 300%",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                  textShadow: "0 0 20px rgba(255, 255, 255, 0.5)",
                  filter: "drop-shadow(0 0 10px rgba(255, 255, 255, 0.3))",
                  animation: "gradientShift 3s ease-in-out infinite",
                }}
              >
                Hit Subscribe if you liked the question
              </span>
              <div
                style={{
                  width: "60px",
                  height: "60px",
                  background: "linear-gradient(45deg, #ff6b6b, #4ecdc4)",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transform: `scale(${1 + Math.sin((frame - subscribeStartFrame) / 4) * 0.15}) rotate(${Math.sin((frame - subscribeStartFrame) / 6) * 5}deg)`,
                  boxShadow: "0 0 20px rgba(255, 107, 107, 0.4), 0 0 40px rgba(78, 205, 196, 0.3)",
                  filter: "drop-shadow(0 0 10px rgba(255, 255, 255, 0.5))",
                }}
              >
                <span
                  style={{
                    fontSize: "28px",
                    filter: "drop-shadow(0 0 5px rgba(255, 255, 255, 0.8))",
                  }}
                >
                  🔔
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* --- Shared Elements (Audio & Confetti) --- */}
      {shouldPlayTimerAudio && (
        <>
          {/* Timer audio: Loop timer.mp3 (10s) 3 times during 30s countdown */}
          <Audio
            src={staticFile("audio/timer.mp3")}
            startFrom={0}
            volume={0.6}
            loop={true}
          />
        </>
      )}
      
      {/* Chime audio: Play for 1 second at transition */}
      <Sequence from={chimeStartFrame} durationInFrames={fps}>
        <Audio
          src={staticFile("audio/chime.mp3")}
          startFrom={0}
          volume={0.5}
        />
      </Sequence>
      
      {/* Celebration audio: Play for 1 second after chime */}
      <Sequence from={celebrationStartFrame} durationInFrames={fps}>
        <Audio
          src={staticFile("audio/celebration.mp3")}
          startFrom={0}
          volume={1.0}
        />
      </Sequence>
      {/* Thinking Character - appears during question phase */}
      <div
        style={{
          position: "absolute",
          bottom: -110,
          left: "50%",
          transform: `translateX(-50%) translateY(${getCharacterTranslateY(frame, fps)}px)`,
          opacity: getCharacterOpacity(frame, fps),
          zIndex: 5,
        }}
      >
        <img
          src={staticFile("images/thinking.png")}
          alt="Thinking character"
          style={{
            width: "720px",
            height: "720px",
          }}
        />
      </div>

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
