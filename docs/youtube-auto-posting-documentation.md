# YouTube Auto-Posting Feature Documentation

## Overview

The YouTube Auto-Posting feature enables automated generation and publishing of educational quiz videos to YouTube. This system creates engaging, curriculum-based quiz content for Indian students (Classes 9-12) and automatically posts them to YouTube with proper titles, descriptions, and educational tags.

## Key Features

- **🤖 AI-Powered Content Generation**: Uses OpenAI to create engaging quiz questions, titles, and descriptions
- **🎯 Intelligent Topic Selection**: Tracks topic usage to ensure comprehensive curriculum coverage
- **🎬 Automated Video Generation**: Creates professional quiz videos using Remotion
- **📺 YouTube Integration**: Automatic upload with optimized metadata and tags
- **⚡ Real-time Progress Tracking**: Live updates via Server-Sent Events during processing
- **🔄 Batch Processing**: Generate multiple videos (one per subject) in a single run
- **📊 Topic Coverage Tracking**: Ensures all topics are covered before repetition

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Admin Page    │    │   Auto-Post     │    │   YouTube API   │
│   (Frontend)    │───▶│     API         │───▶│   Integration   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Topic         │    │   OpenAI API    │    │   Remotion      │
│   Selection     │    │   Content       │    │   Video         │
│   Logic         │    │   Generation    │    │   Generation    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## How It Works

### Step 1: Class Selection
- Admin selects a class (Class 9, 10, 11, or 12) from the admin interface
- System loads all subjects and topics for the selected class

### Step 2: Intelligent Topic Selection
- Analyzes topic usage history using the `TopicUsage` database table
- Prioritizes unused topics or least-recently-used topics
- Ensures comprehensive curriculum coverage
- Selects one topic per subject for video generation

### Step 3: AI Content Generation
- Uses OpenAI GPT-4.1-mini to generate:
  - Engaging video titles (30-60 characters)
  - Rich descriptions (200-300 characters) with questions and answers
  - Quiz questions with 4 multiple-choice options
  - Educational explanations
- All content optimized for YouTube Shorts format

### Step 4: Video Generation
- Creates temporary Remotion project structure
- Generates quiz video with:
  - 10-second question display with countdown
  - 5-second answer reveal with explanation
  - Professional styling and animations
  - 9:16 aspect ratio (YouTube Shorts optimized)

### Step 5: YouTube Upload
- Uses Google YouTube Data API v3
- Uploads video with optimized metadata:
  - Educational category (ID: 27)
  - Comprehensive tags for discoverability
  - Detailed descriptions with questions and answers
  - Public privacy status

### Step 6: Usage Tracking
- Records topic usage in `TopicUsage` table
- Updates video status in database
- Tracks YouTube video IDs for reference

## Admin Interface

### Dashboard Location
- **URL**: `/dashboard/auto-post`
- **Access**: Requires authentication (Google OAuth for YouTube access)

### Interface Components

#### 1. Authentication Status Panel
```typescript
// Shows YouTube connection status
<div className="bg-white rounded-lg shadow-md p-6 mb-8">
  <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
  <div className="flex items-center gap-4">
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${session?.accessToken ? 'bg-green-500' : 'bg-red-500'}`} />
      <span className="font-medium">
        YouTube Access: {session?.accessToken ? '✅ Connected' : '❌ Not Connected'}
      </span>
    </div>
    {!session?.accessToken && (
      <button className="bg-blue-600 text-white px-4 py-2 rounded-md">
        Sign in with Google
      </button>
    )}
  </div>
</div>
```

#### 2. Class Selection Panel
```typescript
// Dropdown for class selection with subject preview
<div className="bg-white rounded-lg shadow-md p-6 mb-8">
  <h2 className="text-xl font-semibold mb-4">Select Class</h2>
  <select
    value={selectedClassId}
    onChange={(e) => setSelectedClassId(e.target.value)}
    className="w-full p-3 border border-gray-300 rounded-md"
  >
    <option value="">Select a class...</option>
    {classes.map((cls) => (
      <option key={cls.id} value={cls.id}>
        {cls.name} ({cls.subjects.length} subjects)
      </option>
    ))}
  </select>

  {/* Subject preview grid */}
  {selectedClassId && (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      {subjects.map((subject) => (
        <div key={subject.id} className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium">{subject.name}</h4>
          <p className="text-sm text-gray-600">{subject.topics.length} topics</p>
        </div>
      ))}
    </div>
  )}
</div>
```

#### 3. Control Panel
```typescript
// Start/stop controls with status
<div className="bg-white rounded-lg shadow-md p-6 mb-8">
  <h2 className="text-xl font-semibold mb-4">Auto-Post Control</h2>
  <div className="flex gap-4">
    <button
      onClick={handleStartAutoPost}
      disabled={autoPostStatus.isRunning || !selectedClassId}
      className="bg-blue-600 text-white px-6 py-3 rounded-md"
    >
      {autoPostStatus.isRunning ? "Auto-Post Running..." : "Start Auto-Post"}
    </button>
    {autoPostStatus.isRunning && (
      <button className="bg-red-600 text-white px-6 py-3 rounded-md">
        Stop Auto-Post
      </button>
    )}
  </div>
</div>
```

#### 4. Progress Tracking
```typescript
// Real-time progress with subject status
<div className="bg-white rounded-lg shadow-md p-6 mb-8">
  <h2 className="text-xl font-semibold mb-4">Progress</h2>

  {/* Overall progress bar */}
  <div className="mb-6">
    <div className="flex justify-between items-center mb-2">
      <span className="text-sm font-medium">Overall Progress</span>
      <span className="text-sm text-gray-500">{progress}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div className="bg-blue-600 h-2 rounded-full" style={{width: `${progress}%`}} />
    </div>
  </div>

  {/* Subject status grid */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {results.map((result) => (
      <div key={result.subjectName} className="border rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-medium">{result.subjectName}</h4>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            result.status === "completed" ? "bg-green-100 text-green-800" :
            result.status === "failed" ? "bg-red-100 text-red-800" :
            "bg-blue-100 text-blue-800"
          }`}>
            {result.status}
          </span>
        </div>
        {result.youtubeUrl && (
          <a href={result.youtubeUrl} className="text-blue-600 text-sm underline">
            View on YouTube →
          </a>
        )}
      </div>
    ))}
  </div>
</div>
```

## Setup Requirements

### 1. YouTube API Configuration

#### Google Cloud Console Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable "YouTube Data API v3"
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URIs:
   - Development: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://yourdomain.com/api/auth/callback/google`

#### Environment Variables
```env
# Google OAuth (Required for YouTube)
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
```

### 2. Authentication Flow

#### User Authentication
- Users must sign in with Google (not credentials)
- Grants YouTube upload permissions (`https://www.googleapis.com/auth/youtube.upload`)
- NextAuth automatically manages tokens and refresh

#### Token Management
- Access tokens stored in user session
- Automatic refresh handling by NextAuth
- Secure token isolation per user

## API Endpoints

### POST `/api/auto-post`

**Purpose**: Orchestrates complete auto-posting workflow

**Request Body**:
```json
{
  "classId": "string"
}
```

**Response**: Server-Sent Events stream with real-time updates

**Event Types**:
```typescript
// Status updates
{
  "type": "status",
  "step": "Processing Physics...",
  "progress": 75
}

// Subject results
{
  "type": "result",
  "subjectName": "Physics",
  "status": "completed",
  "videoId": "video-123",
  "youtubeUrl": "https://youtube.com/watch?v=abc123"
}
```

**Authentication**: Required (Google OAuth session)

**Error Handling**:
- 401: Authentication required
- 400: Invalid class ID
- 404: Class not found

## Database Schema

### TopicUsage Table
```sql
CREATE TABLE TopicUsage (
  id String PRIMARY KEY,
  classId String,
  subjectId String,
  topicId String,
  usedAt DateTime DEFAULT NOW(),
  videoId String?, -- Links to generated video

  UNIQUE(classId, subjectId, topicId, usedAt)
)
```

**Purpose**: Tracks which topics have been used for video generation to ensure comprehensive coverage.

## Usage Workflow

### For Administrators

1. **Navigate to Auto-Post Page**: `/dashboard/auto-post`
2. **Verify Authentication**: Ensure green "Connected" status
3. **Select Class**: Choose target class from dropdown
4. **Review Subjects**: Preview subjects and topic counts
5. **Start Auto-Post**: Click "Start Auto-Post" button
6. **Monitor Progress**: Watch real-time progress updates
7. **View Results**: Check YouTube links for completed videos

### Example Run (Class 11 with 4 subjects)

1. **Topic Selection**: Selects 4 topics (one per subject) based on usage history
2. **Content Generation**: Creates titles, descriptions, and questions for each subject
3. **Video Generation**: Generates 4 quiz videos (one per subject)
4. **YouTube Upload**: Uploads all videos with proper metadata
5. **Usage Tracking**: Records topic usage for future runs

## Troubleshooting

### Common Issues

#### "Authentication required" Error
- **Cause**: User not signed in with Google
- **Solution**: Click "Sign in with Google" button and grant YouTube permissions

#### "YouTube authentication tokens not available"
- **Cause**: Missing or invalid OAuth tokens
- **Solution**: Re-authenticate with Google and ensure YouTube upload scope is granted

#### "Video file not found after generation"
- **Cause**: Remotion video generation failed
- **Solution**: Check server logs for Remotion errors, ensure sufficient disk space

#### "No YouTube authentication credentials provided"
- **Cause**: Environment variables not set or invalid
- **Solution**: Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env` file

### Debugging Steps

1. **Check Authentication Status**: Verify green "Connected" indicator
2. **Review Browser Console**: Check for JavaScript errors
3. **Monitor Server Logs**: Look for API errors in server console
4. **Verify Environment Variables**: Ensure all required variables are set
5. **Test Individual Components**: Test video generation and YouTube upload separately

## Performance Considerations

### Processing Time
- **Single Subject Video**: ~2-3 minutes
- **4-Subject Batch**: ~8-12 minutes
- **Factors**: OpenAI API response time, video generation complexity

### Resource Usage
- **CPU**: High during video generation (Remotion rendering)
- **Memory**: Moderate (~500MB for video generation)
- **Storage**: ~50MB per generated video
- **Network**: Upload bandwidth for YouTube API

### Optimization Tips
- **Batch Size**: Start with 2-3 subjects for testing
- **Concurrent Processing**: Currently processes subjects sequentially
- **Error Recovery**: Failed videos don't block other subjects
- **Cleanup**: Temporary files automatically removed after processing

## Security Considerations

### OAuth Security
- **Scope Limitation**: Only requests necessary YouTube upload permissions
- **Token Isolation**: YouTube tokens tied to individual user sessions
- **Automatic Refresh**: Tokens refreshed automatically by NextAuth
- **Secure Storage**: Tokens stored securely in HTTP-only cookies

### API Security
- **Authentication Required**: All auto-post endpoints require valid session
- **Input Validation**: Class IDs and parameters validated
- **Error Handling**: Sensitive information not exposed in error messages
- **Rate Limiting**: Implicit rate limiting through sequential processing

## Future Enhancements

### Planned Features
- **Custom Topic Selection**: Allow manual topic selection override
- **Batch Configuration**: Configure subjects per run, processing order
- **Advanced Scheduling**: Schedule auto-posting at specific times
- **Analytics Integration**: Track video performance metrics
- **Multi-Channel Support**: Support multiple YouTube channels
- **Content Templates**: Customizable video templates and styles

### Scalability Improvements
- **Concurrent Processing**: Process multiple subjects simultaneously
- **Queue System**: Implement job queue for large batch processing
- **Caching**: Cache generated content and metadata
- **CDN Integration**: Optimize video delivery for global audiences

## Support and Maintenance

### Regular Tasks
- **Monitor Topic Coverage**: Ensure all topics are being used
- **Update YouTube Tags**: Refresh tag lists based on trending topics
- **Review Failed Videos**: Investigate and fix recurring generation failures
- **Backup Usage Data**: Regular backup of TopicUsage tracking data

### Monitoring
- **Success Rate**: Track percentage of successful auto-post runs
- **Processing Time**: Monitor average completion times
- **Error Patterns**: Identify and address common failure modes
- **Resource Usage**: Monitor system performance and resource consumption

---

## Quick Start Guide

1. **Setup YouTube API** (Google Cloud Console)
2. **Configure Environment Variables** (`.env` file)
3. **Sign in with Google** (admin dashboard)
4. **Navigate to Auto-Post Page** (`/dashboard/auto-post`)
5. **Select Class** and click **Start Auto-Post**
6. **Monitor Progress** and wait for completion
7. **View Results** on YouTube

**Total Setup Time**: ~15-20 minutes
**First Video Generation**: ~10-15 minutes per subject

The YouTube Auto-Posting feature provides a complete, production-ready solution for automated educational content creation and publishing! 🎉
