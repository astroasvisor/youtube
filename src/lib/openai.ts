import OpenAI from "openai"

/**
 * OpenAI client instance configured with API key
 * Use this client for all OpenAI API interactions
 */
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Standard question format for quiz generation
 * Used across all question generation functions
 */
export interface GeneratedQuestion {
  text: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: "A" | "B" | "C" | "D"
  explanation: string
  topicId?: string // Optional: To associate question with a topic
}

/**
 * Extended question format with SEO-optimized video metadata
 * Includes title and description for better YouTube discoverability
 */
export interface GeneratedQuestionWithMetadata extends GeneratedQuestion {
  videoTitle: string // SEO-optimized title (30-60 characters)
  videoDescription: string // SEO-optimized description (200-400 characters)
}
