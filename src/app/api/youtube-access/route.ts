import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      )
    }

    // Check if user has a Google account with YouTube upload scope
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: "google",
      },
    })

    if (!account) {
      return NextResponse.json({
        hasAccess: false,
        reason: "No Google account linked"
      })
    }

    // Check if the account has YouTube upload scope
    const hasYouTubeScope = account.scope?.includes("https://www.googleapis.com/auth/youtube.upload")

    if (!hasYouTubeScope) {
      return NextResponse.json({
        hasAccess: false,
        reason: "Google account doesn't have YouTube upload permissions"
      })
    }

    // Check if access token is still valid (not expired)
    const now = Math.floor(Date.now() / 1000)
    const isTokenValid = !account.expires_at || account.expires_at > now

    return NextResponse.json({
      hasAccess: isTokenValid,
      reason: isTokenValid ? "YouTube access connected" : "Access token expired",
      account: {
        provider: account.provider,
        scope: account.scope,
        expires_at: account.expires_at,
      }
    })

  } catch (error) {
    console.error("Error checking YouTube access:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
