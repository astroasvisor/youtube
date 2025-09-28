"use client"

import { useState, useEffect } from "react"
import { Class, Subject, Topic } from "@prisma/client"

interface ClassWithSubjects extends Class {
  subjects: (Subject & { topics: Topic[] })[]
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassWithSubjects[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showAddClass, setShowAddClass] = useState(false)
  const [newClassName, setNewClassName] = useState("")
  const [newClassDescription, setNewClassDescription] = useState("")

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

  const addClass = async () => {
    if (!newClassName.trim()) return

    try {
      const response = await fetch("/api/classes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newClassName,
          description: newClassDescription,
        }),
      })

      if (response.ok) {
        setNewClassName("")
        setNewClassDescription("")
        setShowAddClass(false)
        fetchClasses()
      }
    } catch (error) {
      console.error("Error adding class:", error)
    }
  }

  const addSubject = async (classId: string, subjectName: string) => {
    if (!subjectName.trim()) return

    try {
      const response = await fetch("/api/subjects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: subjectName,
          classId,
        }),
      })

      if (response.ok) {
        fetchClasses()
      }
    } catch (error) {
      console.error("Error adding subject:", error)
    }
  }

  const addTopic = async (subjectId: string, topicName: string) => {
    if (!topicName.trim()) return

    try {
      const response = await fetch("/api/topics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: topicName,
          subjectId,
        }),
      })

      if (response.ok) {
        fetchClasses()
      }
    } catch (error) {
      console.error("Error adding topic:", error)
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
          <h1 className="text-2xl font-bold text-gray-900">Classes Management</h1>
          <p className="text-gray-600">Manage classes, subjects, and topics</p>
        </div>
        <button
          onClick={() => setShowAddClass(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Add Class
        </button>
      </div>

      {/* Add Class Modal */}
      {showAddClass && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Class</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Class Name
                  </label>
                  <input
                    type="text"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="e.g., Class 11"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Description (Optional)
                  </label>
                  <textarea
                    value={newClassDescription}
                    onChange={(e) => setNewClassDescription(e.target.value)}
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    placeholder="Brief description of the class"
                  />
                </div>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowAddClass(false)}
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addClass}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    Add Class
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Classes List */}
      <div className="space-y-6">
        {classes.map((classItem) => (
          <div key={classItem.id} className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {classItem.name}
                  </h3>
                  {classItem.description && (
                    <p className="mt-1 text-sm text-gray-600">
                      {classItem.description}
                    </p>
                  )}
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {classItem.subjects.length} subjects
                </span>
              </div>

              {/* Subjects */}
              <div className="mt-6">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-md font-medium text-gray-900">Subjects</h4>
                  <AddSubjectForm onAdd={(name) => addSubject(classItem.id, name)} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classItem.subjects.map((subject) => (
                    <div key={subject.id} className="border border-gray-200 rounded-md p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h5 className="font-medium text-gray-900">{subject.name}</h5>
                        <span className="text-xs text-gray-500">
                          {subject.topics.length} topics
                        </span>
                      </div>
                      <div className="space-y-2">
                        {subject.topics.map((topic) => (
                          <div key={topic.id} className="text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">
                            {topic.name}
                          </div>
                        ))}
                        <AddTopicForm onAdd={(name) => addTopic(subject.id, name)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function AddSubjectForm({ onAdd }: { onAdd: (name: string) => void }) {
  const [name, setName] = useState("")
  const [showForm, setShowForm] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onAdd(name.trim())
      setName("")
      setShowForm(false)
    }
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="text-sm text-indigo-600 hover:text-indigo-500"
      >
        + Add Subject
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex space-x-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="text-sm border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 flex-1"
        placeholder="Subject name"
        autoFocus
      />
      <button
        type="submit"
        className="text-sm bg-indigo-600 text-white px-2 py-1 rounded"
      >
        Add
      </button>
      <button
        type="button"
        onClick={() => setShowForm(false)}
        className="text-sm text-gray-500 px-2 py-1"
      >
        Cancel
      </button>
    </form>
  )
}

function AddTopicForm({ onAdd }: { onAdd: (name: string) => void }) {
  const [name, setName] = useState("")
  const [showForm, setShowForm] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onAdd(name.trim())
      setName("")
      setShowForm(false)
    }
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="text-xs text-indigo-600 hover:text-indigo-500 mt-1"
      >
        + Add Topic
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex space-x-1 mt-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="text-xs border-gray-300 rounded shadow-sm focus:ring-indigo-500 focus:border-indigo-500 flex-1"
        placeholder="Topic name"
        autoFocus
      />
      <button
        type="submit"
        className="text-xs bg-indigo-600 text-white px-1 py-1 rounded"
      >
        Add
      </button>
      <button
        type="button"
        onClick={() => setShowForm(false)}
        className="text-xs text-gray-500 px-1 py-1"
      >
        ×
      </button>
    </form>
  )
}
