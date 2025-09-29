import { google } from "googleapis"
import fs from "fs"

interface ErrorWithResponse {
  response?: {
    data?: unknown
  }
  message?: string
}

interface YouTubeRequestBody {
  snippet: {
    title: string
    description: string
    tags: string[]
    categoryId: string
    defaultLanguage?: string
    defaultAudioLanguage?: string
  }
  status: {
    privacyStatus: string
    embeddable?: boolean
    publicStatsViewable?: boolean
    selfDeclaredMadeForKids?: boolean
    publishAt?: string
    license?: string
    madeForKids?: boolean
  }
  recordingDetails?: {
    recordingDate: string
    location?: {
      latitude?: number
      longitude?: number
      altitude?: number
    }
    locationDescription?: string
  }
  [key: string]: unknown
}

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
  refreshToken?: string,
  options: {
    // Snippet parameters
    categoryId?: string
    defaultLanguage?: string
    defaultAudioLanguage?: string

    // Status parameters
    privacyStatus?: "public" | "private" | "unlisted"
    publishAt?: Date
    license?: "youtube" | "creativeCommon"
    embeddable?: boolean
    publicStatsViewable?: boolean

    // Additional features
    madeForKids?: boolean
    selfDeclaredMadeForKids?: boolean

    // Recording details
    recordingDate?: Date
    location?: {
      latitude?: number
      longitude?: number
      altitude?: number
    }
    locationDescription?: string

    // Playlist management
    playlists?: {
      autoAddToPlaylists?: boolean
      className?: string
      subjectName?: string
      classNumber?: string // e.g., "11", "12"
      playlistNamePattern?: string // e.g., "{Subject} - Class {Class} - Shorts"
    }
  } = {}
) {
  try {
    const oauth2Client = createOAuth2Client()

    // Set up authentication using provided tokens or environment variables
    console.log("Client ID:", process.env.GOOGLE_CLIENT_ID ? "Set" : "Not set")
    console.log("Client Secret:", process.env.GOOGLE_CLIENT_SECRET ? "Set" : "Not set")
    console.log("Redirect URI:", `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/auth/callback/google`)

    if (accessToken && refreshToken) {
      console.log("Setting credentials with provided tokens")
      console.log("Access token length:", accessToken.length)
      console.log("Refresh token length:", refreshToken.length)

      oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
      })

      // Force refresh the access token to ensure it's valid
      try {
        console.log("Attempting to refresh access token...")
        const { credentials } = await oauth2Client.refreshAccessToken()
        console.log("Token refreshed successfully")
        console.log("New access token length:", credentials.access_token?.length || 0)
        oauth2Client.setCredentials(credentials)
      } catch (refreshError: unknown) {
        console.error("Failed to refresh access token:", refreshError)
        console.error("Refresh error details:", (refreshError as ErrorWithResponse)?.response?.data || (refreshError as ErrorWithResponse)?.message || refreshError)

        // If refresh fails, try to use the existing token
        console.log("Refresh failed, using existing access token")
        console.log("Existing access token expires at:", oauth2Client.credentials.expiry_date)
        const now = Math.floor(Date.now() / 1000)
        console.log("Current time:", now)
        console.log("Token expired:", oauth2Client.credentials.expiry_date ? oauth2Client.credentials.expiry_date < now : "No expiry date")
      }
    } else if (process.env.YOUTUBE_REFRESH_TOKEN) {
      console.log("Using environment refresh token")
      console.log("Environment refresh token length:", process.env.YOUTUBE_REFRESH_TOKEN.length)
      oauth2Client.setCredentials({
        refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
      })

      // Force refresh the access token
      try {
        console.log("Attempting to refresh access token from env...")
        const { credentials } = await oauth2Client.refreshAccessToken()
        console.log("Environment token refreshed successfully")
        console.log("New access token length:", credentials.access_token?.length || 0)
        oauth2Client.setCredentials(credentials)
      } catch (refreshError: unknown) {
        console.error("Failed to refresh access token from environment:", refreshError)
        console.error("Refresh error details:", (refreshError as ErrorWithResponse)?.response?.data || (refreshError as ErrorWithResponse)?.message || refreshError)
        throw new Error(`Failed to refresh YouTube access token: ${(refreshError as ErrorWithResponse)?.message || 'Unknown error'}`)
      }
    } else {
      console.error("No YouTube authentication credentials available")
      console.error("Available env vars:", {
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        hasYoutubeRefreshToken: !!process.env.YOUTUBE_REFRESH_TOKEN,
        nextauthUrl: process.env.NEXTAUTH_URL
      })
      throw new Error("No YouTube authentication credentials provided")
    }

    // Add final debugging before API call
    console.log("OAuth2 client credentials before API call:", {
      hasAccessToken: !!oauth2Client.credentials.access_token,
      hasRefreshToken: !!oauth2Client.credentials.refresh_token,
      accessTokenLength: oauth2Client.credentials.access_token?.length || 0,
      refreshTokenLength: oauth2Client.credentials.refresh_token?.length || 0,
      expiryDate: oauth2Client.credentials.expiry_date,
      currentTime: Math.floor(Date.now() / 1000)
    })

    const youtube = google.youtube({
      version: "v3",
      auth: oauth2Client,
    })

    // Create readable stream for video file
    const videoFileStream = fs.createReadStream(videoPath)

    // Build the request body with all available parameters
    const requestBody: YouTubeRequestBody = {
      snippet: {
        title,
        description,
        tags,
        categoryId: options.categoryId || "27", // Education category
      },
      status: {
        privacyStatus: options.privacyStatus || "public",
      },
    }

    // Add optional snippet parameters
    if (options.defaultLanguage) {
      requestBody.snippet.defaultLanguage = options.defaultLanguage
    }

    if (options.defaultAudioLanguage) {
      requestBody.snippet.defaultAudioLanguage = options.defaultAudioLanguage
    }

    // Add optional status parameters
    if (options.publishAt) {
      requestBody.status.publishAt = options.publishAt.toISOString()
    }

    if (options.license) {
      requestBody.status.license = options.license
    }

    if (options.embeddable !== undefined) {
      requestBody.status.embeddable = options.embeddable
    }

    if (options.publicStatsViewable !== undefined) {
      requestBody.status.publicStatsViewable = options.publicStatsViewable
    }

    // Add recording details if provided
    if (options.recordingDate || options.location || options.locationDescription) {
      requestBody.recordingDetails = {
        recordingDate: options.recordingDate?.toISOString() || new Date().toISOString()
      }

      if (options.location) {
        requestBody.recordingDetails.location = options.location
      }

      if (options.locationDescription) {
        requestBody.recordingDetails.locationDescription = options.locationDescription
      }
    }

    // Add made for kids settings if provided
    if (options.madeForKids !== undefined) {
      requestBody.status.madeForKids = options.madeForKids
    }

    if (options.selfDeclaredMadeForKids !== undefined) {
      requestBody.status.selfDeclaredMadeForKids = options.selfDeclaredMadeForKids
    }

    console.log("Uploading to YouTube with options:", {
      title,
      tags: tags.length,
      categoryId: requestBody.snippet.categoryId,
      privacyStatus: requestBody.status.privacyStatus,
      hasRecordingDetails: !!requestBody.recordingDetails,
      madeForKids: requestBody.status.madeForKids
    })

    // Upload video
    const response = await youtube.videos.insert({
      part: ["snippet", "status", "recordingDetails"].filter(part =>
        requestBody[part.replace("recordingDetails", "recordingDetails")] !== undefined ||
        part === "snippet" || part === "status"
      ),
      requestBody,
      media: {
        body: videoFileStream,
      },
    })

    const videoId = response.data.id
    if (!videoId) {
      throw new Error("Failed to get video ID from YouTube API response.")
    }
    const result = {
      id: videoId,
      url: `https://youtube.com/watch?v=${videoId}`,
      playlists: [] as Array<{ id: string, title: string, url: string }>,
    }

    // Handle playlist management
    if (options.playlists?.autoAddToPlaylists && options.playlists.className && options.playlists.subjectName) {
      try {
        console.log("Playlist options:", options.playlists)
        const playlistName = await generatePlaylistName(
          options.playlists.subjectName,
          options.playlists.className,
          options.playlists.classNumber,
          options.playlists.playlistNamePattern
        )

        console.log(`🔍 Looking for playlist: "${playlistName}"`)

        // Search for existing playlist
        const existingPlaylist = await findExistingPlaylist(
          playlistName,
          accessToken!,
          refreshToken!
        )

        if (existingPlaylist && existingPlaylist.id) {
          console.log(`✅ Found existing playlist: ${existingPlaylist.title}`)

          // Add video to existing playlist
          try {
            await addVideoToPlaylist(
              existingPlaylist.id,
              videoId,
              accessToken!,
              refreshToken!
            )

            console.log(`✅ Added video to playlist: ${existingPlaylist.title}`)
            result.playlists.push({
              id: existingPlaylist.id,
              title: existingPlaylist.title,
              url: `https://youtube.com/playlist?list=${existingPlaylist.id}`
            } as const)

          } catch (playlistError) {
            console.error(`❌ Failed to add video to playlist ${existingPlaylist.title}:`, playlistError)
          }
        } else {
          console.log(`⚠️ Playlist not found: "${playlistName}"`)
          console.log(`💡 Available playlists: You need to create "${playlistName}" manually in YouTube`)
        }

      } catch (playlistError) {
        console.error("❌ Playlist management failed:", playlistError)
        // Don't fail the entire upload if playlist management fails
      }
    }

    console.log("✅ Video upload completed:", {
      videoId,
      title,
      playlistsCount: result.playlists.length
    })

    return result
  } catch (error) {
    console.error("Error uploading to YouTube:", error)
    throw new Error("Failed to upload video to YouTube")
  }
}

// Playlist management functions
export async function generatePlaylistName(
  subjectName: string,
  className: string,
  classNumber?: string,
  pattern?: string
): Promise<string> {
  // Default pattern: "{Subject} - {Class} - Shorts"
  const defaultPattern = "{Subject} - {Class} - Shorts"

    console.log("generatePlaylistName inputs:", {
      subjectName,
      className,
      classNumber,
      pattern,
      defaultPattern
    })

  let namePattern = pattern || defaultPattern

  // Replace placeholders with actual values using a map
  const replacements: Record<string, string> = {
    "{Subject}": subjectName,
    "{Class}": className,
    "{ClassNumber}": classNumber || ""
  }

  for (const [placeholder, value] of Object.entries(replacements)) {
    namePattern = namePattern.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value)
  }

  console.log("generatePlaylistName result:", namePattern)
  return namePattern
}

interface PlaylistInfo {
  id: string
  title: string
  url: string
}

export async function findExistingPlaylist(
  playlistName: string,
  accessToken: string,
  refreshToken: string
): Promise<PlaylistInfo | null> {
  try {
    const oauth2Client = createOAuth2Client()
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    const youtube = google.youtube({
      version: "v3",
      auth: oauth2Client,
    })

    // Search for playlists with the exact title
    const response = await youtube.playlists.list({
      part: ["snippet"],
      mine: true,
      maxResults: 50, // YouTube API allows max 50 results per request
    })

    // Find playlist with exact title match
    const playlist = response.data.items?.find(
      (item) => item.snippet?.title === playlistName
    )

    if (playlist && playlist.id && playlist.snippet?.title) {
      return {
        id: playlist.id,
        title: playlist.snippet.title,
        url: `https://youtube.com/playlist?list=${playlist.id}`
      }
    }

    return null

  } catch (error) {
    console.error("Error finding playlist:", error)
    return null
  }
}

export async function addVideoToPlaylist(
  playlistId: string,
  videoId: string,
  accessToken: string,
  refreshToken: string
) {
  try {
    const oauth2Client = createOAuth2Client()
    oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    })

    const youtube = google.youtube({
      version: "v3",
      auth: oauth2Client,
    })

    const response = await youtube.playlistItems.insert({
      part: ["snippet"],
      requestBody: {
        snippet: {
          playlistId,
          resourceId: {
            kind: "youtube#video",
            videoId,
          },
        },
      },
    })

    return response.data
  } catch (error) {
    console.error("Error adding video to playlist:", error)
    throw new Error("Failed to add video to playlist")
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
