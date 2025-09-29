import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateVideoContentForSubjects } from "@/lib/openai"
import { selectTopicsForVideoGeneration, getTopicsHistory } from "@/lib/topic-selection"
import { Video, Question } from "@prisma/client"
import path from "path"
import fs from "fs"

// POST /api/generate-videos - Generate videos without uploading to YouTube
export async function POST(request: Request) {
  try {
    const { classId } = await request.json()

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

    // Start the video generation process
    const encoder = new TextEncoder()

    // Create a ReadableStream for Server-Sent Events
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial status
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "status",
                step: "Starting video generation process...",
                progress: 0,
              })}\n\n`
            )
          )

          // Step 1: Select topics intelligently
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "status",
                step: "Selecting topics for video generation...",
                progress: 10,
              })}\n\n`
            )
          )

          const topicsHistory = await getTopicsHistory(classId)
          const selectedTopics = await selectTopicsForVideoGeneration(classId, classData.subjects.length)

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "status",
                step: `Selected topics: ${selectedTopics.map(t => t.topicName).join(", ")}`,
                progress: 20,
              })}\n\n`
            )
          )

          // Step 2: Generate content using OpenAI
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "status",
                step: "Generating video content with AI...",
                progress: 30,
              })}\n\n`
            )
          )

          const subjectsForAI = selectedTopics.map(topic => ({
            name: topic.subjectName,
            id: topic.subjectId,
            topics: [topic.topicName], // Only the selected topic
          }))

          const generatedContent = await generateVideoContentForSubjects(
            classData.name,
            subjectsForAI,
            topicsHistory
          )

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "status",
                step: `Generated content for ${generatedContent.length} subjects`,
                progress: 50,
              })}\n\n`
            )
          )

          // Step 3: Create video records and generate videos
          const totalSteps = generatedContent.length * 2 // generate per video (no upload step)
          let currentStep = 0

          for (let i = 0; i < generatedContent.length; i++) {
            const subjectContent = generatedContent[i]
            const selectedTopic = selectedTopics.find(t => t.subjectId === subjectContent.subjectId)

            if (!selectedTopic) continue

            try {
              // Update progress for current subject
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "status",
                    step: `Processing ${subjectContent.subjectName}...`,
                    progress: 50 + (currentStep / totalSteps) * 40,
                  })}\n\n`
                )
              )

              // Send subject result update
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "result",
                    subjectName: subjectContent.subjectName,
                    status: "generating",
                  })}\n\n`
                )
              )

              // Step 3a: Create video record
              const video = await prisma.video.create({
                data: {
                  title: subjectContent.videoContent.title,
                  description: subjectContent.videoContent.description,
                  filename: `${Date.now()}-${i}.mp4`,
                  status: "GENERATING",
                  classId: classId,
                  subjectId: subjectContent.subjectId,
                  topicId: selectedTopic.topicId,
                },
                include: {
                  class: true,
                  subject: true,
                  topic: true,
                },
              })

              // Step 3b: Create question record
              const question = await prisma.question.create({
                data: {
                  text: subjectContent.videoContent.question.text,
                  optionA: subjectContent.videoContent.question.optionA,
                  optionB: subjectContent.videoContent.question.optionB,
                  optionC: subjectContent.videoContent.question.optionC,
                  optionD: subjectContent.videoContent.question.optionD,
                  correctAnswer: subjectContent.videoContent.question.correctAnswer,
                  explanation: subjectContent.videoContent.question.explanation,
                  difficulty: "MEDIUM",
                  status: "APPROVED",
                  topicId: selectedTopic.topicId,
                },
              })

              // Create question usage record
              await prisma.questionUsage.create({
                data: {
                  questionId: question.id,
                  videoId: video.id,
                },
              })

              // Step 3c: Generate video using Remotion
              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "status",
                    step: `Generating video for ${subjectContent.subjectName}...`,
                    progress: 55 + (currentStep / totalSteps) * 40,
                  })}\n\n`
                )
              )

              // Generate video (this runs in background)
              await generateVideoWithRemotion(video, [question])

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "result",
                    subjectName: subjectContent.subjectName,
                    status: "generated",
                    videoId: video.id,
                  })}\n\n`
                )
              )

              currentStep++

            } catch (error) {
              console.error(`Error processing ${subjectContent.subjectName}:`, error)

              controller.enqueue(
                encoder.encode(
                  `data: ${JSON.stringify({
                    type: "result",
                    subjectName: subjectContent.subjectName,
                    status: "failed",
                    error: error instanceof Error ? error.message : "Unknown error",
                  })}\n\n`
                )
              )

              currentStep++
            }
          }

          // Final status update
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "status",
                step: "Video generation process completed!",
                progress: 100,
              })}\n\n`
            )
          )

        } catch (error) {
          console.error("Error in video generation process:", error)

          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "status",
                step: "Error occurred during video generation process",
                progress: 0,
              })}\n\n`
            )
          )
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    })

  } catch (error) {
    console.error("Error starting video generation:", error)
    return NextResponse.json(
      { error: "Failed to start video generation process" },
      { status: 500 }
    )
  }
}

// Helper function to generate video (extracted from generate-video route)
async function generateVideoWithRemotion(video: Video, questions: Question[]) {
  try {
    // Create temporary directory for video generation
    const tempDir = path.join(process.cwd(), "temp", video.id)
    await fs.promises.mkdir(tempDir, { recursive: true })

    // Prepare questions data for Remotion
    const questionsData = questions.map((q) => ({
      id: q.id,
      text: q.text,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      correctAnswer: q.correctAnswer as "A" | "B" | "C" | "D",
      explanation: q.explanation,
    } as const))

    // Create a temporary Remotion entry file
    const entryFileContent = `
import { registerRoot } from "remotion"
import { QuizVideo } from "./src/remotion/compositions/QuizVideo"

// Questions data with proper typing
const questions = ${JSON.stringify(questionsData)}
const title = "${video.title.replace(/"/g, '\\"')}"

// Register the QuizVideo component directly with the questions data
registerRoot(() => QuizVideo({ questions, title }))
`

    const entryFilePath = path.join(tempDir, "index.ts")
    await fs.promises.writeFile(entryFilePath, entryFileContent)

    // Copy Remotion files to temp directory
    await copyDirectory(path.join(process.cwd(), "src", "remotion"), path.join(tempDir, "src", "remotion"))

    // Generate video using Remotion CLI
    const outputPath = path.join(process.cwd(), "public", "videos", video.filename)
    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true })

    const { exec } = await import("child_process")
    const { promisify } = await import("util")
    const execAsync = promisify(exec)

    const { stdout, stderr } = await execAsync(
      `cd "${process.cwd()}" && npx remotion render "${entryFilePath}" QuizVideo "${outputPath}"`,
      { timeout: 300000 } // 5 minutes timeout
    )

    console.log("Video generation stdout:", stdout)
    if (stderr) {
      console.error("Video generation stderr:", stderr)
    }

    // Update video status to generated
    await prisma.video.update({
      where: { id: video.id },
      data: {
        status: "GENERATED",
        updatedAt: new Date(),
      },
    })

    // Clean up temp directory
    await fs.promises.rm(tempDir, { recursive: true, force: true })

  } catch (error) {
    console.error("Error in generateVideoWithRemotion:", error)

    // Update video status to failed
    await prisma.video.update({
      where: { id: video.id },
      data: {
        status: "FAILED",
        updatedAt: new Date(),
      },
    }).catch(console.error)

    throw error
  }
}

async function copyDirectory(src: string, dest: string) {
  try {
    await fs.promises.mkdir(dest, { recursive: true })
    const entries = await fs.promises.readdir(src, { withFileTypes: true })

    for (const entry of entries) {
      const srcPath = path.join(src, entry.name)
      const destPath = path.join(dest, entry.name)

      if (entry.isDirectory()) {
        await copyDirectory(srcPath, destPath)
      } else {
        await fs.promises.copyFile(srcPath, destPath)
      }
    }
  } catch (error) {
    console.error("Error copying directory:", error)
  }
}
