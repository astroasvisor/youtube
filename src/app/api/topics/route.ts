import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST /api/topics - Create a new topic
export async function POST(request: Request) {
  try {
    const { name, subjectId } = await request.json()

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Topic name is required" },
        { status: 400 }
      )
    }

    if (!subjectId || typeof subjectId !== "string") {
      return NextResponse.json(
        { error: "Subject ID is required" },
        { status: 400 }
      )
    }

    // Check if subject exists
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
    })

    if (!subject) {
      return NextResponse.json(
        { error: "Subject not found" },
        { status: 404 }
      )
    }

    // Check if topic already exists for this subject
    const existingTopic = await prisma.topic.findUnique({
      where: {
        name_subjectId: {
          name,
          subjectId,
        },
      },
    })

    if (existingTopic) {
      return NextResponse.json(
        { error: "Topic already exists for this subject" },
        { status: 409 }
      )
    }

    const topic = await prisma.topic.create({
      data: {
        name,
        subjectId,
      },
    })

    return NextResponse.json(topic, { status: 201 })
  } catch (error) {
    console.error("Error creating topic:", error)
    return NextResponse.json(
      { error: "Failed to create topic" },
      { status: 500 }
    )
  }
}
