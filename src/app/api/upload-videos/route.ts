import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { uploadToYouTube, generateYouTubeTags } from "@/lib/youtube"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import path from "path"
import fs from "fs"

// POST /api/upload-videos - Upload generated videos to YouTube
export async function POST(request: Request) {
  try {
    // Get user session for YouTube authentication
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      )
    }

    const { videoIds } = await request.json()

    if (!videoIds || !Array.isArray(videoIds) || videoIds.length === 0) {
      return NextResponse.json(
        { error: "Video IDs array is required" },
        { status: 400 }
      )
    }

    // Start the upload process
    const encoder = new TextEncoder()

    // Create a ReadableStream for Server-Sent Events
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial status
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "status",
                step: "Starting YouTube upload process...",
                progress: 0,
              })}\n\n`
            )
          )

          // Get all videos that need to be uploaded
          const videos = await prisma.video.findMany({
            where: {
              id: { in: videoIds },
              status: "GENERATED", // Only upload generated videos
            },
            include: {
              class: true,
              subject: true,
              topic: true,
              questions: {
                include: {
                  question: true,
                },
              },
            },
          })

          if (videos.length === 0) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({
                  type: "status",
                  step: "No videos found to upload",
                  progress: 100,
                })}\n\n`
              )
            )
            return
          }

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "status",
                step: `Found ${videos.length} videos ready for upload`,
                progress: 10,
              })}\n\n`
            )
          )

          // Upload each video
          const totalSteps = videos.length
          let currentStep = 0

          for (const video of videos) {
            try {
              // Update progress for current video
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "status",
                    step: `Uploading "${video.title}"...`,
                    progress: 10 + (currentStep / totalSteps) * 80,
                  })}\n\n`
                )
              )

              // Send video result update
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "result",
                    videoId: video.id,
                    title: video.title,
                    status: "uploading",
                  })}\n\n`
                )
              )

              // Check if video file exists before uploading
              const videoPath = path.join(process.cwd(), "public", "videos", video.filename)
              if (!fs.existsSync(videoPath)) {
                throw new Error("Video file not found")
              }

              // Generate tags
              const tags = await generateYouTubeTags(
                video.class.name,
                video.subject.name,
                video.topic.name
              )

              // Upload to YouTube using user's session tokens
              if (!session.accessToken || !session.refreshToken) {
                throw new Error("YouTube authentication tokens not available. Please sign in with Google.")
              }

              // Build final description with question content appended
              const q = video.questions?.[0]?.question
              const baseDescription = video.description || `Quiz video for ${video.class.name} ${video.subject.name} - ${video.topic.name}`
              const questionBlock = q
                ? `\n\nQuestion: ${q.text}\nA) ${q.optionA}\nB) ${q.optionB}\nC) ${q.optionC}\nD) ${q.optionD}\n\nAnswer: ${q.correctAnswer}\n\nExplanation: ${q.explanation}\n`
                : ""
              const finalDescription = `${baseDescription}${questionBlock}`

              const uploadResult = await uploadToYouTube(
                videoPath,
                video.title,
                finalDescription,
                tags,
                session.accessToken as string,
                session.refreshToken as string,
                {
                  playlists: {
                    autoAddToPlaylists: true,
                    className: video.class.name,
                    subjectName: video.subject.name,
                    classNumber: video.class.name.match(/\d+/)?.[0], // Extract number from class name
                    playlistNamePattern: undefined, // Use default pattern
                  }
                }
              )

              // Update video with YouTube ID
              await prisma.video.update({
                where: { id: video.id },
                data: {
                  status: "UPLOADED",
                  youtubeId: uploadResult.id,
                  updatedAt: new Date(),
                },
              })

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "result",
                    videoId: video.id,
                    title: video.title,
                    status: "completed",
                    youtubeUrl: uploadResult.url,
                  })}\n\n`
                )
              )

              currentStep++

            } catch (error) {
              console.error(`Error uploading video ${video.title}:`, error)

              // Update video status to failed
              await prisma.video.update({
                where: { id: video.id },
                data: {
                  status: "FAILED",
                  updatedAt: new Date(),
                },
              }).catch(console.error)

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "result",
                    videoId: video.id,
                    title: video.title,
                    status: "failed",
                    error: error instanceof Error ? error.message : "Unknown error",
                  })}\n\n`
                )
              )

              currentStep++
            }
          }

          // Final status update
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "status",
                step: "YouTube upload process completed!",
                progress: 100,
              })}\n\n`
            )
          )

        } catch (error) {
          console.error("Error in YouTube upload process:", error)

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "status",
                step: "Error occurred during YouTube upload process",
                progress: 0,
              })}\n\n`
            )
          )
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    })

  } catch (error) {
    console.error("Error starting YouTube upload:", error)
    return NextResponse.json(
      { error: "Failed to start YouTube upload process" },
      { status: 500 }
    )
  }
}
