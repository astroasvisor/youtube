import { openai } from "./openai"

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

type OpenAIResponse = GeneratedQuestion | {
  questions: GeneratedQuestion[]
}

export async function generateQuestion(
  className: string,
  subjectName: string,
  topicName: string,
  difficulty: "EASY" | "MEDIUM" | "HARD" = "MEDIUM"
): Promise<GeneratedQuestion> {
  try {
    const prompt = `Create an engaging multiple-choice question for ${className} ${subjectName} students about "${topicName}" - optimized for YouTube Shorts! It is very important that if more than one question is asked to be generated in one request, then provide enough variety of questions to cover all major aspects of the topic. Please do not send variations of the same question.

🎯 YOUTUBE SHORTS OPTIMIZATION:
- Question must be THEORETICAL only (NO calculations, NO math, NO numbers)
- Quick to read and answer (5-8 seconds)
- Engaging and fun - like trivia or interesting facts
- Can include surprising general knowledge
- Keep it conversational and relatable

📝 QUESTION REQUIREMENTS:
- Difficulty: ${difficulty}
- IMPORTANT: CBSE/NEET/JEE syllabus-based but made interesting
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
- Avoid sending variations of the same question like in this manner:
  Variation 1: Why is conserving biodiversity like protecting a giant jigsaw puzzle?
  Variation 2: Why is protecting biodiversity like saving a giant puzzle?

✅ EXAMPLES OF GOOD QUESTIONS:
- "What makes leaves green?" (not "Calculate chlorophyll absorption")
- "Why do we see rainbows?" (not "Solve for prism refraction angle")
- "Which planet has rings?" (not "Calculate orbital mechanics")
- When more than one question is asked to be generated in one request, then provide enough variety of questions to cover all major aspects of the topic. For example,
  Question 1: Why is protecting biodiversity like saving a giant puzzle?
  Question 2: Which region of the Earth is known for the maximum biodiversity?

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
      model: "gpt-4o-mini", // gpt-3.5-turbo is too old. currently the most advanced model for our task is gpt-4o-mini
      messages: [
        {
          role: "system",
          content: "You are a creative teacher making fun, engaging quiz questions for YouTube Shorts! Create theoretical questions that are quick to read, spark curiosity, and teach something interesting. Focus on conceptual understanding with everyday examples. Always respond with valid JSON only - no extra text!. Do not include numerical problems, and heavy calculations as the content is for YouTube Shorts. There are enough theoretical problems asked in previous exams and books like Concepts of Physics, H.C. Verma, etc. It is very important that if more than one question is asked to be generated in one request, then provide enough variety of questions to cover all major aspects of the topic."
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

    // Handle multiple JSON objects - OpenAI sometimes returns multiple objects
    // Split by lines and find individual JSON objects
    const jsonObjectRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g
    const jsonMatches = cleanedContent.match(jsonObjectRegex)
    
    if (jsonMatches && jsonMatches.length > 0) {
      // Take the first valid JSON object
      cleanedContent = jsonMatches[0]
      
      if (jsonMatches.length > 1) {
        console.warn(`OpenAI returned ${jsonMatches.length} JSON objects, using the first one`)
      }
    } else {
      // Fallback to original logic
      const jsonMatch = cleanedContent.match(/\{[\s\S]*?\}/)
      if (jsonMatch) {
        cleanedContent = jsonMatch[0]
      }
    }

    let parsed: OpenAIResponse
    try {
      parsed = JSON.parse(cleanedContent) as OpenAIResponse
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

        parsed = JSON.parse(fixedContent) as OpenAIResponse
        console.log("Successfully parsed after fixing JSON")
      } catch (fixError) {
        console.error("Failed to fix JSON:", fixError)
        throw new Error(`Failed to parse OpenAI response as JSON: ${parseError}`)
      }
    }

    // Handle both single question and questions array formats
    let questionData: GeneratedQuestion

    if ('questions' in parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
      // OpenAI returned a questions array - take the first question
      console.log(`OpenAI returned ${parsed.questions.length} questions, using the first one`)
      questionData = parsed.questions[0]

      // Validate that the first question has all required fields
      if (!questionData.text || !questionData.optionA || !questionData.optionB || !questionData.optionC || !questionData.optionD || !questionData.correctAnswer || !questionData.explanation) {
        console.error("Invalid question structure in questions array:", questionData)
        throw new Error("Invalid response format from OpenAI - missing required fields in questions array")
      }
    } else if ('text' in parsed && 'optionA' in parsed && 'optionB' in parsed && 'optionC' in parsed && 'optionD' in parsed && 'correctAnswer' in parsed && 'explanation' in parsed) {
      // OpenAI returned a single question object
      questionData = parsed as GeneratedQuestion
    } else {
      console.error("Invalid response structure:", parsed)
      throw new Error("Invalid response format from OpenAI - missing required fields")
    }

    // Validate the response
    if (!questionData.text || !questionData.optionA || !questionData.optionB || !questionData.optionC || !questionData.optionD || !questionData.correctAnswer || !questionData.explanation) {
      console.error("Invalid response structure:", questionData)
      throw new Error("Invalid response format from OpenAI - missing required fields")
    }

    if (!["A", "B", "C", "D"].includes(questionData.correctAnswer)) {
      throw new Error(`Invalid correct answer format: ${questionData.correctAnswer}`)
    }

    // YouTube Shorts specific validation
    // Ensure question is concise (under 100 characters for YouTube Shorts)
    if (questionData.text.length > 100) {
      console.warn(`Question text is too long for Shorts (${questionData.text.length} chars): ${questionData.text}`)
    }

    // Check if explanation is engaging and not too technical
    const explanationWords = questionData.explanation.toLowerCase()
    const technicalTerms = ['therefore', 'hence', 'consequently', 'furthermore', 'moreover', 'whereas', 'nonetheless']
    const hasTechnicalTerms = technicalTerms.some(term => explanationWords.includes(term))

    if (hasTechnicalTerms && questionData.explanation.length > 120) {
      console.warn(`Explanation might be too technical for Shorts: ${questionData.explanation}`)
    }

    return questionData
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

export async function generateQuestionsForTopics(
  className: string,
  difficulty: "EASY" | "MEDIUM" | "HARD",
  topics: Array<{ id: string, name: string, subjectName: string }>,
  questionsPerTopic: number
): Promise<GeneratedQuestion[]> {
  try {
    const topicsPrompt = topics.map(topic => `
      - Subject: "${topic.subjectName}", Topic: "${topic.name}", Topic ID: "${topic.id}"`
    ).join('')

    const prompt = `Create ${questionsPerTopic} engaging multiple-choice questions for EACH of the following topics for ${className} students.
The total number of questions will be ${questionsPerTopic * topics.length}.

Topics: ${topicsPrompt}

The questions should be optimized for YouTube Shorts. It is very important that you provide enough variety of questions to cover all major aspects of each topic. Please do not send variations of the same question.

🎯 YOUTUBE SHORTS OPTIMIZATION:
- Question must be THEORETICAL only (NO calculations, NO math, NO numbers)
- Quick to read and answer (5-8 seconds)
- Engaging and fun - like trivia or interesting facts
- Can include surprising general knowledge
- Keep it conversational and relatable

📝 QUESTION REQUIREMENTS:
- Difficulty: ${difficulty}
- IMPORTANT: CBSE/NEET/JEE syllabus-based but made interesting
- Test CONCEPTUAL understanding, not memorization
- Question text: 60-80 characters max (fits on screen)
- 4 options: Clear, distinct, plausible answers
- Only ONE correct answer
- Brief explanation: 1-2 sentences, engaging and easy to understand

❌ AVOID:
- Any calculations or numerical answers
- Complex scientific terms (explain simply)
- Boring definitions or classifications
- Questions that require deep analysis
- Avoid sending variations of the same question.

You MUST respond with a valid JSON object with a single "questions" key, containing an array of question objects. Each question object must include a "topicId" that corresponds to the topic it belongs to.

Example format:
{
  "questions": [
    {
      "topicId": "physics-topic-1",
      "text": "What makes plants green and helps them make food?",
      "optionA": "Sunlight",
      "optionB": "Chlorophyll",
      "optionC": "Water",
      "optionD": "Soil",
      "correctAnswer": "B",
      "explanation": "Chlorophyll is the green pigment in plants that captures sunlight to make food through photosynthesis!"
    }
  ]
}

Do not include any other text, markdown, or formatting. Just the JSON object.`

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a creative teacher making fun, engaging quiz questions for YouTube Shorts! Create theoretical questions that are quick to read, spark curiosity, and teach something interesting. Focus on conceptual understanding with everyday examples. Always respond with valid JSON only - no extra text!. Do not include numerical problems, and heavy calculations as the content is for YouTube Shorts. There are enough theoretical problems asked in previous exams and books like Concepts of Physics, H.C. Verma, etc. It is very important that if more than one question is asked to be generated in one request, then provide enough variety of questions to cover all major aspects of the topic."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 4096,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error("No response from OpenAI")
    }

    const parsed: { questions: GeneratedQuestion[] } = JSON.parse(content)

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error("Invalid response format from OpenAI - missing 'questions' array.")
    }

    // Validate the response
    for (const question of parsed.questions) {
      if (!question.text || !question.optionA || !question.optionB || !question.optionC || !question.optionD || !question.correctAnswer || !question.explanation || !question.topicId) {
        console.error("Invalid question structure in response:", question)
        throw new Error("Invalid response format from OpenAI - missing required fields in a question")
      }
      if (!topics.find(t => t.id === question.topicId)) {
        console.error("Received question with unknown topicId:", question)
        throw new Error(`Invalid topicId in response: ${question.topicId}`)
      }
    }

    return parsed.questions
  } catch (error) {
    console.error("Error generating questions for multiple topics:", error)
    throw new Error("Failed to generate questions for topics")
  }
}
