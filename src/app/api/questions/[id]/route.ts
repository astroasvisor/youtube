import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/questions/[id] - Get a single question by ID
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const question = await prisma.question.findUnique({
      where: { id },
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

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(question)
  } catch (error) {
    console.error("Error fetching question:", error)
    return NextResponse.json(
      { error: "Failed to fetch question" },
      { status: 500 }
    )
  }
}

// PUT /api/questions/[id] - Update a question
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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
      difficulty,
      status
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

    // Check if another question with the same text exists for this topic (excluding current question)
    const existingQuestion = await prisma.question.findFirst({
      where: {
        text,
        topicId,
        id: { not: id },
      },
    })

    if (existingQuestion) {
      return NextResponse.json(
        { error: "Another question with the same text already exists for this topic" },
        { status: 409 }
      )
    }

    // Update the question
    const question = await prisma.question.update({
      where: { id },
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

    return NextResponse.json(question)
  } catch (error) {
    console.error("Error updating question:", error)
    return NextResponse.json(
      { error: "Failed to update question" },
      { status: 500 }
    )
  }
}

// DELETE /api/questions/[id] - Delete a question
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    // Check if question exists
    const question = await prisma.question.findUnique({
      where: { id },
      include: {
        usages: true,
      },
    })

    if (!question) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      )
    }

    // Check if question has been used in videos
    if (question.usages.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete question that has been used in videos" },
        { status: 400 }
      )
    }

    // Delete the question
    await prisma.question.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Question deleted successfully" })
  } catch (error) {
    console.error("Error deleting question:", error)
    return NextResponse.json(
      { error: "Failed to delete question" },
      { status: 500 }
    )
  }
}