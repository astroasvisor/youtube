# Quiz Video Generator

A comprehensive Next.js application for generating YouTube Shorts quiz videos for Indian students (Classes 9-12). Features AI-powered question generation, video creation with Remotion, and automatic YouTube uploads.

## Features

### ✅ Core Features
- **AI Question Generation**: Generate syllabus-based quiz questions using OpenAI API
- **Video Generation**: Create professional YouTube Shorts with countdown timers and answer reveals using Remotion
- **YouTube Integration**: Automatic video uploads with proper titles, descriptions, and tags
- **Admin Dashboard**: Complete management interface for classes, subjects, topics, questions, and videos
- **Database Management**: PostgreSQL with Prisma ORM for data persistence
- **Authentication**: NextAuth.js with role-based access control

### ✅ Video Flow
1. **Question Screen**: Displays question with 4 options and countdown timer (10 seconds)
2. **Answer Screen**: Shows correct answer with explanation (5 seconds)
3. **Portrait Format**: Optimized for YouTube Shorts (9:16 aspect ratio)

### ✅ Admin Features
- Manage classes (9-12), subjects, and topics
- Generate and manage quiz questions with AI
- Track video generation and upload status
- Approve/reject/ban questions
- Batch video generation

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, TailwindCSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **AI**: OpenAI API (GPT-3.5-turbo)
- **Video Generation**: Remotion
- **YouTube API**: Google YouTube Data API v3

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL database
- OpenAI API key
- YouTube API credentials (Client ID, Client Secret, Refresh Token)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd quiz-video-generator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/quiz_generator"

   # NextAuth
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"

   # OpenAI API
   OPENAI_API_KEY="your-openai-api-key"

   # YouTube API
   YOUTUBE_CLIENT_ID="your-youtube-client-id"
   YOUTUBE_CLIENT_SECRET="your-youtube-client-secret"
   YOUTUBE_REFRESH_TOKEN="your-youtube-refresh-token"
   ```

   ## Database Seed Data

   The application includes a comprehensive seed file that populates the database with CBSE curriculum data:

   ### Included Classes (9-12)
   - **Class 9**: Physics, Chemistry, Biology
   - **Class 10**: Physics, Chemistry, Biology
   - **Class 11**: Physics, Chemistry, Biology, Mathematics
   - **Class 12**: Physics, Chemistry, Biology, Mathematics

   ### Sample Topics
   - **Physics**: Units and Measurements, Motion in a Straight Line, Laws of Motion, etc.
   - **Chemistry**: Some Basic Concepts of Chemistry, Structure of Atom, Chemical Bonding, etc.
   - **Biology**: The Living World, Cell Structure, Plant Physiology, Human Physiology, etc.
   - **Mathematics**: Sets, Relations and Functions, Trigonometry, Calculus, etc.

   The seed data follows the official CBSE curriculum and provides a solid foundation for generating quiz questions.

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   npm run db:seed
   ```

   **Note**: To reset and reseed the database:
   ```bash
   npx prisma migrate reset
   npx prisma migrate dev
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Home: http://localhost:3000
   - Admin Dashboard: http://localhost:3000/dashboard
   - Sign In: http://localhost:3000/auth/signin

## Usage Guide

### 1. Initial Setup

1. **Sign in** to the admin dashboard using:
   - Email: `admin@example.com`
   - Password: `admin123`

2. **Create Classes**: Add Class 9, 10, 11, 12 in the Classes management section

3. **Add Subjects**: For each class, add relevant subjects (Physics, Chemistry, Mathematics, Biology)

4. **Create Topics**: Add specific topics for each subject

### 2. Generate Questions

1. Go to **Questions** → **Generate Questions**
2. Select Class, Subject, and Topic
3. Choose difficulty level (Easy, Medium, Hard)
4. Set number of questions (1-10)
5. Click **Generate** to create AI-powered questions
6. Review and approve/reject questions in the Questions list

### 3. Create Videos

1. Go to **Generate Video** page
2. Select approved questions from the list
3. Enter video title (auto-generate option available)
4. Add description (optional)
5. Click **Generate Video**
6. Monitor progress in the Videos section

### 4. Upload to YouTube

1. Once video generation is complete, go to **Videos** section
2. Find your generated video
3. Click **Upload to YouTube**
4. Video will be automatically uploaded with proper metadata

## API Documentation

### Authentication
- `POST /api/auth/[...nextauth]` - NextAuth.js authentication

### Classes Management
- `GET /api/classes` - Get all classes with subjects and topics
- `POST /api/classes` - Create new class

### Subjects Management
- `POST /api/subjects` - Create new subject

### Topics Management
- `POST /api/topics` - Create new topic

### Questions Management
- `GET /api/questions` - Get questions (with status filter)
- `PATCH /api/questions/[id]` - Update question status
- `POST /api/generate-questions` - Generate questions with AI

### Video Management
- `GET /api/videos` - Get videos (with status filter)
- `POST /api/generate-video` - Generate video from questions
- `POST /api/videos/[id]/upload` - Upload video to YouTube

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Admin dashboard
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # Reusable components
├── lib/                   # Utilities and configurations
│   ├── auth.ts           # NextAuth configuration
│   ├── openai.ts         # OpenAI API integration
│   ├── prisma.ts         # Prisma client
│   └── youtube.ts        # YouTube API integration
├── remotion/             # Video generation
│   ├── compositions/     # Remotion compositions
│   └── index.ts          # Composition registry
└── middleware.ts         # Route protection
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `NEXTAUTH_SECRET` | NextAuth secret key | ✅ |
| `NEXTAUTH_URL` | Application URL | ✅ |
| `OPENAI_API_KEY` | OpenAI API key for question generation | ✅ |
| `YOUTUBE_CLIENT_ID` | YouTube OAuth client ID | ✅ |
| `YOUTUBE_CLIENT_SECRET` | YouTube OAuth client secret | ✅ |
| `YOUTUBE_REFRESH_TOKEN` | YouTube OAuth refresh token | ✅ |

## Development

### Database Management
```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# View database
npx prisma studio
```

### Video Development
```bash
# Start Remotion studio (for video development)
npx remotion studio src/remotion/index.ts

# Render video
npx remotion render src/remotion/index.ts QuizVideo output.mp4
```

### Testing
```bash
# Run tests
npm test

# Run linting
npm run lint
```

## Deployment

### Vercel (Recommended)
1. Connect your repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

### Manual Deployment
1. Build the application: `npm run build`
2. Set up production environment variables
3. Deploy to your hosting platform

## YouTube API Setup (Required for Auto-Posting)

**⚠️ IMPORTANT**: The auto-posting feature requires YouTube API authentication. Without proper setup, videos will be generated but cannot be uploaded to YouTube.

### Step 1: Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **Create a new project** or select an existing one
3. **Enable APIs**:
   - Search for "YouTube Data API v3"
   - Click "Enable"
4. **Create OAuth 2.0 credentials**:
   - Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
   - Choose "Web application"
   - Add authorized redirect URIs:
     - For development: `http://localhost:3000/api/auth/callback/google`
     - For production: `https://yourdomain.com/api/auth/callback/google`

### Step 2: Get OAuth Credentials

After creating the OAuth client, you'll get:
- **Client ID**
- **Client Secret**

### Step 3: Environment Variables Setup

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/quiz_generator"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"

# OpenAI API
OPENAI_API_KEY="your-openai-api-key"

# Google OAuth (Required for YouTube)
GOOGLE_CLIENT_ID="your-google-oauth-client-id"
GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
```

### Step 4: Authentication Flow

1. **Sign in with Google**: Use the "Sign in with Google" button on the signin page
2. **Grant permissions**: Allow access to your YouTube account
3. **Automatic token management**: NextAuth handles token refresh automatically
4. **Auto-posting ready**: Your session now has YouTube upload permissions

### Alternative: Manual Token Setup (Advanced)

If you prefer manual token management:

1. Use [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground)
2. Select scopes: `https://www.googleapis.com/auth/youtube.upload`
3. Exchange authorization code for refresh token
4. Add to `.env`:
   ```env
   YOUTUBE_REFRESH_TOKEN="your-refresh-token"
   ```

### Troubleshooting

**"Authentication required" error**:
- Ensure you're signed in with Google (not just credentials)
- Check that you've granted YouTube upload permissions
- Verify environment variables are set correctly

**"No YouTube authentication credentials provided"**:
- Make sure you're using Google OAuth (not manual tokens)
- Check that Google OAuth is properly configured in NextAuth
- Verify the redirect URI matches your setup

**Token expired**:
- NextAuth automatically refreshes tokens
- If issues persist, re-authenticate with Google

### Required Permissions

The application needs these Google OAuth scopes:
- `openid` - Basic profile information
- `email` - Email address
- `profile` - Profile information
- `https://www.googleapis.com/auth/youtube.upload` - Upload videos to YouTube

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team

---

**Built with ❤️ for Indian students' educational needs**