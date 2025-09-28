import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { uploadToYouTube, generateYouTubeTags } from "@/lib/youtube"
import path from "path"

// POST /api/videos/[id]/upload - Upload video to YouTube
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    // Get video details
    const video = await prisma.video.findUnique({
      where: { id },
      include: {
        class: true,
        subject: true,
        topic: true,
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

      // Upload to YouTube
      const uploadResult = await uploadToYouTube(
        videoPath,
        video.title,
        video.description || `Quiz video for ${video.class.name} ${video.subject.name} - ${video.topic.name}`,
        tags
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
