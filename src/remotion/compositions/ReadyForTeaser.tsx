import React from "react"
import { useCurrentFrame, useVideoConfig, spring, staticFile } from "remotion"
import { Theme } from "../themes"

export const ReadyForTeaser: React.FC<{
  theme: Theme
}> = ({ theme }) => {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // 2 second duration for teaser screen
  // const duration = 2 * fps

  // Speech bubble entrance animation
  const bubbleOpacity = spring({
    frame: frame - 5, // Start after 0.17 seconds
    fps,
    config: { damping: 200, stiffness: 100 },
    from: 0,
    to: 1,
  })

  const bubbleScale = spring({
    frame: frame - 5,
    fps,
    config: { damping: 200, stiffness: 100 },
    from: 0.9,
    to: 1,
  })

  const bubbleTranslateY = spring({
    frame: frame - 5,
    fps,
    config: { damping: 200, stiffness: 100 },
    from: 30,
    to: 0,
  })

  // Text animation - slight delay after bubble
  const textOpacity = spring({
    frame: frame - 15, // Start after 0.5 seconds
    fps,
    config: { damping: 200, stiffness: 100 },
    from: 0,
    to: 1,
  })

  const characterOpacity = spring({
    frame: frame - 20,
    fps,
    config: { damping: 200, stiffness: 100 },
    from: 0,
    to: 1,
  });

  const characterTranslateY = spring({
    frame: frame - 20,
    fps,
    config: { damping: 200, stiffness: 100 },
    from: 100,
    to: 0,
  });

  const durationInFrames = 3 * fps

  const overallOpacity = spring({
    frame: frame - (durationInFrames - 15),
    fps,
    config: { damping: 200 },
    from: 1,
    to: 0
  });

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
        opacity: overallOpacity,
      }}
    >
      {/* Subject Icons - Much More Visible! */}
      <div style={{ position: "absolute", top: "20%", left: "10%", fontSize: "100px", opacity: 0.7, zIndex: 1 }}>
        {theme.name === "Biology" && "🌳"}
      </div>
      <div style={{ position: "absolute", top: "15%", right: "15%", fontSize: "85px", opacity: 0.7, zIndex: 1 }}>
        {theme.name === "Biology" && "🍃"}
      </div>
      <div style={{ position: "absolute", bottom: "25%", left: "20%", fontSize: "90px", opacity: 0.7, zIndex: 1 }}>
        {theme.name === "Biology" && "🐾"}
      </div>
      <div style={{ position: "absolute", bottom: "22%", right: "25%", fontSize: "110px", opacity: 0.7, zIndex: 1 }}>
        {theme.name === "Biology" && "🌸"}
      </div>

      <div style={{ position: "absolute", top: "20%", left: "10%", fontSize: "100px", opacity: 0.7, zIndex: 1 }}>
        {theme.name === "Physics" && "⚛️"}
      </div>
      <div style={{ position: "absolute", top: "15%", right: "15%", fontSize: "85px", opacity: 0.7, zIndex: 1 }}>
        {theme.name === "Physics" && "⚡"}
      </div>
      <div style={{ position: "absolute", bottom: "25%", left: "20%", fontSize: "90px", opacity: 0.7, zIndex: 1 }}>
        {theme.name === "Physics" && "🌊"}
      </div>
      <div style={{ position: "absolute", bottom: "22%", right: "25%", fontSize: "110px", opacity: 0.7, zIndex: 1 }}>
        {theme.name === "Physics" && "🔬"}
      </div>

      <div style={{ position: "absolute", top: "20%", left: "10%", fontSize: "100px", opacity: 0.7, zIndex: 1 }}>
        {theme.name === "Chemistry" && "🧪"}
      </div>
      <div style={{ position: "absolute", top: "15%", right: "15%", fontSize: "85px", opacity: 0.7, zIndex: 1 }}>
        {theme.name === "Chemistry" && "⚗️"}
      </div>
      <div style={{ position: "absolute", bottom: "22%", left: "20%", fontSize: "90px", opacity: 0.7, zIndex: 1 }}>
        {theme.name === "Chemistry" && "🧫"}
      </div>
      <div style={{ position: "absolute", bottom: "22%", right: "25%", fontSize: "110px", opacity: 0.7, zIndex: 1 }}>
        {theme.name === "Chemistry" && "⚛️"}
      </div>

      <div style={{ position: "absolute", top: "20%", left: "10%", fontSize: "100px", opacity: 0.7, zIndex: 1 }}>
        {theme.name === "Mathematics" && "📐"}
      </div>
      <div style={{ position: "absolute", top: "15%", right: "15%", fontSize: "85px", opacity: 0.7, zIndex: 1 }}>
        {theme.name === "Mathematics" && "📊"}
      </div>
      <div style={{ position: "absolute", bottom: "25%", left: "20%", fontSize: "90px", opacity: 0.7, zIndex: 1 }}>
        {theme.name === "Mathematics" && "📈"}
      </div>
      <div style={{ position: "absolute", bottom: "22%", right: "25%", fontSize: "110px", opacity: 0.7, zIndex: 1 }}>
        {theme.name === "Mathematics" && "🔢"}
      </div>

      {/* Science 4 Fun Title - same as intro screen */}
      <div
        style={{
          position: "absolute",
          top: "15%",
          left: "50%",
          transform: "translateX(-50%)",
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

      {/* Speech Bubble */}
      <div
        style={{
          position: "relative",
          transform: `scale(${bubbleScale}) translateY(${bubbleTranslateY}px)`,
          opacity: bubbleOpacity,
          zIndex: 10,
        }}
      >
        {/* Main speech bubble */}
        <div
          style={{
            background: "#F59E0B",
            padding: "60px 80px",
            borderRadius: "50px",
            position: "relative",
            boxShadow: "0 15px 40px rgba(0,0,0,0.4)",
            width: "98%",
            maxWidth: "1200px",
            textAlign: "center",
          }}
        >
          {/* Speech bubble tail */}
          <div
            style={{
              position: "absolute",
              bottom: "-20px",
              left: "80px",
              width: 0,
              height: 0,
              borderLeft: "25px solid transparent",
              borderRight: "25px solid transparent",
              borderTop: "25px solid #F59E0B",
              transform: "rotate(-15deg)",
            }}
          />
          
          {/* Text content */}
          <div
            style={{
              opacity: textOpacity,
            }}
          >
            <h2
              style={{
                fontSize: "110px",
                fontWeight: "bold",
                color: "white",
                margin: 0,
                fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
                textShadow: "0 4px 8px rgba(0,0,0,0.4)",
                lineHeight: "1.1",
              }}
            >
              READY FOR ANOTHER
              <br />
              BRAIN TEASER?
            </h2>
          </div>
        </div>
      </div>
      
      <div
        style={{
          position: "absolute",
            bottom: -120,
          left: "50%",
          transform: `translateX(-50%) translateY(${characterTranslateY}px)`,
          opacity: characterOpacity,
          zIndex: 5,
        }}
        >
          <img
            src={staticFile(theme.characterImage)}
            alt="Character"
            style={{
              width: "960px",
              height: "auto",
            }}
          />
        </div>
    </div>
  )
}
