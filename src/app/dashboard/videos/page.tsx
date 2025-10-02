"use client"

import { useState, useEffect, useCallback } from "react"
import { Video, Class, Subject, Topic } from "@prisma/client"

interface VideoWithDetails extends Video {
  class: Class
  subject: Subject
  topic: Topic
  questions: { question: { text: string } }[]
}

type VideoStatus = "DRAFT" | "GENERATING" | "GENERATED" | "UPLOADING" | "UPLOADED" | "FAILED"

export default function VideosPage() {
  const [videos, setVideos] = useState<VideoWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<VideoStatus | "ALL">("ALL")

  const fetchVideos = useCallback(async () => {
    try {
      const url = selectedStatus === "ALL"
        ? "/api/videos"
        : `/api/videos?status=${selectedStatus}`

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setVideos(data)
      }
    } catch (error) {
      console.error("Error fetching videos:", error)
    }
    setIsLoading(false)
  }, [selectedStatus])

  useEffect(() => {
    fetchVideos()
  }, [selectedStatus, fetchVideos])

  const uploadToYouTube = async (video: VideoWithDetails) => {
    try {
      const response = await fetch(`/api/videos/${video.id}/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          className: video.class.name,
          subjectName: video.subject.name,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        fetchVideos() // Refresh the video list
        alert(`✅ Video upload started successfully!\n\nTitle: ${result.message}\nYouTube URL: ${result.youtubeUrl}`)
      } else {
        const error = await response.json()
        alert(`❌ Upload failed: ${error.error}`)
      }
    } catch (error) {
      console.error("Error uploading video:", error)
      alert("❌ Failed to upload video. Please check your connection and try again.")
    }
  }

  const regenerateVideo = async (video: VideoWithDetails) => {
    try {
      const response = await fetch(`/api/videos/${video.id}/regenerate`, {
        method: "POST",
      })

      if (response.ok) {
        const result = await response.json()
        fetchVideos() // Refresh the video list
        alert(`✅ Video regeneration started successfully!\n\nVideo "${result.video.title}" is being regenerated.\nThe same video entry will be updated once generation completes.`)
      } else {
        const error = await response.json()
        alert(`❌ Regeneration failed: ${error.error}`)
      }
    } catch (error) {
      console.error("Error regenerating video:", error)
      alert("❌ Failed to regenerate video. Please check your connection and try again.")
    }
  }

  const getStatusColor = (status: VideoStatus) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-800"
      case "GENERATING":
        return "bg-blue-100 text-blue-800"
      case "GENERATED":
        return "bg-green-100 text-green-800"
      case "UPLOADING":
        return "bg-yellow-100 text-yellow-800"
      case "UPLOADED":
        return "bg-purple-100 text-purple-800"
      case "FAILED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
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
          <h1 className="text-2xl font-bold text-gray-900">Videos Management</h1>
          <p className="text-gray-600">Track video generation and upload status</p>
        </div>
        <div className="flex space-x-4">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as VideoStatus | "ALL")}
            className="border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="ALL">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="GENERATING">Generating</option>
            <option value="GENERATED">Generated</option>
            <option value="UPLOADING">Uploading</option>
            <option value="UPLOADED">Uploaded</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Videos List */}
      <div className="space-y-4">
        {videos.map((video) => (
          <div key={video.id} className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {video.title}
                  </h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(video.status)}`}>
                    {video.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {video.class.name} - {video.subject.name} - {video.topic.name}
                </div>
                {video.description && (
                  <p className="text-sm text-gray-600 mb-2">{video.description}</p>
                )}
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>Created: {formatDate(video.createdAt)}</span>
                  {video.updatedAt !== video.createdAt && (
                    <span>Updated: {formatDate(video.updatedAt)}</span>
                  )}
                </div>
              </div>
              <div className="flex space-x-2 ml-4">
                {/* Show regenerate button for videos with questions that can be regenerated */}
                {video.questions.length > 0 && (video.status === "FAILED" || video.status === "GENERATED" || video.status === "UPLOADED" || video.status === "DRAFT") && (
                  <button
                    onClick={() => regenerateVideo(video)}
                    className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm font-medium shadow-sm transition-colors"
                    title="Regenerate video using existing questions"
                  >
                    🔄 Regenerate
                  </button>
                )}
                {video.status === "GENERATED" && (
                  <button
                    onClick={() => uploadToYouTube(video)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium shadow-sm transition-colors"
                  >
                    📺 Upload to YouTube
                  </button>
                )}
                {video.youtubeId && (
                  <a
                    href={`https://youtube.com/watch?v=${video.youtubeId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm font-medium shadow-sm transition-colors"
                  >
                    🎥 View on YouTube
                  </a>
                )}
              </div>
            </div>

            {/* Questions Preview */}
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Questions ({video.questions.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {video.questions.slice(0, 4).map((usage, index) => (
                  <div key={index} className="text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">
                    {usage.question.text.length > 60
                      ? `${usage.question.text.substring(0, 60)}...`
                      : usage.question.text
                    }
                  </div>
                ))}
                {video.questions.length > 4 && (
                  <div className="text-sm text-gray-500 px-2 py-1">
                    +{video.questions.length - 4} more {video.questions.length - 4 === 1 ? 'question' : 'questions'}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {videos.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">No videos found</div>
          <div className="mt-2">
            <a
              href="/dashboard/generate"
              className="text-indigo-600 hover:text-indigo-500"
            >
              Generate your first video →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
