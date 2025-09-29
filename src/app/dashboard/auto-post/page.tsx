"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"

interface Class {
  id: string
  name: string
  subjects: Array<{
    id: string
    name: string
    topics: Array<{
      id: string
      name: string
    }>
  }>
}

interface AutoPostStatus {
  isRunning: boolean
  currentStep: string
  progress: number
  results: Array<{
    subjectName: string
    status: "pending" | "generating" | "generated" | "uploading" | "completed" | "failed"
    videoId?: string
    youtubeUrl?: string
    error?: string
  }>
}

export default function AutoPostPage() {
  const { status } = useSession()
  const [classes, setClasses] = useState<Class[]>([])
  const [selectedClassId, setSelectedClassId] = useState<string>("")
  const [autoPostStatus, setAutoPostStatus] = useState<AutoPostStatus>({
    isRunning: false,
    currentStep: "",
    progress: 0,
    results: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [youtubeAccess, setYoutubeAccess] = useState<{
    hasAccess: boolean
    reason: string
  } | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (status === "loading") return // Still loading session
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }
    fetchClasses()
    checkYoutubeAccess()
  }, [status, router])

  const checkYoutubeAccess = async () => {
    try {
      const response = await fetch("/api/youtube-access")
      if (response.ok) {
        const data = await response.json()
        setYoutubeAccess(data)
      }
    } catch (error) {
      console.error("Error checking YouTube access:", error)
    }
  }

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/classes")
      if (response.ok) {
        const data = await response.json()
        setClasses(data || [])
      }
    } catch (error) {
      console.error("Error fetching classes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleStartAutoPost = async () => {
    if (!selectedClassId) {
      alert("Please select a class first")
      return
    }

    // Check if user has YouTube access
    if (!youtubeAccess?.hasAccess) {
      alert(`YouTube access required: ${youtubeAccess?.reason || "Please sign in with Google to enable auto-posting."}`)
      router.push("/auth/signin")
      return
    }

    const selectedClass = classes.find(c => c.id === selectedClassId)
    if (!selectedClass) {
      alert("Selected class not found")
      return
    }

    // Initialize status tracking
    const initialResults = selectedClass.subjects.map(subject => ({
      subjectName: subject.name,
      status: "pending" as const,
    }))

    setAutoPostStatus({
      isRunning: true,
      currentStep: "Starting auto-post process...",
      progress: 0,
      results: initialResults,
    })

    try {
      const response = await fetch("/api/auto-post", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classId: selectedClassId,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to start auto-post process")
      }

      // Handle streaming response for real-time updates
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6))

                if (data.type === "status") {
                  setAutoPostStatus(prev => ({
                    ...prev,
                    currentStep: data.step,
                    progress: data.progress,
                  }))
                } else if (data.type === "result") {
                  setAutoPostStatus(prev => ({
                    ...prev,
                    results: prev.results.map(result =>
                      result.subjectName === data.subjectName
                        ? {
                            ...result,
                            status: data.status,
                            videoId: data.videoId,
                            youtubeUrl: data.youtubeUrl,
                            error: data.error,
                          }
                        : result
                    ),
                  }))
                }
              } catch (error) {
                console.error("Error parsing SSE data:", error)
              }
            }
          }
        }
      }

      setAutoPostStatus(prev => ({
        ...prev,
        isRunning: false,
        currentStep: "Auto-post process completed!",
      }))

    } catch (error) {
      console.error("Error during auto-post:", error)
      setAutoPostStatus(prev => ({
        ...prev,
        isRunning: false,
        currentStep: "Error occurred during auto-post",
      }))
    }
  }

  const handleStopAutoPost = () => {
    setAutoPostStatus({
      isRunning: false,
      currentStep: "",
      progress: 0,
      results: [],
    })
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-lg text-gray-900 font-medium">Loading...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-gray-900">Auto-Post Videos to YouTube</h1>

      {/* Authentication Status */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Authentication Status</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${youtubeAccess?.hasAccess ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="font-medium text-gray-900">
              YouTube Access: {youtubeAccess?.hasAccess ? '✅ Connected' : '❌ Not Connected'}
            </span>
          </div>
          {!youtubeAccess?.hasAccess && (
            <button
              onClick={() => router.push("/auth/signin")}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium shadow-sm"
            >
              Sign in with Google
            </button>
          )}
        </div>
        {youtubeAccess?.hasAccess && (
          <p className="text-sm text-gray-700 mt-2 font-medium">
            ✅ You have YouTube upload permissions. Auto-posting is ready!
          </p>
        )}
        {youtubeAccess && !youtubeAccess.hasAccess && (
          <p className="text-sm text-red-700 mt-2 font-medium">
            ❌ {youtubeAccess.reason}
          </p>
        )}
      </div>

      {/* Class Selection */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Select Class</h2>
        <div className="mb-4">
          <label htmlFor="class-select" className="block text-sm font-medium text-gray-900 mb-2">
            Choose a class to generate videos for:
          </label>
          <select
            id="class-select"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full p-3 border-2 border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
            disabled={autoPostStatus.isRunning}
          >
            <option value="" className="text-gray-500">Select a class...</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id} className="text-gray-900">
                {cls.name} ({cls.subjects.length} subjects)
              </option>
            ))}
          </select>
        </div>

        {selectedClassId && (
          <div className="mt-4">
            <h3 className="text-lg font-medium mb-2 text-gray-900">Subjects in selected class:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes
                .find((c) => c.id === selectedClassId)
                ?.subjects.map((subject) => (
                  <div key={subject.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-900">{subject.name}</h4>
                    <p className="text-sm text-gray-700 mt-1">
                      {subject.topics.length} topics available
                    </p>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Control Buttons */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-900">Auto-Post Control</h2>
        <div className="flex gap-4">
          <button
            onClick={handleStartAutoPost}
            disabled={autoPostStatus.isRunning || !selectedClassId}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed disabled:text-gray-800 transition-colors font-medium shadow-sm"
          >
            {autoPostStatus.isRunning ? "Auto-Post Running..." : "Start Auto-Post"}
          </button>
          {autoPostStatus.isRunning && (
            <button
              onClick={handleStopAutoPost}
              className="bg-red-600 text-white px-6 py-3 rounded-md hover:bg-red-700 transition-colors font-medium shadow-sm"
            >
              Stop Auto-Post
            </button>
          )}
        </div>
      </div>

      {/* Progress and Status */}
      {autoPostStatus.isRunning && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Progress</h2>

          {/* Overall Progress */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-900">Overall Progress</span>
              <span className="text-sm text-gray-700 font-semibold">{autoPostStatus.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${autoPostStatus.progress}%` }}
              />
            </div>
          </div>

          {/* Current Step */}
          <div className="mb-6">
            <p className="text-sm text-gray-700">
              Current: <span className="font-medium text-gray-900">{autoPostStatus.currentStep}</span>
            </p>
          </div>

          {/* Subject Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {autoPostStatus.results.map((result, index) => (
              <div key={index} className="border-2 border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{result.subjectName}</h4>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      result.status === "completed"
                        ? "bg-green-100 text-green-800"
                        : result.status === "failed"
                        ? "bg-red-100 text-red-800"
                        : result.status === "generating" || result.status === "uploading"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {result.status}
                  </span>
                </div>

                {result.youtubeUrl && (
                  <div className="mt-2">
                    <a
                      href={result.youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 text-sm underline font-medium"
                    >
                      View on YouTube →
                    </a>
                  </div>
                )}

                {result.error && (
                  <div className="mt-2 text-sm text-red-600 font-medium">
                    Error: {result.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Information Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-blue-900">How Auto-Post Works</h2>
        <div className="text-blue-800 space-y-2 text-sm">
          <p>• Select a class to generate videos for all its subjects</p>
          <p>• The system will intelligently select topics that haven&apos;t been used recently</p>
          <p>• One video will be created per subject with engaging titles and descriptions</p>
          <p>• Videos are automatically generated and uploaded to YouTube</p>
          <p>• The process runs asynchronously - you can close this page and check back later</p>
        </div>
      </div>
    </div>
  )
}
