"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Question, Topic, Subject, Class } from "@prisma/client"

interface QuestionWithTopic extends Question {
  topic: Topic & {
    subject: Subject & {
      class: Class
    }
  }
}

export default function GenerateVideoPage() {
  const searchParams = useSearchParams()
  const questionIdFromUrl = searchParams.get("questionId")

  const [questions, setQuestions] = useState<QuestionWithTopic[]>([])
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [videoTitle, setVideoTitle] = useState("")
  const [videoDescription, setVideoDescription] = useState("")

  useEffect(() => {
    fetchApprovedQuestions()

    // Pre-select question from URL parameter and auto-generate title/description
    if (questionIdFromUrl) {
      setSelectedQuestions([questionIdFromUrl])

      // Auto-generate title and description after questions are loaded
      const timer = setTimeout(() => {
        // Only auto-generate if the question exists in the loaded questions
        if (questions.some(q => q.id === questionIdFromUrl)) {
          autoGenerateTitle()
        }
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [questionIdFromUrl])

  const fetchApprovedQuestions = async () => {
    try {
      const response = await fetch("/api/questions?status=APPROVED")
      if (response.ok) {
        const data = await response.json()
        setQuestions(data)
      }
    } catch (error) {
      console.error("Error fetching questions:", error)
    }
    setIsLoading(false)
  }

  const handleQuestionToggle = (questionId: string) => {
    setSelectedQuestions(prev =>
      prev.includes(questionId)
        ? prev.filter(id => id !== questionId)
        : [...prev, questionId]
    )
  }

  const generateVideo = async () => {
    if (selectedQuestions.length === 0) {
      alert("Please select at least one question")
      return
    }

    if (!videoTitle.trim()) {
      alert("Please enter a video title")
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionIds: selectedQuestions,
          title: videoTitle,
          description: videoDescription,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Video generation started! Video ID: ${result.video.id}`)
        // Redirect to video details page or show progress
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error("Error generating video:", error)
      alert("Failed to generate video")
    }

    setIsGenerating(false)
  }

  const autoGenerateTitle = () => {
    if (selectedQuestions.length === 0) return

    const firstQuestion = questions.find(q => q.id === selectedQuestions[0])
    if (firstQuestion) {
      const classSubject = `${firstQuestion.topic.subject.class.name} ${firstQuestion.topic.subject.name}`
      const topic = firstQuestion.topic.name
      const count = selectedQuestions.length

      setVideoTitle(`${classSubject} | ${topic} Quiz #${Math.floor(Math.random() * 1000)}`)
      setVideoDescription(`Test your knowledge with ${count} questions on ${topic} from ${classSubject}. Perfect for exam preparation!`)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Generate Quiz Video</h1>
        <p className="text-gray-600">Create a YouTube Shorts quiz video from approved questions</p>
      </div>

      {/* Video Details */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Video Details</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Video Title
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={videoTitle}
                onChange={(e) => setVideoTitle(e.target.value)}
                className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter video title"
              />
              <button
                onClick={autoGenerateTitle}
                className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm"
              >
                Auto
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Optional)
            </label>
            <textarea
              value={videoDescription}
              onChange={(e) => setVideoDescription(e.target.value)}
              rows={3}
              className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Video description for YouTube"
            />
          </div>
        </div>
      </div>

      {/* Question Selection */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Select Questions ({selectedQuestions.length} selected)
        </h2>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {questions.map((question) => (
            <div
              key={question.id}
              className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                selectedQuestions.includes(question.id)
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => handleQuestionToggle(question.id)}
            >
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  checked={selectedQuestions.includes(question.id)}
                  onChange={() => handleQuestionToggle(question.id)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {question.topic.subject.class.name} - {question.topic.subject.name}
                    </span>
                    <span className="text-sm text-gray-500">
                      {question.topic.name}
                    </span>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                      {question.difficulty}
                    </span>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-2">
                    {question.text}
                  </h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>A) {question.optionA}</div>
                    <div>B) {question.optionB}</div>
                    <div>C) {question.optionC}</div>
                    <div>D) {question.optionD}</div>
                  </div>
                  <div className="mt-2 text-sm">
                    <span className="font-medium text-green-600">
                      Answer: {question.correctAnswer}
                    </span>
                    <span className="text-gray-500 ml-4">
                      {question.explanation}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {questions.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No approved questions available. Generate some questions first!
          </div>
        )}
      </div>

      {/* Generate Button */}
      <div className="flex justify-end">
        <button
          onClick={generateVideo}
          disabled={isGenerating || selectedQuestions.length === 0 || !videoTitle.trim()}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium"
        >
          {isGenerating ? "Generating Video..." : "Generate Video"}
        </button>
      </div>
    </div>
  )
}
