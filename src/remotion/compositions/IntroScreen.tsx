import React from "react"
import { useCurrentFrame, useVideoConfig, spring, Audio, staticFile } from "remotion"
import { Theme } from "../themes"

export const IntroScreen: React.FC<{
  theme: Theme
}> = ({ theme }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // 3 second duration for intro screen
  // const duration = 3 * fps

  // Brain zap animation - only vibration/blinking, no appearing/disappearing
  const blinkSpeed = 8 // Higher = faster blinking
  const zapOpacity = 0.7 + (Math.sin(frame / blinkSpeed) * 0.3) // Oscillates between 0.7 and 1.0
  
  // Scale animation for zap effect
  const zapScale = 1 + Math.sin(frame / 6) * 0.05 // Subtle pulsing effect
  
  // Title entrance animation
  const titleOpacity = spring({
    frame: frame - 10, // Start after 0.33 seconds
    fps,
    config: { damping: 200, stiffness: 100 },
    from: 0,
    to: 1,
  })

  const titleScale = spring({
    frame: frame - 10,
    fps,
    config: { damping: 200, stiffness: 100 },
    from: 0.8,
    to: 1,
  })

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        background: theme.backgroundGradient,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* Subject Icons - Much More Visible! */}
      <div style={{ position: "absolute", top: "20%", left: "10%", fontSize: "100px", opacity: 0.9, zIndex: 1 }}>
        {theme.name === "Biology" && "🌳"}
      </div>
      <div style={{ position: "absolute", top: "15%", right: "15%", fontSize: "85px", opacity: 0.9, zIndex: 1 }}>
        {theme.name === "Biology" && "🍃"}
      </div>
      <div style={{ position: "absolute", bottom: "25%", left: "20%", fontSize: "90px", opacity: 0.9, zIndex: 1 }}>
        {theme.name === "Biology" && "🐾"}
      </div>
      <div style={{ position: "absolute", bottom: "20%", right: "25%", fontSize: "110px", opacity: 0.9, zIndex: 1 }}>
        {theme.name === "Biology" && "🌸"}
      </div>

      <div style={{ position: "absolute", top: "20%", left: "10%", fontSize: "100px", opacity: 0.9, zIndex: 1 }}>
        {theme.name === "Physics" && "⚛️"}
      </div>
      <div style={{ position: "absolute", top: "15%", right: "15%", fontSize: "85px", opacity: 0.9, zIndex: 1 }}>
        {theme.name === "Physics" && "⚡"}
      </div>
      <div style={{ position: "absolute", bottom: "25%", left: "20%", fontSize: "90px", opacity: 0.9, zIndex: 1 }}>
        {theme.name === "Physics" && "🌊"}
      </div>
      <div style={{ position: "absolute", bottom: "20%", right: "25%", fontSize: "110px", opacity: 0.9, zIndex: 1 }}>
        {theme.name === "Physics" && "🔬"}
      </div>

      <div style={{ position: "absolute", top: "20%", left: "10%", fontSize: "100px", opacity: 0.9, zIndex: 1 }}>
        {theme.name === "Chemistry" && "🧪"}
      </div>
      <div style={{ position: "absolute", top: "15%", right: "15%", fontSize: "85px", opacity: 0.9, zIndex: 1 }}>
        {theme.name === "Chemistry" && "⚗️"}
      </div>
      <div style={{ position: "absolute", bottom: "25%", left: "20%", fontSize: "90px", opacity: 0.9, zIndex: 1 }}>
        {theme.name === "Chemistry" && "🧫"}
      </div>
      <div style={{ position: "absolute", bottom: "20%", right: "25%", fontSize: "110px", opacity: 0.9, zIndex: 1 }}>
        {theme.name === "Chemistry" && "⚛️"}
      </div>

      <div style={{ position: "absolute", top: "20%", left: "10%", fontSize: "100px", opacity: 0.9, zIndex: 1 }}>
        {theme.name === "Mathematics" && "📐"}
      </div>
      <div style={{ position: "absolute", top: "15%", right: "15%", fontSize: "85px", opacity: 0.9, zIndex: 1 }}>
        {theme.name === "Mathematics" && "📊"}
      </div>
      <div style={{ position: "absolute", bottom: "25%", left: "20%", fontSize: "90px", opacity: 0.9, zIndex: 1 }}>
        {theme.name === "Mathematics" && "📈"}
      </div>
      <div style={{ position: "absolute", bottom: "20%", right: "25%", fontSize: "110px", opacity: 0.9, zIndex: 1 }}>
        {theme.name === "Mathematics" && "🔢"}
      </div>

      {/* Science 4 Fun Title */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          left: "50%",
          transform: `translateX(-50%) scale(${titleScale})`,
          opacity: titleOpacity,
          zIndex: 10,
          width: "90%",
          maxWidth: "1000px",
        }}
      >
        <div
          style={{
            background: "linear-gradient(90deg, #8B5CF6 0%, #F59E0B 100%)",
            padding: "20px 40px",
            borderRadius: "25px",
            boxShadow: "0 8px 25px rgba(0,0,0,0.3)",
            width: "100%",
          }}
        >
          <h1
            style={{
              fontSize: "120px",
              fontWeight: "bold",
              color: "#1f2937",
              margin: 0,
              fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
              textShadow: "0 2px 4px rgba(0,0,0,0.1)",
              textAlign: "center",
              textTransform: "uppercase",
            }}
          >
            SCIENCE 4 FUN
          </h1>
        </div>
      </div>

      {/* Brain with Zap Animation */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `scale(${zapScale})`,
        }}
      >
        {/* Brain Image - keep original for intro screen */}
        <img
          src={staticFile("images/brain-zap.png")}
          alt="Brain with electrical zap"
          style={{
            width: "600px",
            height: "600px",
            opacity: zapOpacity,
            filter: "drop-shadow(0 0 30px rgba(255, 255, 0, 0.8))",
            transition: "all 0.1s ease",
          }}
        />
        
        {/* Additional zap effect overlay */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "700px",
            height: "700px",
            background: "radial-gradient(circle, rgba(255, 255, 0, 0.4) 0%, transparent 70%)",
            borderRadius: "50%",
            opacity: zapOpacity * 0.6,
            animation: "pulse 0.5s ease-in-out infinite alternate",
          }}
        />
      </div>

      {/* Electrical shock audio */}
      <Audio
        src={staticFile("audio/electrical-shock-zap.mp3")}
        startFrom={0}
        volume={0.9}
      />

      <style>
        {`
          @keyframes pulse {
            0% { transform: translate(-50%, -50%) scale(0.8); }
            100% { transform: translate(-50%, -50%) scale(1.2); }
          }
        `}
      </style>
    </div>
  )
}
