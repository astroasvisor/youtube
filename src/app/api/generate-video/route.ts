import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"
import fs from "fs"

const execAsync = promisify(exec)

// POST /api/generate-video - Generate video from selected questions
export async function POST(request: Request) {
  try {
    const { questionIds, title, description } = await request.json()

    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return NextResponse.json(
        { error: "Question IDs are required" },
        { status: 400 }
      )
    }

    if (!title || typeof title !== "string") {
      return NextResponse.json(
        { error: "Video title is required" },
        { status: 400 }
      )
    }

    // Get questions with topic information
    const questions = await prisma.question.findMany({
      where: {
        id: { in: questionIds },
        status: "APPROVED",
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

    if (questions.length !== questionIds.length) {
      return NextResponse.json(
        { error: "Some questions not found or not approved" },
        { status: 404 }
      )
    }

    // Create video record
    const video = await prisma.video.create({
      data: {
        title,
        description,
        filename: `${Date.now()}.mp4`,
        status: "GENERATING",
        classId: questions[0].topic.subject.class.id,
        subjectId: questions[0].topic.subject.id,
        topicId: questions[0].topic.id,
      },
      include: {
        class: true,
        subject: true,
        topic: true,
      },
    })

    // Create question usage records
    await prisma.questionUsage.createMany({
      data: questions.map((question) => ({
        questionId: question.id,
        videoId: video.id,
      })),
    })

    // Generate video using Remotion (in background)
    generateVideoWithRemotion(video, questions).catch((error) => {
      console.error("Error generating video:", error)
      // Update video status to failed
      prisma.video.update({
        where: { id: video.id },
        data: { status: "FAILED" },
      }).catch(console.error)
    })

    return NextResponse.json({
      message: "Video generation started",
      video,
    })
  } catch (error) {
    console.error("Error creating video:", error)
    return NextResponse.json(
      { error: "Failed to create video" },
      { status: 500 }
    )
  }
}

export async function generateVideoWithRemotion(video: any, questions: any[]) {
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

    // Optionally trigger YouTube upload
    // uploadToYouTube(video.id).catch(console.error)

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
