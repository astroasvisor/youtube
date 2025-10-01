"use client"

import { useState, useEffect, useCallback } from "react"
import { Question, Topic, Subject, Class } from "@prisma/client"
import { generateDetailedVideoDescription } from "@/lib/subject-content"

interface QuestionWithTopic extends Question {
  topic: Topic & {
    subject: Subject & {
      class: Class
    }
  }
  usages: Array<{
    video: {
      id: string
      status: string
      youtubeId: string | null
    } | null
  }>
}

interface ClassWithSubjects extends Class {
  subjects: (Subject & {
    topics: Topic[]
  })[]
}

type QuestionStatus = "PENDING" | "APPROVED" | "REJECTED" | "BANNED"

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<QuestionWithTopic[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<QuestionStatus | "ALL">("ALL")
  const [showGenerateForm, setShowGenerateForm] = useState(false)
  const [classes, setClasses] = useState<ClassWithSubjects[]>([])
  const [generateForm, setGenerateForm] = useState({
    classId: "",
    subjectId: "",
    topicId: "",
    count: 5,
    difficulty: "MEDIUM" as "EASY" | "MEDIUM" | "HARD",
  })
  const [multiTopicForm, setMultiTopicForm] = useState({
    classId: "",
    count: 5,
    difficulty: "MEDIUM" as "EASY" | "MEDIUM" | "HARD",
  })
  const [selectedTopics, setSelectedTopics] = useState<Array<{
    subjectId: string
    subjectName: string
    topicId: string
    topicName: string
  }>>([])
  const [showMultiTopicForm, setShowMultiTopicForm] = useState(false)
  const [generatingVideos, setGeneratingVideos] = useState<Set<string>>(new Set())
  const [videoLogs, setVideoLogs] = useState<Record<string, string[]>>({})
  const [pollingIntervals, setPollingIntervals] = useState<Record<string, NodeJS.Timeout>>({})

  const fetchQuestions = useCallback(async () => {
    try {
      const url = selectedStatus === "ALL"
        ? "/api/questions"
        : `/api/questions?status=${selectedStatus}`

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        console.log("Fetched questions:", data.length, "questions")
        // Check if any questions have videos
        data.forEach((q: QuestionWithTopic) => {
          if (q.usages && q.usages.length > 0) {
            console.log(`Question ${q.id} has ${q.usages.length} usages:`, q.usages.map((u) => u.video?.status))
          }
        })
        setQuestions(data)
      }
    } catch (error) {
      console.error("Error fetching questions:", error)
    }
    setIsLoading(false)
  }, [selectedStatus])

  useEffect(() => {
    fetchQuestions()
    fetchClasses()
  }, [selectedStatus, fetchQuestions])

  // Cleanup polling intervals when component unmounts
  useEffect(() => {
    return () => {
      Object.values(pollingIntervals).forEach(interval => {
        clearInterval(interval)
      })
    }
  }, [pollingIntervals])

  const fetchClasses = async () => {
    try {
      const response = await fetch("/api/classes")
      if (response.ok) {
        const data = await response.json()
        setClasses(data)
      }
    } catch (error) {
      console.error("Error fetching classes:", error)
    }
  }

  const previewSelectedTopics = async (classId: string) => {
    if (!classId) {
      setSelectedTopics([])
      return
    }

    try {
      const response = await fetch("/api/generate-questions-multi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classId,
          count: multiTopicForm.count,
          difficulty: multiTopicForm.difficulty,
          subjectsPerRun: 4,
          previewMode: true, // Enable preview mode - no questions will be generated
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Extract the topics that would be selected for generation
        if (data.topics && Array.isArray(data.topics)) {
          setSelectedTopics(data.topics)
        }
      }
    } catch (error) {
      console.error("Error fetching selected topics:", error)
      setSelectedTopics([])
    }
  }

  // Get filtered subjects based on selected class
  const getFilteredSubjects = () => {
    if (!generateForm.classId) return []
    const selectedClass = classes.find((c: ClassWithSubjects) => c.id === generateForm.classId)
    return selectedClass?.subjects || []
  }

  // Get filtered topics based on selected subject
  const getFilteredTopics = () => {
    if (!generateForm.subjectId) return []
    const subjects = getFilteredSubjects()
    const selectedSubject = subjects.find((s: Subject & { topics: Topic[] }) => s.id === generateForm.subjectId)
    return selectedSubject?.topics || []
  }

  const updateQuestionStatus = async (questionId: string, status: QuestionStatus) => {
    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        fetchQuestions()
      }
    } catch (error) {
      console.error("Error updating question status:", error)
    }
  }

  const deleteQuestion = async (questionId: string, questionText: string) => {
    if (!confirm(`Are you sure you want to delete this question?\n\n"${questionText}"\n\nThis action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/questions/${questionId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        const result = await response.json()
        alert(result.message)
        fetchQuestions()
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error("Error deleting question:", error)
      alert("Failed to delete question")
    }
  }

  const handleGenerateQuestions = async () => {
    if (!generateForm.classId || !generateForm.subjectId || !generateForm.topicId) {
      alert("Please select class, subject, and topic")
      return
    }

    // Reset form after successful generation
    setGenerateForm({
      classId: "",
      subjectId: "",
      topicId: "",
      count: 5,
      difficulty: "MEDIUM",
    })

    try {
      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(generateForm),
      })

      if (response.ok) {
        setShowGenerateForm(false)
        fetchQuestions()
        alert("Questions generated successfully!")
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error("Error generating questions:", error)
      alert("Failed to generate questions")
    }
  }

  const handleGenerateMultiTopicQuestions = async () => {
    if (!multiTopicForm.classId) {
      alert("Please select a class")
      return
    }

    // First, get the topics that would be used (in preview mode)
    let topics = []
    try {
      const previewResponse = await fetch("/api/generate-questions-multi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classId: multiTopicForm.classId,
          count: multiTopicForm.count,
          difficulty: multiTopicForm.difficulty,
          subjectsPerRun: 4,
          previewMode: true,
        }),
      })

      if (previewResponse.ok) {
        const previewData = await previewResponse.json()
        topics = previewData.topics || []
      }
    } catch (error) {
      console.error("Error fetching topics for generation:", error)
      alert("Failed to fetch topics for generation")
      return
    }

    if (topics.length === 0) {
      alert("No topics available for generation. Please select a different class.")
      return
    }

    // Update selected topics for display
    setSelectedTopics(topics)

    // Reset form after successful generation
    setMultiTopicForm({
      classId: "",
      count: 5,
      difficulty: "MEDIUM",
    })
    setSelectedTopics([])
    setShowMultiTopicForm(false)

    try {
      const response = await fetch("/api/generate-questions-multi", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classId: multiTopicForm.classId,
          count: multiTopicForm.count,
          difficulty: multiTopicForm.difficulty,
          subjectsPerRun: 4,
          previewMode: false, // Actually generate questions this time
        }),
      })

      if (response.ok) {
        const result = await response.json()
        fetchQuestions()
        alert(`Generated ${result.totalQuestions} questions across ${result.topics?.length || 0} topics!`)
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error("Error generating multi-topic questions:", error)
      alert("Failed to generate questions")
    }
  }

  const getStatusColor = (status: QuestionStatus) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800"
      case "PENDING":
        return "bg-yellow-100 text-yellow-800"
      case "REJECTED":
        return "bg-red-100 text-red-800"
      case "BANNED":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "EASY":
        return "bg-blue-100 text-blue-800"
      case "MEDIUM":
        return "bg-orange-100 text-orange-800"
      case "HARD":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const hasExistingVideo = (question: QuestionWithTopic) => {
    // Check if question has any videos that are completed (generated or uploaded)
    const hasCompletedVideo = question.usages.some(usage =>
      usage.video && (usage.video.status === "UPLOADED" || usage.video.status === "GENERATED")
    )

    // Also check if this question is currently being processed
    const isGenerating = generatingVideos.has(question.id)

    console.log(`Question ${question.id} hasCompletedVideo:`, hasCompletedVideo, "isGenerating:", isGenerating, "usages:", question.usages.length)
    if (question.usages.length > 0) {
      console.log("Usage details:", question.usages.map(u => ({ videoId: u.video?.id, status: u.video?.status })))
    }

    return hasCompletedVideo || isGenerating
  }

  const generateVideoForQuestion = async (question: QuestionWithTopic) => {
    const questionId = question.id

    // Add to generating set
    setGeneratingVideos(prev => new Set(prev).add(questionId))

    // Initialize logs for this question
    setVideoLogs(prev => ({
      ...prev,
      [questionId]: ["Starting video generation..."]
    }))

    try {
      // Generate title and description
      const classSubject = `${question.topic.subject.class.name} ${question.topic.subject.name}`
      const topic = question.topic.name
      const title = `${classSubject} | ${topic} Quiz #${Math.floor(Math.random() * 1000)}`
      const description = generateDetailedVideoDescription(
        1,
        topic,
        classSubject,
        question.topic.subject.name,
        true, // include educational value
        true, // include hashtags
        true  // include study tips
      )

      // Add log entry
      setVideoLogs(prev => ({
        ...prev,
        [questionId]: [...(prev[questionId] || []), "Preparing video data..."]
      }))

      const response = await fetch("/api/generate-video", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          questionIds: [questionId],
          title,
          description,
        }),
      })

      if (response.ok) {
        const result = await response.json()

        // Add success log
        setVideoLogs(prev => ({
          ...prev,
          [questionId]: [...(prev[questionId] || []), `✅ Video generation started! Video ID: ${result.video.id}`, "Video processing in background..."]
        }))

        // Start polling for video status updates after a short delay
        setTimeout(() => {
          const pollInterval = setInterval(async () => {
            try {
              const videoResponse = await fetch(`/api/videos/${result.video.id}`)
              if (videoResponse.ok) {
                const videoData = await videoResponse.json()
                console.log("Video status:", videoData.status, "for video ID:", result.video.id)

                // Update logs based on video status
                const currentLogs = videoLogs[questionId] || []
                const newLogs = [...currentLogs]

                if (videoData.status === "GENERATING" && !currentLogs.includes("🎬 Video rendering in progress...")) {
                  newLogs.push("🎬 Video rendering in progress...")
                } else if (videoData.status === "GENERATED" && !currentLogs.includes("✅ Video generation completed!")) {
                  newLogs.push("✅ Video generation completed!")
                  newLogs.push("🎉 Video is ready for upload!")
                } else if (videoData.status === "FAILED" && !currentLogs.includes("❌ Video generation failed")) {
                  newLogs.push("❌ Video generation failed")
                }

                if (newLogs.length !== currentLogs.length) {
                  setVideoLogs(prev => ({
                    ...prev,
                    [questionId]: newLogs
                  }))
                  console.log("Updated logs for question", questionId, ":", newLogs)
                }

                // If video is completed or failed, stop polling
                if (videoData.status === "GENERATED" || videoData.status === "FAILED") {
                  console.log("Video generation completed, stopping polling and refreshing questions")
                  clearInterval(pollInterval)
                  setPollingIntervals(prev => {
                    const newIntervals = { ...prev }
                    delete newIntervals[questionId]
                    return newIntervals
                  })

                  // Update the specific question's video status immediately
                  setQuestions(prevQuestions => {
                    return prevQuestions.map(q => {
                      if (q.id === questionId) {
                        // Find the usage for this video and update its status
                        const updatedUsages = q.usages.map(usage => {
                          if (usage.video && usage.video.id === result.video.id) {
                            return {
                              ...usage,
                              video: {
                                ...usage.video,
                                status: videoData.status
                              }
                            }
                          }
                          return usage
                        })

                        console.log(`Updated question ${questionId} with video status ${videoData.status}`)
                        return {
                          ...q,
                          usages: updatedUsages
                        }
                      }
                      return q
                    })
                  })

                  // Also refresh questions as backup
                  setTimeout(() => {
                    console.log("Refreshing questions as backup after video completion")
                    fetchQuestions()
                  }, 2000)
                }
              } else {
                console.error("Failed to fetch video status:", videoResponse.status)
              }
            } catch (error) {
              console.error("Error polling video status:", error)
            }
          }, 2000) // Poll every 2 seconds

          // Store the polling interval
          setPollingIntervals(prev => ({
            ...prev,
            [questionId]: pollInterval
          }))
        }, 1000) // Wait 1 second before starting polling

      } else {
        const error = await response.json()

        // Add error log
        setVideoLogs(prev => ({
          ...prev,
          [questionId]: [...(prev[questionId] || []), `❌ Error: ${error.error}`]
        }))
      }
    } catch (error) {
      console.error("Error generating video:", error)

      // Add error log
      setVideoLogs(prev => ({
        ...prev,
        [questionId]: [...(prev[questionId] || []), "❌ Network error occurred"]
      }))
    } finally {
      // Remove from generating set after a delay to allow polling to work
      setTimeout(() => {
        setGeneratingVideos(prev => {
          const newSet = new Set(prev)
          newSet.delete(questionId)
          return newSet
        })
      }, 5000) // Keep in generating state for 5 seconds after API call
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Questions Management</h1>
          <p className="text-gray-600">Manage quiz questions and generate new ones</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowGenerateForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Generate Questions
          </button>
          <a
            href="/dashboard/questions/add"
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium inline-block"
          >
            Add Question
          </a>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as QuestionStatus | "ALL")}
              className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="BANNED">Banned</option>
            </select>
          </div>
        </div>
      </div>

      {/* Generate Questions Modal */}
      {showGenerateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border w-full max-w-md shadow-xl rounded-lg bg-white">
            <div className="mt-3">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">
                Generate Questions with AI
              </h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Class
                  </label>
                  <select
                    value={generateForm.classId}
                    onChange={(e) => setGenerateForm({
                      ...generateForm,
                      classId: e.target.value,
                      subjectId: "", // Reset subject when class changes
                      topicId: "" // Reset topic when class changes
                    })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                  >
                    <option value="" className="text-gray-500">Select Class</option>
                    {classes.length === 0 ? (
                      <option value="" disabled>No classes available</option>
                    ) : (
                      classes.map((classItem) => (
                        <option key={classItem.id} value={classItem.id} className="text-gray-900">
                          {classItem.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subject
                  </label>
                  <select
                    value={generateForm.subjectId}
                    onChange={(e) => setGenerateForm({
                      ...generateForm,
                      subjectId: e.target.value,
                      topicId: "" // Reset topic when subject changes
                    })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white disabled:bg-gray-100"
                    disabled={!generateForm.classId}
                  >
                    <option value="" className="text-gray-500">Select Subject</option>
                    {getFilteredSubjects().length === 0 ? (
                      <option value="" disabled className="text-gray-500">Please select a class first</option>
                    ) : (
                      getFilteredSubjects().map((subject: Subject & { topics: Topic[] }) => (
                        <option key={subject.id} value={subject.id} className="text-gray-900">
                          {subject.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Topic
                  </label>
                  <select
                    value={generateForm.topicId}
                    onChange={(e) => setGenerateForm({ ...generateForm, topicId: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white disabled:bg-gray-100"
                    disabled={!generateForm.subjectId}
                  >
                    <option value="" className="text-gray-500">Select Topic</option>
                    {getFilteredTopics().length === 0 ? (
                      <option value="" disabled className="text-gray-500">Please select a subject first</option>
                    ) : (
                      getFilteredTopics().map((topic: Topic) => (
                        <option key={topic.id} value={topic.id} className="text-gray-900">
                          {topic.name}
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Questions
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={generateForm.count}
                    onChange={(e) => setGenerateForm({ ...generateForm, count: parseInt(e.target.value) || 1 })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty
                  </label>
                  <select
                    value={generateForm.difficulty}
                    onChange={(e) => setGenerateForm({ ...generateForm, difficulty: e.target.value as "EASY" | "MEDIUM" | "HARD" })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                  >
                    <option value="EASY" className="text-gray-900">Easy</option>
                    <option value="MEDIUM" className="text-gray-900">Medium</option>
                    <option value="HARD" className="text-gray-900">Hard</option>
                  </select>
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowGenerateForm(false)}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerateQuestions}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors disabled:cursor-not-allowed"
                    disabled={!generateForm.classId || !generateForm.subjectId || !generateForm.topicId}
                  >
                    Generate
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Topic Generation Section */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Generate Multi-Topic Questions</h2>
            <p className="text-sm text-gray-600">Generate questions from multiple topics (one per subject) with intelligent topic selection</p>
          </div>
          <button
            onClick={() => setShowMultiTopicForm(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Generate Multi-Topic Questions
          </button>
        </div>

        {/* Multi-Topic Generation Modal */}
        {showMultiTopicForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-6 border w-full max-w-md shadow-xl rounded-lg bg-white">
              <div className="mt-3">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Generate Multi-Topic Questions
                </h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Class
                    </label>
                    <select
                      value={multiTopicForm.classId}
                      onChange={(e) => {
                        const newClassId = e.target.value
                        setMultiTopicForm({
                          ...multiTopicForm,
                          classId: newClassId,
                        })
                        // Clear selected topics when class changes - they will be fetched when Generate is clicked
                        setSelectedTopics([])
                      }}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                    >
                      <option value="" className="text-gray-500">Select Class</option>
                      {classes.length === 0 ? (
                        <option value="" disabled>No classes available</option>
                      ) : (
                        classes.map((classItem) => (
                          <option key={classItem.id} value={classItem.id} className="text-gray-900">
                            {classItem.name}
                          </option>
                        ))
                      )}
                    </select>
                  </div>


                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Questions
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={multiTopicForm.count}
                      onChange={(e) => setMultiTopicForm({ ...multiTopicForm, count: parseInt(e.target.value) || 1 })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Difficulty
                    </label>
                    <select
                      value={multiTopicForm.difficulty}
                      onChange={(e) => setMultiTopicForm({ ...multiTopicForm, difficulty: e.target.value as "EASY" | "MEDIUM" | "HARD" })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                    >
                      <option value="EASY" className="text-gray-900">Easy</option>
                      <option value="MEDIUM" className="text-gray-900">Medium</option>
                      <option value="HARD" className="text-gray-900">Hard</option>
                    </select>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setShowMultiTopicForm(false)
                        setMultiTopicForm({
                          classId: "",
                          count: 5,
                          difficulty: "MEDIUM",
                        })
                        setSelectedTopics([])
                      }}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleGenerateMultiTopicQuestions}
                      className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors disabled:cursor-not-allowed"
                      disabled={!multiTopicForm.classId}
                    >
                      Generate Questions
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {questions.map((question) => (
          <div key={question.id} className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    {question.topic.subject.class.name} - {question.topic.subject.name} - {question.topic.name}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(question.status)}`}>
                    {question.status}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
                    {question.difficulty}
                  </span>
                  {hasExistingVideo(question) && (() => {
                    const videoUsage = question.usages.find(usage => usage.video && (usage.video.status === "UPLOADED" || usage.video.status === "GENERATED"))
                    const status = videoUsage?.video?.status
                    return (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        status === "UPLOADED" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                      }`}>
                        {status === "UPLOADED" ? "Video Uploaded" : "Video Ready"}
                    </span>
                    )
                  })()}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {question.text}
                </h3>
                <div className="space-y-1 text-sm">
                  <div className="flex space-x-4">
                    <span className="text-gray-600">A) {question.optionA}</span>
                    <span className="text-gray-600">B) {question.optionB}</span>
                  </div>
                  <div className="flex space-x-4">
                    <span className="text-gray-600">C) {question.optionC}</span>
                    <span className="text-gray-600">D) {question.optionD}</span>
                  </div>
                </div>
                <div className="mt-2">
                  <span className="text-sm font-medium text-green-600">
                    Correct Answer: {question.correctAnswer}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <strong>Explanation:</strong> {question.explanation}
                </div>
              </div>

              {/* Video Generation Progress */}
              {generatingVideos.has(question.id) && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-center mb-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    <span className="text-sm font-medium text-blue-800">Generating Video...</span>
                  </div>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {videoLogs[question.id]?.map((log, index) => (
                      <div key={index} className="text-xs text-blue-700 font-mono">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Video Generation Logs (when not actively generating) */}
              {videoLogs[question.id] && !generatingVideos.has(question.id) && videoLogs[question.id].length > 0 && (
                <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
                  <div className="text-xs text-gray-600 space-y-1 max-h-24 overflow-y-auto">
                    {videoLogs[question.id].slice(-3).map((log, index) => (
                      <div key={index} className="font-mono">
                        {log}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex flex-col space-y-2 ml-4">
                <a
                  href={`/dashboard/questions/${question.id}/edit`}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm text-center"
                >
                  Edit
                </a>
                <button
                  onClick={() => generateVideoForQuestion(question)}
                  disabled={(() => {
                    const hasCompletedVideo = question.usages.some(usage =>
                      usage.video && (usage.video.status === "UPLOADED" || usage.video.status === "GENERATED")
                    )
                    const isGenerating = generatingVideos.has(question.id)
                    return hasCompletedVideo || isGenerating
                  })()}
                  className={`px-3 py-1 rounded text-sm text-center font-medium transition-colors ${
                    (() => {
                      const hasCompletedVideo = question.usages.some(usage =>
                        usage.video && (usage.video.status === "UPLOADED" || usage.video.status === "GENERATED")
                      )
                      const isGenerating = generatingVideos.has(question.id)

                      if (hasCompletedVideo) {
                        return "bg-gray-400 text-gray-600 cursor-not-allowed"
                      } else if (isGenerating) {
                        return "bg-yellow-500 text-yellow-800 cursor-wait"
                      } else {
                        return "bg-purple-600 hover:bg-purple-700 text-white"
                      }
                    })()
                  }`}
                >
                  {(() => {
                    const hasCompletedVideo = question.usages.some(usage =>
                      usage.video && (usage.video.status === "UPLOADED" || usage.video.status === "GENERATED")
                    )
                    const isGenerating = generatingVideos.has(question.id)

                    if (hasCompletedVideo) {
                      const videoUsage = question.usages.find(usage => usage.video && (usage.video.status === "UPLOADED" || usage.video.status === "GENERATED"))
                      return videoUsage?.video?.status === "UPLOADED" ? "✅ Video Uploaded" : "✅ Video Ready"
                    } else if (isGenerating) {
                      return "⏳ Generating..."
                    } else {
                      return "🎬 Generate Video"
                    }
                  })()}
                </button>
                <button
                  onClick={() => deleteQuestion(question.id, question.text)}
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm text-center font-medium transition-colors"
                  title="Delete this question"
                >
                  🗑️ Delete
                </button>
                {question.status === "PENDING" && (
                  <>
                    <button
                      onClick={() => updateQuestionStatus(question.id, "APPROVED")}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => updateQuestionStatus(question.id, "REJECTED")}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                    >
                      Reject
                    </button>
                  </>
                )}
                {question.status === "APPROVED" && (
                  <button
                    onClick={() => updateQuestionStatus(question.id, "BANNED")}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Ban
                  </button>
                )}
                {question.status === "BANNED" && (
                  <button
                    onClick={() => updateQuestionStatus(question.id, "APPROVED")}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Unban
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {questions.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">No questions found</div>
        </div>
      )}
    </div>
  )
}
