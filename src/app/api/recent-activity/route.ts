import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Fetch recent activities from different sources
    const activities = []

    // 1. Recent videos (last 5)
    const recentVideos = await prisma.video.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        class: true,
        subject: true,
        topic: true,
      },
    })

    for (const video of recentVideos) {
      let activity = ""
      let timestamp = video.createdAt

      switch (video.status) {
        case "GENERATED":
          activity = `Generated quiz video for ${video.class.name} ${video.subject.name} - ${video.topic.name}`
          break
        case "UPLOADED":
          activity = `Uploaded quiz video to YouTube: "${video.title}"`
          break
        case "GENERATING":
          activity = `Started generating quiz video for ${video.class.name} ${video.subject.name} - ${video.topic.name}`
          break
        case "UPLOADING":
          activity = `Started uploading quiz video to YouTube: "${video.title}"`
          break
        case "FAILED":
          activity = `Failed to generate video for ${video.class.name} ${video.subject.name} - ${video.topic.name}`
          break
        default:
          activity = `Updated video: "${video.title}"`
      }

      activities.push({
        id: video.id,
        activity,
        timestamp,
        type: "video",
      })
    }

    // 2. Recent questions (last 5)
    const recentQuestions = await prisma.question.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        topic: {
          include: {
            subject: {
              include: {
                class: true,
              },
            },
          },
        },
      },
    })

    for (const question of recentQuestions) {
      activities.push({
        id: question.id,
        activity: `Added new question for ${question.topic.subject.class.name} ${question.topic.subject.name} - ${question.topic.name}`,
        timestamp: question.createdAt,
        type: "question",
      })
    }

    // 3. Recent subjects (last 3)
    const recentSubjects = await prisma.subject.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        class: true,
      },
    })

    for (const subject of recentSubjects) {
      activities.push({
        id: subject.id,
        activity: `Added new subject: ${subject.class.name} - ${subject.name}`,
        timestamp: subject.createdAt,
        type: "subject",
      })
    }

    // 4. Recent topics (last 3)
    const recentTopics = await prisma.topic.findMany({
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: {
        subject: {
          include: {
            class: true,
          },
        },
      },
    })

    for (const topic of recentTopics) {
      activities.push({
        id: topic.id,
        activity: `Added new topic: ${topic.subject.class.name} ${topic.subject.name} - ${topic.name}`,
        timestamp: topic.createdAt,
        type: "topic",
      })
    }

    // Sort all activities by timestamp (most recent first) and take top 10
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)

    return NextResponse.json(sortedActivities)

  } catch (error) {
    console.error("Error fetching recent activity:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
