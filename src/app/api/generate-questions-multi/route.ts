import { NextResponse } from "next/server"
import { generateQuestions } from "@/lib/openai"
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

    const savedQuestions = []
    const topicResults = []

    // Generate questions for each selected topic
    for (const topic of selectedTopics) {
      try {
        // Verify the topic still exists and is valid
        const topicData = await prisma.topic.findUnique({
          where: { id: topic.topicId },
          include: {
            subject: {
              include: {
                class: true,
              },
            },
          },
        })

        if (!topicData) {
          console.warn(`Topic ${topic.topicId} not found, skipping`)
          continue
        }

        // Generate questions for this topic
        const questions = await generateQuestions(
          topicData.subject.class.name,
          topicData.subject.name,
          topicData.name,
          Math.ceil(count / selectedTopics.length), // Distribute questions across topics
          difficulty
        )

        // Save questions to database
        const topicSavedQuestions = []
        for (const question of questions) {
          try {
            // Check if question already exists for this topic
            const existingQuestion = await prisma.question.findUnique({
              where: {
                text_topicId: {
                  text: question.text,
                  topicId: topic.topicId,
                },
              },
            })

            if (existingQuestion) {
              console.log(`Question already exists for topic ${topic.topicName}: ${question.text.substring(0, 50)}...`)
              topicSavedQuestions.push(existingQuestion)
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
                topicId: topic.topicId,
              },
            })
            topicSavedQuestions.push(savedQuestion)
          } catch (error) {
            console.error("Error saving question:", error)
            // Continue with other questions even if one fails to save
          }
        }

        savedQuestions.push(...topicSavedQuestions)
        topicResults.push({
          topicId: topic.topicId,
          topicName: topic.topicName,
          subjectName: topic.subjectName,
          questionsGenerated: topicSavedQuestions.length,
        })

      } catch (error) {
        console.error(`Error generating questions for topic ${topic.topicName}:`, error)
        // Continue with other topics even if one fails
      }
    }

    return NextResponse.json({
      message: `Generated ${savedQuestions.length} questions across ${topicResults.length} topics`,
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
