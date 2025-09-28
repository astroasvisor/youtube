import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/classes - Get all classes with subjects and topics
export async function GET() {
  try {
    const classes = await prisma.class.findMany({
      include: {
        subjects: {
          include: {
            topics: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    })

    return NextResponse.json(classes)
  } catch (error) {
    console.error("Error fetching classes:", error)
    return NextResponse.json(
      { error: "Failed to fetch classes" },
      { status: 500 }
    )
  }
}

// POST /api/classes - Create a new class
export async function POST(request: Request) {
  try {
    const { name, description } = await request.json()

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { error: "Class name is required" },
        { status: 400 }
      )
    }

    const classItem = await prisma.class.create({
      data: {
        name,
        description,
      },
    })

    return NextResponse.json(classItem, { status: 201 })
  } catch (error) {
    console.error("Error creating class:", error)
    return NextResponse.json(
      { error: "Failed to create class" },
      { status: 500 }
    )
  }
}
