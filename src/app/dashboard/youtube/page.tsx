"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Video, Class, Subject, Topic } from "@prisma/client"

interface VideoWithDetails extends Video {
  class: Class
  subject: Subject
  topic: Topic
  questions: { question: { text: string } }[]
}

type VideoStatus = "DRAFT" | "GENERATING" | "GENERATED" | "UPLOADING" | "UPLOADED" | "FAILED"

interface UploadStatus {
  [videoId: string]: {
    status: "pending" | "uploading" | "completed" | "failed"
    error?: string
    youtubeUrl?: string
  }
}

export default function YouTubeDashboardPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [videos, setVideos] = useState<VideoWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([])
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>({})
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    if (status === "loading") return
    if (status === "unauthenticated") {
      router.push("/auth/signin")
      return
    }
    fetchVideos()
  }, [status, router])

  const fetchVideos = async () => {
    try {
      const response = await fetch("/api/videos?status=GENERATED")
      if (response.ok) {
        const data = await response.json()
        setVideos(data)
      }
    } catch (error) {
      console.error("Error fetching videos:", error)
    }
    setIsLoading(false)
  }

  const handleVideoSelect = (videoId: string, checked: boolean) => {
    if (checked) {
      setSelectedVideoIds([...selectedVideoIds, videoId])
    } else {
      setSelectedVideoIds(selectedVideoIds.filter(id => id !== videoId))
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedVideoIds(videos.map(v => v.id))
    } else {
      setSelectedVideoIds([])
    }
  }

  const handleUploadSelected = async () => {
    if (selectedVideoIds.length === 0) {
      alert("Please select at least one video to upload")
      return
    }

    setIsUploading(true)
    setUploadStatus({})

    // Upload videos one by one
    for (const videoId of selectedVideoIds) {
      setUploadStatus(prev => ({
        ...prev,
        [videoId]: { status: "uploading" }
      }))

      try {
        const response = await fetch(`/api/videos/${videoId}/upload`, {
          method: "POST",
        })

        if (response.ok) {
          const result = await response.json()
          setUploadStatus(prev => ({
            ...prev,
            [videoId]: {
              status: "completed",
              youtubeUrl: result.youtubeUrl
            }
          }))
        } else {
          const error = await response.json()
          setUploadStatus(prev => ({
            ...prev,
            [videoId]: {
              status: "failed",
              error: error.error || "Upload failed"
            }
          }))
        }
      } catch {
        setUploadStatus(prev => ({
          ...prev,
          [videoId]: {
            status: "failed",
            error: "Network error"
          }
        }))
      }
    }

    setIsUploading(false)
    // Refresh videos to update status
    fetchVideos()
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

  const getUploadStatusDisplay = (videoId: string) => {
    const status = uploadStatus[videoId]
    if (!status) return null

    switch (status.status) {
      case "uploading":
        return <span className="text-blue-600 font-medium">Uploading...</span>
      case "completed":
        return (
          <div className="flex items-center gap-2">
            <span className="text-green-600 font-medium">✓ Uploaded</span>
            {status.youtubeUrl && (
              <a
                href={status.youtubeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 text-sm underline"
              >
                View →
              </a>
            )}
          </div>
        )
      case "failed":
        return <span className="text-red-600 font-medium">✗ Failed: {status.error}</span>
      default:
        return null
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
    <div className="container mx-auto px-4 py-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">YouTube Upload Testbed</h1>
          <p className="text-gray-600">Upload generated videos to YouTube one by one for testing</p>
        </div>

        {/* Authentication Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Authentication Status</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${session?.accessToken ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="font-medium text-gray-900">
                YouTube Access: {session?.accessToken ? '✅ Connected' : '❌ Not Connected'}
              </span>
            </div>
            {!session?.accessToken && (
              <button
                onClick={() => router.push("/auth/signin")}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors font-medium shadow-sm"
              >
                Sign in with Google
              </button>
            )}
          </div>
          {session?.accessToken && (
            <p className="text-sm text-gray-700 mt-2 font-medium">
              ✅ You have YouTube upload permissions. Ready for testing!
            </p>
          )}
        </div>

        {/* Control Panel */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Upload Controls</h2>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedVideoIds.length === videos.length && videos.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm font-medium text-gray-900">Select All</span>
              </label>
              <button
                onClick={handleUploadSelected}
                disabled={isUploading || selectedVideoIds.length === 0 || !session?.accessToken}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium shadow-sm"
              >
                {isUploading ? "Uploading..." : `Upload Selected (${selectedVideoIds.length})`}
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-600">
            Selected {selectedVideoIds.length} of {videos.length} videos ready for upload
          </p>
        </div>

        {/* Videos List */}
        <div className="space-y-4">
          {videos.map((video) => (
            <div key={video.id} className="bg-white shadow rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <input
                      type="checkbox"
                      checked={selectedVideoIds.includes(video.id)}
                      onChange={(e) => handleVideoSelect(video.id, e.target.checked)}
                      className="rounded"
                    />
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
                  </div>
                </div>
              </div>

              {/* Upload Status */}
              {getUploadStatusDisplay(video.id)}

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
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-gray-500 mb-4">No generated videos found</div>
            <div className="space-x-4">
              <a
                href="/dashboard/generate"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Generate videos →
              </a>
              <span className="text-gray-300">|</span>
              <a
                href="/dashboard/videos"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                View all videos →
              </a>
            </div>
          </div>
        )}

        {/* Information Panel */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">How to Use This Testbed</h2>
          <div className="text-blue-800 space-y-2 text-sm">
            <p>• This page shows only videos with &quot;GENERATED&quot; status that are ready for upload</p>
            <p>• Select individual videos or use &quot;Select All&quot; to choose multiple videos</p>
            <p>• Click &quot;Upload Selected&quot; to upload videos one by one to YouTube</p>
            <p>• Monitor progress and view results in real-time</p>
            <p>• Use this as a controlled environment to test YouTube uploads before batch operations</p>
            <p>• Each upload includes the video title, description, and first question in the description</p>
          </div>
        </div>
      </div>
    </div>
  )
}
