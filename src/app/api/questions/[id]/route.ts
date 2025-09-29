import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// DELETE /api/questions/[id] - Delete a question and its related data
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: questionId } = await params

    if (!questionId) {
      return NextResponse.json(
        { error: "Question ID is required" },
        { status: 400 }
      )
    }

    // Check if the question exists
    const existingQuestion = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        usages: {
          include: {
            video: true
          }
        }
      }
    })

    if (!existingQuestion) {
      return NextResponse.json(
        { error: "Question not found" },
        { status: 404 }
      )
    }

    // Check if question has any videos that are uploaded to YouTube
    const hasUploadedVideos = existingQuestion.usages.some(usage =>
      usage.video && usage.video.status === "UPLOADED"
    )

    if (hasUploadedVideos) {
      return NextResponse.json(
        { error: "Cannot delete question that has uploaded videos. Please delete the videos first." },
        { status: 400 }
      )
    }

    // Delete question usages first (cascade delete will handle this, but let's be explicit)
    await prisma.questionUsage.deleteMany({
      where: { questionId }
    })

    // Delete the question
    await prisma.question.delete({
      where: { id: questionId }
    })

    return NextResponse.json({
      message: "Question deleted successfully",
      deletedQuestion: {
        id: existingQuestion.id,
        text: existingQuestion.text
      }
    })
  } catch (error) {
    console.error("Error deleting question:", error)
    return NextResponse.json(
      { error: "Failed to delete question" },
      { status: 500 }
    )
  }
}