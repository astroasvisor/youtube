"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Class, Subject, Topic } from "@prisma/client"

interface ClassWithSubjects extends Class {
  subjects: (Subject & { topics: Topic[] })[]
}

export default function AddQuestionPage() {
  const router = useRouter()
  const [classes, setClasses] = useState<ClassWithSubjects[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    classId: "",
    subjectId: "",
    topicId: "",
    text: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "A" as "A" | "B" | "C" | "D",
    explanation: "",
    difficulty: "MEDIUM" as "EASY" | "MEDIUM" | "HARD",
  })

  useEffect(() => {
    fetchClasses()
  }, [])

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
    setIsLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.classId || !formData.subjectId || !formData.topicId) {
      alert("Please select class, subject, and topic")
      return
    }

    if (!formData.text || !formData.optionA || !formData.optionB || !formData.optionC || !formData.optionD || !formData.explanation) {
      alert("Please fill in all fields")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          status: "PENDING",
        }),
      })

      if (response.ok) {
        router.push("/dashboard/questions")
      } else {
        const error = await response.json()
        alert(`Error: ${error.error}`)
      }
    } catch (error) {
      console.error("Error adding question:", error)
      alert("Failed to add question")
    }

    setIsSubmitting(false)
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Question</h1>
            <p className="text-gray-600">Manually add a quiz question to the database</p>
          </div>
          <a
            href="/dashboard/questions"
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Back to Questions
          </a>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Class, Subject, Topic Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Class *
              </label>
              <select
                value={formData.classId}
                onChange={(e) => handleInputChange("classId", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                required
              >
                <option value="" className="text-gray-500">Select Class</option>
                {classes.map((classItem) => (
                  <option key={classItem.id} value={classItem.id} className="text-gray-900">
                    {classItem.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <select
                value={formData.subjectId}
                onChange={(e) => handleInputChange("subjectId", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white disabled:bg-gray-100"
                required
                disabled={!formData.classId}
              >
                <option value="" className="text-gray-500">Select Subject</option>
                {classes
                  .find(c => c.id === formData.classId)
                  ?.subjects.map((subject) => (
                    <option key={subject.id} value={subject.id} className="text-gray-900">
                      {subject.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Topic *
              </label>
              <select
                value={formData.topicId}
                onChange={(e) => handleInputChange("topicId", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white disabled:bg-gray-100"
                required
                disabled={!formData.subjectId}
              >
                <option value="" className="text-gray-500">Select Topic</option>
                {classes
                  .find(c => c.id === formData.classId)
                  ?.subjects.find(s => s.id === formData.subjectId)
                  ?.topics.map((topic) => (
                    <option key={topic.id} value={topic.id} className="text-gray-900">
                      {topic.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Question Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Text *
            </label>
            <textarea
              value={formData.text}
              onChange={(e) => handleInputChange("text", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              placeholder="Enter the question text..."
              required
            />
          </div>

          {/* Answer Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { key: "optionA", label: "Option A" },
              { key: "optionB", label: "Option B" },
              { key: "optionC", label: "Option C" },
              { key: "optionD", label: "Option D" },
            ].map((option) => (
              <div key={option.key}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {option.label} *
                </label>
                <input
                  type="text"
                  value={formData[option.key as keyof typeof formData] as string}
                  onChange={(e) => handleInputChange(option.key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  placeholder={`Enter ${option.label.toLowerCase()}...`}
                  required
                />
              </div>
            ))}
          </div>

          {/* Correct Answer and Difficulty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correct Answer *
              </label>
              <select
                value={formData.correctAnswer}
                onChange={(e) => handleInputChange("correctAnswer", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
                required
              >
                <option value="A" className="text-gray-900">A</option>
                <option value="B" className="text-gray-900">B</option>
                <option value="C" className="text-gray-900">C</option>
                <option value="D" className="text-gray-900">D</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty Level
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => handleInputChange("difficulty", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900 bg-white"
              >
                <option value="EASY" className="text-gray-900">Easy</option>
                <option value="MEDIUM" className="text-gray-900">Medium</option>
                <option value="HARD" className="text-gray-900">Hard</option>
              </select>
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Explanation *
            </label>
            <textarea
              value={formData.explanation}
              onChange={(e) => handleInputChange("explanation", e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              placeholder="Explain why the correct answer is right..."
              required
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <a
              href="/dashboard/questions"
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Cancel
            </a>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md text-sm font-medium transition-colors disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Adding Question..." : "Add Question"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
