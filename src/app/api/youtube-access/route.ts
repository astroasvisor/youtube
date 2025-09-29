import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { google } from "googleapis"

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
    let isTokenValid = !account.expires_at || account.expires_at > now

    // If access token is expired but we have a refresh token, try to refresh it
    if (!isTokenValid && account.refresh_token) {
      try {
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/callback/google`
        )

        // Set the refresh token
        oauth2Client.setCredentials({
          refresh_token: account.refresh_token,
        })

        // Try to refresh the access token
        const { credentials } = await oauth2Client.refreshAccessToken()

        // Update the database with new tokens
        await prisma.account.update({
          where: {
            id: account.id,
          },
          data: {
            access_token: credentials.access_token,
            expires_at: credentials.expiry_date ? Math.floor(credentials.expiry_date / 1000) : null,
            refresh_token: credentials.refresh_token || account.refresh_token,
          },
        })

        isTokenValid = true

        console.log("Successfully refreshed YouTube access token")
      } catch (refreshError) {
        console.error("Error refreshing YouTube access token:", refreshError)
        return NextResponse.json({
          hasAccess: false,
          reason: "Refresh token expired or invalid. Please sign in again with Google."
        })
      }
    }

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
