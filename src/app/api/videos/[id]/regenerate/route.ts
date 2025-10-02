import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"
import fs from "fs"

const execAsync = promisify(exec)

// POST /api/videos/[id]/regenerate - Regenerate video from existing video
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params

    if (!videoId) {
      return NextResponse.json(
        { error: "Video ID is required" },
        { status: 400 }
      )
    }

    // Get existing video with questions
    const existingVideo = await prisma.video.findUnique({
      where: { id: videoId },
      include: {
        questions: {
          include: {
            question: {
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
            },
          },
        },
      },
    })

    if (!existingVideo) {
      return NextResponse.json(
        { error: "Video not found" },
        { status: 404 }
      )
    }

    // Check if video has questions
    if (existingVideo.questions.length === 0) {
      return NextResponse.json(
        { error: "Video has no questions to regenerate from" },
        { status: 400 }
      )
    }

    // Prevent regeneration if video is currently being generated
    if (existingVideo.status === "GENERATING") {
      return NextResponse.json(
        { error: "Video is already being generated. Please wait for completion." },
        { status: 400 }
      )
    }

    // Get questions data
    const questions = existingVideo.questions.map((usage) => usage.question)

    // Get subject name for theming
    const subjectName = questions[0].topic.subject.name

    // Create new video record (keeping the same title and description)
    const newVideo = await prisma.video.create({
      data: {
        title: existingVideo.title,
        description: existingVideo.description,
        filename: `${Date.now()}.mp4`,
        status: "GENERATING",
        classId: existingVideo.classId,
        subjectId: existingVideo.subjectId,
        topicId: existingVideo.topicId,
      },
      include: {
        class: true,
        subject: true,
        topic: true,
      },
    })

    // Create question usage records for the new video
    await prisma.questionUsage.createMany({
      data: questions.map((question) => ({
        questionId: question.id,
        videoId: newVideo.id,
      })),
    })

    // Generate video using Remotion (in background)
    generateVideoWithRemotion(newVideo, questions, subjectName).catch((error) => {
      console.error("Error regenerating video:", error)
      // Update new video status to failed
      prisma.video.update({
        where: { id: newVideo.id },
        data: { status: "FAILED" },
      }).catch(console.error)
    })

    return NextResponse.json({
      message: "Video regeneration started",
      newVideo,
      oldVideoId: videoId,
    })
  } catch (error) {
    console.error("Error regenerating video:", error)
    return NextResponse.json(
      { error: "Failed to regenerate video" },
      { status: 500 }
    )
  }
}

async function generateVideoWithRemotion(video: any, questions: any[], subjectName: string) {
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
const subject = "${subjectName.replace(/"/g, '\\"')}"

// Register the QuizVideo component directly with the questions data and subject
registerRoot(() => QuizVideo({ questions, title, subject }))
`

    const entryFilePath = path.join(tempDir, "index.ts")
    await fs.promises.writeFile(entryFilePath, entryFileContent)

    // Copy Remotion files to temp directory
    await copyDirectory(path.join(process.cwd(), "src", "remotion"), path.join(tempDir, "src", "remotion"))

    // Generate video using Remotion CLI
    const outputPath = path.join(process.cwd(), "public", "videos", video.filename)
    await fs.promises.mkdir(path.dirname(outputPath), { recursive: true })

    // Run Remotion render with environment variable to reduce logging
    const env = { ...process.env, REMOTION_LOG_LEVEL: 'error' }

    const { stdout, stderr } = await execAsync(
      `cd "${process.cwd()}" && npx remotion render "${entryFilePath}" QuizVideo "${outputPath}"`,
      { timeout: 300000, env } // 5 minutes timeout
    )

    // Filter out verbose Remotion logs but keep actual errors
    const filteredStderr = stderr
      ?.split('\n')
      .filter(line => !line.includes('Rendered') && !line.includes('Encoded') && !line.includes('time remaining'))
      .join('\n')
      .trim()

    if (filteredStderr) {
      console.error("Video regeneration stderr:", filteredStderr)
    }

    console.log("Video regeneration completed successfully")

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
