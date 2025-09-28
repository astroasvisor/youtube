import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// POST /api/subjects - Create a new subject
export async function POST(request: Request) {
  try {
    const { name, classId } = await request.json()

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Subject name is required" },
        { status: 400 }
      )
    }

    if (!classId || typeof classId !== "string") {
      return NextResponse.json(
        { error: "Class ID is required" },
        { status: 400 }
      )
    }

    // Check if class exists
    const classExists = await prisma.class.findUnique({
      where: { id: classId },
    })

    if (!classExists) {
      return NextResponse.json(
        { error: "Class not found" },
        { status: 404 }
      )
    }

    // Check if subject already exists for this class
    const existingSubject = await prisma.subject.findUnique({
      where: {
        name_classId: {
          name,
          classId,
        },
      },
    })

    if (existingSubject) {
      return NextResponse.json(
        { error: "Subject already exists for this class" },
        { status: 409 }
      )
    }

    const subject = await prisma.subject.create({
      data: {
        name,
        classId,
      },
    })

    return NextResponse.json(subject, { status: 201 })
  } catch (error) {
    console.error("Error creating subject:", error)
    return NextResponse.json(
      { error: "Failed to create subject" },
      { status: 500 }
    )
  }
}
