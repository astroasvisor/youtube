import React from "react"

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

export const QuizAnswer: React.FC<{
  question: Question
}> = ({ question }) => {
  const options = [
    { letter: "A", text: question.optionA, isCorrect: question.correctAnswer === "A" },
    { letter: "B", text: question.optionB, isCorrect: question.correctAnswer === "B" },
    { letter: "C", text: question.optionC, isCorrect: question.correctAnswer === "C" },
    { letter: "D", text: question.optionD, isCorrect: question.correctAnswer === "D" },
  ]

  return (
    <div style={{
      width: "100%",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-start",
      alignItems: "center",
      padding: "90px 40px 60px 40px",
      position: "relative",
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    }}>
      {/* Answer Title Card */}
      <div style={{
        background: "rgba(255,255,255,0.98)",
        borderRadius: "24px",
        padding: "40px 45px",
        marginBottom: "30px",
        width: "96%",
        maxWidth: "1100px",
        boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        border: "1px solid rgba(255,255,255,0.2)",
      }}>
        <h3 style={{
          fontSize: "42px",
          fontWeight: "bold",
          color: "#1f2937",
          textAlign: "center",
          marginBottom: "0",
          textShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}>
          Answer
        </h3>
      </div>

      {/* Options with Correct/Incorrect indication - Each in separate card */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "20px",
        marginBottom: "30px",
        width: "96%",
        maxWidth: "1100px",
      }}>
        {options.map((option) => (
          <div
            key={option.letter}
            style={{
              background: option.isCorrect ? "#dcfce7" : "#fef2f2",
              borderRadius: "20px",
              padding: "30px 35px",
              border: `4px solid ${option.isCorrect ? "#16a34a" : "#dc2626"}`,
              position: "relative",
              boxShadow: option.isCorrect ? "0 8px 20px rgba(22, 163, 74, 0.3)" : "0 8px 20px rgba(220, 38, 38, 0.3)",
              minHeight: "100px",
            }}
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
            }}>
              <span style={{
                background: option.isCorrect ? "#16a34a" : "#dc2626",
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
                boxShadow: "0 5px 12px rgba(0,0,0,0.4)",
                flexShrink: 0,
              }}>
                {option.letter}
              </span>
              <span style={{
                flex: 1,
                fontSize: "32px",
                fontWeight: "600",
                color: "#1f2937",
                lineHeight: "1.3",
              }}>{option.text}</span>
              {option.isCorrect && (
                <span style={{
                  color: "#16a34a",
                  fontSize: "36px",
                  fontWeight: "bold",
                  marginLeft: "20px",
                  textShadow: "0 3px 8px rgba(22, 163, 74, 0.5)",
                }}>
                  ✓
                </span>
              )}
              {!option.isCorrect && (
                <span style={{
                  color: "#dc2626",
                  fontSize: "32px",
                  fontWeight: "bold",
                  marginLeft: "20px",
                  textShadow: "0 3px 8px rgba(220, 38, 38, 0.5)",
                }}>
                  ✗
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Explanation Card */}
      <div style={{
        background: "rgba(255,255,255,0.98)",
        borderRadius: "24px",
        padding: "45px 50px",
        width: "96%",
        maxWidth: "1100px",
        boxShadow: "0 15px 40px rgba(0,0,0,0.3)",
        border: "1px solid rgba(255,255,255,0.2)",
      }}>
        <div style={{
          background: "#f0f9ff",
          borderRadius: "20px",
          padding: "35px",
          borderLeft: "6px solid #0ea5e9",
          boxShadow: "0 6px 20px rgba(14, 165, 233, 0.2)",
        }}>
          <h4 style={{
            fontSize: "32px",
            fontWeight: "bold",
            color: "#0ea5e9",
            marginBottom: "20px",
            textShadow: "0 3px 6px rgba(14, 165, 233, 0.4)",
          }}>
            Explanation
          </h4>
          <p style={{
            fontSize: "28px",
            color: "#1f2937",
            lineHeight: "1.4",
            fontWeight: "500",
          }}>
            {question.explanation}
          </p>
        </div>
      </div>

      {/* Motivational Message Card */}
      <div style={{
        background: "rgba(255,255,255,0.95)",
        borderRadius: "24px",
        padding: "40px 50px",
        marginTop: "30px",
        width: "96%",
        maxWidth: "1100px",
        boxShadow: "0 15px 40px rgba(0,0,0,0.3)",
        border: "1px solid rgba(255,255,255,0.2)",
      }}>
        <div style={{
          textAlign: "center",
          color: "#1f2937",
          fontSize: "38px",
          fontWeight: "bold",
          textShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}>
          Great job! Keep learning! 🚀
        </div>
      </div>
    </div>
  )
}
