import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { VideoStatus } from "@prisma/client"

// GET /api/videos - Get all videos with optional status filter
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const whereClause = status && status !== "ALL"
      ? { status: status as VideoStatus }
      : {}

    const videos = await prisma.video.findMany({
      where: whereClause,
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
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(videos)
  } catch (error) {
    console.error("Error fetching videos:", error)
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 }
    )
  }
}
