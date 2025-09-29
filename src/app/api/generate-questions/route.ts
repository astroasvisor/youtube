import { NextResponse } from "next/server"
import { generateQuestions } from "@/lib/openai"
import { prisma } from "@/lib/prisma"
import { Difficulty } from "@prisma/client"

// POST /api/generate-questions - Generate questions using OpenAI
export async function POST(request: Request) {
  try {
    const { classId, subjectId, topicId, count = 5, difficulty = "MEDIUM" } = await request.json()

    if (!classId || !subjectId || !topicId) {
      return NextResponse.json(
        { error: "Class ID, Subject ID, and Topic ID are required" },
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

    const className = topic.subject.class.name
    const subjectName = topic.subject.name
    const topicName = topic.name

    // Generate questions using OpenAI
    const questions = await generateQuestions(
      className,
      subjectName,
      topicName,
      count,
      difficulty
    )

    // Save questions to database
    const savedQuestions = []
    for (const question of questions) {
      try {
        const savedQuestion = await prisma.question.create({
          data: {
            text: question.text,
            optionA: question.optionA,
            optionB: question.optionB,
            optionC: question.optionC,
            optionD: question.optionD,
            correctAnswer: question.correctAnswer,
            explanation: question.explanation,
            difficulty: difficulty as Difficulty,
            status: "APPROVED",
            topicId: topicId,
          },
        })
        savedQuestions.push(savedQuestion)
      } catch (error) {
        console.error("Error saving question:", error)
        // Continue with other questions even if one fails to save
      }
    }

    return NextResponse.json({
      message: `Generated ${savedQuestions.length} ${savedQuestions.length === 1 ? 'question' : 'questions'}`,
      questions: savedQuestions,
    })
  } catch (error) {
    console.error("Error generating questions:", error)
    return NextResponse.json(
      { error: "Failed to generate questions" },
      { status: 500 }
    )
  }
}
