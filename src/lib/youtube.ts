import { google } from "googleapis"
import fs from "fs"
import path from "path"

// Create OAuth2 client factory function
function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID || process.env.YOUTUBE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET || process.env.YOUTUBE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/callback/google`
  )
}

export async function uploadToYouTube(
  videoPath: string,
  title: string,
  description: string,
  tags: string[] = [],
  accessToken?: string,
  refreshToken?: string
) {
  try {
    const oauth2Client = createOAuth2Client()

    // Set up authentication using provided tokens or environment variables
    if (accessToken && refreshToken) {
      oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
    } else if (process.env.YOUTUBE_REFRESH_TOKEN) {
      oauth2Client.setCredentials({
        refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
      })
    } else {
      throw new Error("No YouTube authentication credentials provided")
    }

    const youtube = google.youtube({
      version: "v3",
      auth: oauth2Client,
    })

    // Read video file
    const videoFile = fs.readFileSync(videoPath)
    const fileSize = fs.statSync(videoPath).size

    // Upload video
    const response = await youtube.videos.insert({
      part: ["snippet", "status"],
      requestBody: {
        snippet: {
          title,
          description,
          tags,
          categoryId: "27", // Education category
        },
        status: {
          privacyStatus: "public", // or "private", "unlisted"
        },
      },
      media: {
        body: videoFile,
      },
    })

    return {
      id: response.data.id,
      url: `https://youtube.com/watch?v=${response.data.id}`,
    }
  } catch (error) {
    console.error("Error uploading to YouTube:", error)
    throw new Error("Failed to upload video to YouTube")
  }
}

export async function generateYouTubeTags(className: string, subjectName: string, topicName: string) {
  const baseTags = [
    "education",
    "quiz",
    "learning",
    "students",
    "india",
    "cbse",
    "icse",
    className.toLowerCase(),
    subjectName.toLowerCase(),
    topicName.toLowerCase(),
  ]

  // Add common educational tags
  const commonTags = [
    "exam preparation",
    "study tips",
    "educational video",
    "online learning",
    "academic",
    "curriculum",
  ]

  return [...baseTags, ...commonTags]
}
