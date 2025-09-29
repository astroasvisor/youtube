import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/videos/[id] - Get a single video by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params

    if (!videoId) {
      return NextResponse.json(
        { error: "Video ID is required" },
        { status: 400 }
      )
    }

    const video = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        class: true,
        subject: true,
        topic: true,
        questions: {
          include: {
            question: {
              select: {
                text: true,
              },
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

    return NextResponse.json(video)
  } catch (error) {
    console.error("Error fetching video:", error)
    return NextResponse.json(
      { error: "Failed to fetch video" },
      { status: 500 }
    )
  }
}
