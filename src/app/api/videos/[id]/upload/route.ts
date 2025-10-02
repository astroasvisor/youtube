import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { uploadToYouTube, generateYouTubeTags } from "@/lib/youtube"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import path from "path"

// POST /api/videos/[id]/upload - Upload video to YouTube
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const body = await request.json().catch(() => ({})) // Handle cases with no body

    // Get user session for YouTube authentication
    const session = await getServerSession(authOptions)

    console.log("Session check:", {
      hasSession: !!session,
      hasAccessToken: !!session?.accessToken,
      hasRefreshToken: !!session?.refreshToken,
      userId: session?.user?.id,
      userEmail: session?.user?.email
    })

    if (!session?.accessToken || !session?.refreshToken) {
      console.log("Authentication failed - missing tokens")
      return NextResponse.json(
        { error: "YouTube authentication required. Please sign in with Google." },
        { status: 401 }
      )
    }

    // Get video details
    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        class: true,
        subject: true,
        topic: true,
        questions: {
          include: {
            question: {
              select: {
                text: true,
                optionA: true,
                optionB: true,
                optionC: true,
                optionD: true,
                correctAnswer: true,
                explanation: true,
                suggestedVideoTitle: true,
                suggestedVideoDesc: true,
              }
            },
          },
        },
      },
    })

    if (!video) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      )
    }

    if (video.status !== "GENERATED") {
      return NextResponse.json(
        { error: "Video must be generated before uploading" },
        { status: 400 }
      )
    }

    // Check if video file exists
    const videoPath = path.join(process.cwd(), "public", "videos", video.filename)
    const fs = await import("fs")
    if (!fs.existsSync(videoPath)) {
      return NextResponse.json(
        { error: "Video file not found" },
        { status: 404 }
      )
    }

    // Update video status to uploading
    await prisma.video.update({
      where: { id },
      data: { status: "UPLOADING" },
    })

    try {
      // Generate tags
      const tags = await generateYouTubeTags(
        video.class.name,
        video.subject.name,
        video.topic.name
      )

      // Build final description with question content appended
      const q = video.questions?.[0]?.question

      // Priority 1: Question's AI-generated SEO description
      // Priority 2: Video's own description
      // Priority 3: Generic fallback
      let baseDescription = q?.suggestedVideoDesc || video.description
      if (!baseDescription) {
        baseDescription = `Quiz video for ${video.class.name} ${video.subject.name} - ${video.topic.name}`
      }
      
      if (q?.suggestedVideoDesc) {
        console.log(`Using AI-generated SEO description for question: ${q.text.substring(0, 50)}...`)
      }

      const questionBlock = q
        ? `\n\nQuestion: ${q.text}\nA) ${q.optionA}\nB) ${q.optionB}\nC) ${q.optionC}\nD) ${q.optionD}\n\nAnswer: ${q.correctAnswer}\n\nExplanation: ${q.explanation}\n`
        : ""
      const finalDescription = `${baseDescription}${questionBlock}`

      // Priority 1: Question's AI-generated SEO title
      // Priority 2: Video's own title
      // Priority 3: Generic fallback
      let videoTitle = q?.suggestedVideoTitle || video.title
      if (!videoTitle) {
        videoTitle = `Quiz: ${video.topic.name}`
      }
      
      if (q?.suggestedVideoTitle) {
        console.log(`Using AI-generated SEO title for question: ${q.text.substring(0, 50)}...`)
      }

      // Upload to YouTube using session tokens with playlist management
      const uploadResult = await uploadToYouTube(
        videoPath,
        videoTitle,
        finalDescription,
        tags,
        session.accessToken as string,
        session.refreshToken as string,
        {
          playlists: {
            autoAddToPlaylists: true,
            className: body.className || video.class.name,
            subjectName: body.subjectName || video.subject.name,
            classNumber: (body.className || video.class.name).match(/\d+/)?.[0], // Extract number from class name
            playlistNamePattern: body.playlistNamePattern, // Allow custom pattern
          }
        }
      )

      // Update video with YouTube ID
      await prisma.video.update({
        where: { id },
        data: {
          status: "UPLOADED",
          youtubeId: uploadResult.id,
          updatedAt: new Date(),
        },
      })

      return NextResponse.json({
        message: "Video uploaded successfully",
        youtubeId: uploadResult.id,
        youtubeUrl: uploadResult.url,
      })
    } catch (uploadError) {
      // Update video status back to generated if upload fails
      await prisma.video.update({
        where: { id },
        data: {
          status: "GENERATED",
          updatedAt: new Date(),
        },
      })

      throw uploadError
    }
  } catch (error) {
    console.error("Error uploading video:", error)
    return NextResponse.json(
      { error: "Failed to upload video" },
      { status: 500 }
    )
  }
}
