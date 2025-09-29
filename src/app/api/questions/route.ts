import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/questions - Get all questions with optional status filter
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")

    const whereClause = status && status !== "ALL"
      ? { status: status as any }
      : {}

    const questions = await prisma.question.findMany({
      where: whereClause,
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
        usages: {
          include: {
            video: {
              select: {
                id: true,
                status: true,
                youtubeId: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(questions)
  } catch (error) {
    console.error("Error fetching questions:", error)
    return NextResponse.json(
      { error: "Failed to fetch questions" },
      { status: 500 }
    )
  }
}

// POST /api/questions - Manually add a new question
export async function POST(request: Request) {
  try {
    const {
      classId,
      subjectId,
      topicId,
      text,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      explanation,
      difficulty = "MEDIUM",
      status = "PENDING"
    } = await request.json()

    // Validate required fields
    if (!classId || !subjectId || !topicId) {
      return NextResponse.json(
        { error: "Class ID, Subject ID, and Topic ID are required" },
        { status: 400 }
      )
    }

    if (!text || !optionA || !optionB || !optionC || !optionD || !explanation) {
      return NextResponse.json(
        { error: "Question text, all options, and explanation are required" },
        { status: 400 }
      )
    }

    if (!["A", "B", "C", "D"].includes(correctAnswer)) {
      return NextResponse.json(
        { error: "Correct answer must be A, B, C, or D" },
        { status: 400 }
      )
    }

    // Verify that the class, subject, and topic exist and are related
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        subject: {
          include: {
            class: true,
          },
        },
      },
    })

    if (!topic) {
      return NextResponse.json(
        { error: "Topic not found" },
        { status: 404 }
      )
    }

    if (topic.subject.id !== subjectId || topic.subject.class.id !== classId) {
      return NextResponse.json(
        { error: "Class, Subject, and Topic IDs do not match" },
        { status: 400 }
      )
    }

    // Check if question already exists for this topic
    const existingQuestion = await prisma.question.findUnique({
      where: {
        text_topicId: {
          text,
          topicId,
        },
      },
    })

    if (existingQuestion) {
      return NextResponse.json(
        { error: "Question already exists for this topic" },
        { status: 409 }
      )
    }

    // Create the question
    const question = await prisma.question.create({
      data: {
        text,
        optionA,
        optionB,
        optionC,
        optionD,
        correctAnswer,
        explanation,
        difficulty: difficulty as any,
        status: status as any,
        topicId,
      },
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

    return NextResponse.json(question, { status: 201 })
  } catch (error) {
    console.error("Error creating question:", error)
    return NextResponse.json(
      { error: "Failed to create question" },
      { status: 500 }
    )
  }
}
