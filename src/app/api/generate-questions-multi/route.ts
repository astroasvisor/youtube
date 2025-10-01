import { NextResponse } from "next/server"
import { generateQuestionsForTopics } from "@/lib/question-generation"
import { prisma } from "@/lib/prisma"
import { selectTopicsForVideoGeneration } from "@/lib/topic-selection"
import { Difficulty } from "@prisma/client"

// POST /api/generate-questions-multi - Generate questions using OpenAI for multiple topics (one per subject)
export async function POST(request: Request) {
  try {
    const { classId, count = 5, difficulty = "MEDIUM", subjectsPerRun = 4, previewMode = false } = await request.json()

    if (!classId) {
      return NextResponse.json(
        { error: "Class ID is required" },
        { status: 400 }
      )
    }

    // Verify that the class exists
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        subjects: {
          include: {
            topics: true,
          },
        },
      },
    })

    if (!classData) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      )
    }

    if (classData.subjects.length === 0) {
      return NextResponse.json(
        { error: "No subjects found for this class" },
        { status: 400 }
      )
    }

    // Select topics intelligently - one from each subject
    const selectedTopics = await selectTopicsForVideoGeneration(
      classId,
      subjectsPerRun
    )

    if (selectedTopics.length === 0) {
      return NextResponse.json(
        { error: "No topics available for question generation" },
        { status: 400 }
      )
    }

    // If in preview mode, just return the selected topics without generating questions
    if (previewMode) {
      return NextResponse.json({
        topics: selectedTopics,
        previewMode: true,
        message: `Preview: ${selectedTopics.length} topics would be used for generation`
      })
    }

    const questionsPerTopic = Math.ceil(count / selectedTopics.length)
    const allGeneratedQuestions = await generateQuestionsForTopics(
      classData.name,
      difficulty,
      selectedTopics.map(t => ({ id: t.topicId, name: t.topicName, subjectName: t.subjectName })),
      questionsPerTopic
    )

    const savedQuestions = []
    const topicResults = selectedTopics.map(t => ({
      topicId: t.topicId,
      topicName: t.topicName,
      subjectName: t.subjectName,
      questionsGenerated: 0,
      questionsSaved: 0,
    }))

    for (const question of allGeneratedQuestions) {
      try {
        if (!question.topicId) {
          console.warn("Generated question is missing topicId, skipping:", question)
          continue
        }

        // Check if question already exists for this topic
        const existingQuestion = await prisma.question.findUnique({
          where: {
            text_topicId: {
              text: question.text,
              topicId: question.topicId,
            },
          },
        })

        if (existingQuestion) {
          console.log(`Question already exists for topic ${question.topicId}: ${question.text.substring(0, 50)}...`)
          continue
        }

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
            topicId: question.topicId,
          },
        })
        savedQuestions.push(savedQuestion)

        // Update topic results
        const topicResult = topicResults.find(t => t.topicId === question.topicId)
        if (topicResult) {
          topicResult.questionsSaved++
        }

      } catch (error) {
        console.error("Error saving question:", error)
        // Continue with other questions even if one fails to save
      }
    }

    // Update generated count
    allGeneratedQuestions.forEach(q => {
      if (q.topicId) {
        const topicResult = topicResults.find(t => t.topicId === q.topicId)
        if (topicResult) {
          topicResult.questionsGenerated++
        }
      }
    })

    return NextResponse.json({
      message: `Generated ${allGeneratedQuestions.length} questions and saved ${savedQuestions.length} new questions across ${topicResults.length} topics`,
      topics: topicResults,
      questions: savedQuestions,
      totalQuestions: savedQuestions.length,
    })
  } catch (error) {
    console.error("Error generating questions for multiple topics:", error)
    return NextResponse.json(
      { error: "Failed to generate questions" },
      { status: 500 }
    )
  }
}
