import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Get dashboard statistics
    const [
      totalClasses,
      totalQuestions,
      totalVideos,
      uploadedVideos
    ] = await Promise.all([
      // Total classes
      prisma.class.count(),

      // Total questions
      prisma.question.count(),

      // Total videos (all statuses)
      prisma.video.count(),

      // Uploaded videos (only uploaded status)
      prisma.video.count({
        where: {
          status: "UPLOADED"
        }
      })
    ])

    return NextResponse.json({
      totalClasses,
      totalQuestions,
      totalVideos,
      uploadedVideos
    })

  } catch (error) {
    console.error("Error fetching dashboard stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
