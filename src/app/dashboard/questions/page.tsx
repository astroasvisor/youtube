"use client"

import { useState, useEffect } from "react"
import { Question, Topic, Subject, Class } from "@prisma/client"

interface QuestionWithTopic extends Question {
  topic: Topic & {
    subject: Subject & {
      class: Class
    }
  }
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

  useEffect(() => {
    fetchQuestions()
    fetchClasses()
  }, [selectedStatus])

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

  const fetchQuestions = async () => {
    try {
      const url = selectedStatus === "ALL"
        ? "/api/questions"
        : `/api/questions?status=${selectedStatus}`

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setQuestions(data)
      }
    } catch (error) {
      console.error("Error fetching questions:", error)
    }
    setIsLoading(false)
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
              <div className="flex space-x-2 ml-4">
                <a
                  href={`/dashboard/questions/${question.id}/edit`}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                >
                  Edit
                </a>
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
