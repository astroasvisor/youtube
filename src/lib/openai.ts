import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface GeneratedQuestion {
  text: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctAnswer: "A" | "B" | "C" | "D"
  explanation: string
}

export async function generateQuestion(
  className: string,
  subjectName: string,
  topicName: string,
  difficulty: "EASY" | "MEDIUM" | "HARD" = "MEDIUM"
): Promise<GeneratedQuestion> {
  try {
    const prompt = `Create an engaging multiple-choice question for ${className} ${subjectName} students about "${topicName}" - optimized for YouTube Shorts!

🎯 YOUTUBE SHORTS OPTIMIZATION:
- Question must be THEORETICAL only (NO calculations, NO math, NO numbers)
- Quick to read and answer (5-8 seconds)
- Engaging and fun - like trivia or interesting facts
- Can include surprising general knowledge
- Keep it conversational and relatable

📝 QUESTION REQUIREMENTS:
- Difficulty: ${difficulty}
- CBSE syllabus-based but made interesting
- Test CONCEPTUAL understanding, not memorization
- Question text: 60-80 characters max (fits on screen)
- 4 options: Clear, distinct, plausible answers
- Only ONE correct answer
- Brief explanation: 1-2 sentences, engaging and easy to understand

🎨 MAKE IT ENGAGING:
- Use everyday examples when possible
- Add interesting twists or fun facts
- Avoid dry, textbook-style questions
- Make viewers think "Oh, I know this!" or "That's cool!"

❌ AVOID:
- Any calculations or numerical answers
- Complex scientific terms (explain simply)
- Boring definitions or classifications
- Questions that require deep analysis

✅ EXAMPLES OF GOOD QUESTIONS:
- "What makes leaves green?" (not "Calculate chlorophyll absorption")
- "Why do we see rainbows?" (not "Solve for prism refraction angle")
- "Which planet has rings?" (not "Calculate orbital mechanics")

You MUST respond with valid JSON in exactly this format:
{
  "text": "What makes plants green and helps them make food?",
  "optionA": "Sunlight",
  "optionB": "Chlorophyll",
  "optionC": "Water",
  "optionD": "Soil",
  "correctAnswer": "B",
  "explanation": "Chlorophyll is the green pigment in plants that captures sunlight to make food through photosynthesis!"
}

Do not include any other text, markdown, or formatting. Just the JSON object.`

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini", // gpt-3.5-turbo is too old. currently the most advanced model for our task is gpt-4.1-mini
      messages: [
        {
          role: "system",
          content: "You are a creative teacher making fun, engaging quiz questions for YouTube Shorts! Create theoretical questions that are quick to read, spark curiosity, and teach something interesting. Focus on conceptual understanding with everyday examples. Always respond with valid JSON only - no extra text!"
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error("No response from OpenAI")
    }

    // Clean the content to handle potential formatting issues
    let cleanedContent = content.trim()

    // Remove any markdown code block markers
    cleanedContent = cleanedContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '')

    // Try to extract JSON if it's wrapped in other text
    const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      cleanedContent = jsonMatch[0]
    }

    let parsed: GeneratedQuestion
    try {
      parsed = JSON.parse(cleanedContent) as GeneratedQuestion
    } catch (parseError) {
      console.error("JSON parse error:", parseError)
      console.error("Raw content:", content)
      console.error("Cleaned content:", cleanedContent)

      // Try to fix common JSON issues
      try {
        // Replace single quotes with double quotes (if any)
        let fixedContent = cleanedContent.replace(/'/g, '"')
        // Fix trailing commas
        fixedContent = fixedContent.replace(/,(\s*[}\]])/g, '$1')
        // Fix missing commas between properties
        fixedContent = fixedContent.replace(/"\s*"\s*([A-Za-z_])/g, '", "$1')
        // Fix missing commas after values
        fixedContent = fixedContent.replace(/([a-zA-Z0-9"])\s*"/g, '$1", "')

        parsed = JSON.parse(fixedContent) as GeneratedQuestion
        console.log("Successfully parsed after fixing JSON")
      } catch (fixError) {
        console.error("Failed to fix JSON:", fixError)
        throw new Error(`Failed to parse OpenAI response as JSON: ${parseError}`)
      }
    }

    // Validate the response
    if (!parsed.text || !parsed.optionA || !parsed.optionB || !parsed.optionC || !parsed.optionD || !parsed.correctAnswer || !parsed.explanation) {
      console.error("Invalid response structure:", parsed)
      throw new Error("Invalid response format from OpenAI - missing required fields")
    }

    if (!["A", "B", "C", "D"].includes(parsed.correctAnswer)) {
      throw new Error(`Invalid correct answer format: ${parsed.correctAnswer}`)
    }

    // YouTube Shorts specific validation
    // Ensure question is concise (under 100 characters for YouTube Shorts)
    if (parsed.text.length > 100) {
      console.warn(`Question text is too long for Shorts (${parsed.text.length} chars): ${parsed.text}`)
    }

    // Check if explanation is engaging and not too technical
    const explanationWords = parsed.explanation.toLowerCase()
    const technicalTerms = ['therefore', 'hence', 'consequently', 'furthermore', 'moreover', 'whereas', 'nonetheless']
    const hasTechnicalTerms = technicalTerms.some(term => explanationWords.includes(term))

    if (hasTechnicalTerms && parsed.explanation.length > 120) {
      console.warn(`Explanation might be too technical for Shorts: ${parsed.explanation}`)
    }

    return parsed
  } catch (error) {
    console.error("Error generating question:", error)
    throw new Error("Failed to generate question")
  }
}

export async function generateQuestions(
  className: string,
  subjectName: string,
  topicName: string,
  count: number = 5,
  difficulty: "EASY" | "MEDIUM" | "HARD" = "MEDIUM"
): Promise<GeneratedQuestion[]> {
  const questions: GeneratedQuestion[] = []

  for (let i = 0; i < count; i++) {
    try {
      const question = await generateQuestion(className, subjectName, topicName, difficulty)
      questions.push(question)

      // Small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000))
    } catch (error) {
      console.error(`Error generating question ${i + 1}:`, error)
      // Continue with remaining questions even if one fails
    }
  }

  return questions
}
