import { openai, GeneratedQuestion } from "./openai"

type OpenAIResponse = GeneratedQuestion | {
  questions: GeneratedQuestion[]
}

export type QuestionMode = "BASIC" | "ADVANCED"

/**
 * Get the appropriate prompt based on question mode
 */
function getPromptTemplate(
  mode: QuestionMode,
  difficulty: "EASY" | "MEDIUM" | "HARD"
): {
  optimization: string
  requirements: string
  style: string
  avoid: string
  systemPrompt: string
} {
  if (mode === "BASIC") {
    // YouTube Shorts optimized - Fun, engaging, viral content
    return {
      optimization: `🎯 YOUTUBE SHORTS OPTIMIZATION:
- Question must be THEORETICAL only (NO calculations, NO math, NO numbers)
- Quick to read and answer (5-8 seconds)
- Engaging and fun - like trivia or interesting facts
- Can include surprising general knowledge
- Keep it conversational and relatable`,
      requirements: `📝 QUESTION REQUIREMENTS:
- Difficulty: ${difficulty}
- IMPORTANT: CBSE/NEET/JEE syllabus-based but made interesting
- Test CONCEPTUAL understanding, not memorization
- Question text: 60-80 characters max (fits on screen)
- 4 options: Clear, distinct, plausible answers
- Only ONE correct answer
- Brief explanation: 1-2 sentences, engaging and easy to understand`,
      style: `🎨 MAKE IT ENGAGING:
- Use everyday examples when possible
- Add interesting twists or fun facts
- Avoid dry, textbook-style questions
- Make viewers think "Oh, I know this!" or "That's cool!"`,
      avoid: `❌ AVOID:
- Any calculations or numerical answers
- Complex scientific terms (explain simply)
- Boring definitions or classifications
- Questions that require deep analysis
- Avoid sending variations of the same question`,
      systemPrompt: "You are a creative teacher making fun, engaging quiz questions for YouTube Shorts! Create theoretical questions that are quick to read, spark curiosity, and teach something interesting. Focus on conceptual understanding with everyday examples. Always respond with valid JSON only - no extra text!"
    }
  } else {
    // ADVANCED mode - NEET/JEE exam preparation focused
    return {
      optimization: `🎯 NEET/JEE EXAM PREPARATION:
- Question must be THEORETICAL only (NO numerical calculations, NO math problems)
- Conceptually challenging and thought-provoking
- Test deep understanding of concepts
- Similar to NEET/JEE previous year questions but theoretical
- Can involve multi-step reasoning without calculations
- Should require application of concepts, not just recall`,
      requirements: `📝 QUESTION REQUIREMENTS:
- Difficulty: ${difficulty}
- IMPORTANT: Strictly follow NEET/JEE syllabus and question patterns
- Test CONCEPTUAL depth and application ability
- Question text: Clear and precise, can be longer for complexity
- 4 options: Challenging distractors that test common misconceptions
- Only ONE correct answer
- Detailed explanation: 2-4 sentences explaining the concept thoroughly with reasoning`,
      style: `🎨 EXAM-FOCUSED APPROACH:
- Use standard academic terminology accurately
- Focus on concept application and analysis
- Include questions on mechanisms, reasons, and principles
- Test ability to distinguish between similar concepts
- Challenge students to think critically`,
      avoid: `❌ AVOID:
- Numerical calculations and mathematical problems
- Formula-based questions requiring computation
- Trivial or superficial questions
- Questions that test only definitions or memorization
- Overly simple or obvious questions`,
      systemPrompt: "You are an expert NEET/JEE educator creating challenging conceptual questions for competitive exam preparation. Focus on testing deep understanding, concept application, and critical thinking. Questions should be theoretical but challenging, similar to NEET/JEE papers. Avoid numerical problems but include conceptually rigorous questions that test mechanisms, principles, and reasoning. Always respond with valid JSON only - no extra text!"
    }
  }
}

/**
 * Generate a single question for a specific topic
 * 
 * @deprecated Consider using generateQuestionsForSingleTopic for better efficiency
 * This function is kept for backward compatibility and edge cases
 * 
 * @param className - The class name (e.g., "Class 11", "Class 12")
 * @param subjectName - The subject name (e.g., "Physics", "Chemistry")
 * @param topicName - The topic name (e.g., "Gravity", "Photosynthesis")
 * @param difficulty - Question difficulty level
 * @param mode - Question mode: BASIC (YouTube Shorts) or ADVANCED (NEET/JEE prep)
 * @returns A single generated question
 */
export async function generateQuestion(
  className: string,
  subjectName: string,
  topicName: string,
  difficulty: "EASY" | "MEDIUM" | "HARD" = "MEDIUM",
  mode: QuestionMode = "BASIC"
): Promise<GeneratedQuestion> {
  try {
    const promptTemplate = getPromptTemplate(mode, difficulty)
    const modeDescription = mode === "BASIC" 
      ? "optimized for YouTube Shorts" 
      : "for NEET/JEE competitive exam preparation"

    const prompt = `Create an engaging multiple-choice question for ${className} ${subjectName} students about "${topicName}" - ${modeDescription}! It is very important that if more than one question is asked to be generated in one request, then provide enough variety of questions to cover all major aspects of the topic. Please do not send variations of the same question.

${promptTemplate.optimization}

${promptTemplate.requirements}

${promptTemplate.style}

${promptTemplate.avoid}

✅ EXAMPLES OF GOOD QUESTIONS (${mode} MODE):
${mode === "BASIC" ? `
- "What makes leaves green?" (not "Calculate chlorophyll absorption")
- "Why do we see rainbows?" (not "Solve for prism refraction angle")
- "Which planet has rings?" (not "Calculate orbital mechanics")` : `
- "Why does increasing temperature generally increase the rate of a reaction, even though some reactions are exothermic?"
- "What principle explains why a person in a freely falling elevator feels weightless?"
- "How does Le Chatelier's principle apply when pressure is increased in a gaseous equilibrium?"
`}

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
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: promptTemplate.systemPrompt
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: mode === "BASIC" ? 0.7 : 0.6, // Slightly lower temperature for advanced mode
      max_tokens: mode === "BASIC" ? 1000 : 1500, // More tokens for detailed explanations
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
    const jsonObjectRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g
    const jsonMatches = cleanedContent.match(jsonObjectRegex)
    
    if (jsonMatches && jsonMatches.length > 0) {
      cleanedContent = jsonMatches[0]
      
      if (jsonMatches.length > 1) {
        console.warn(`OpenAI returned ${jsonMatches.length} JSON objects, using the first one`)
      }
    } else {
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
        let fixedContent = cleanedContent.replace(/'/g, '"')
        fixedContent = fixedContent.replace(/,(\s*[}\]])/g, '$1')
        fixedContent = fixedContent.replace(/"\s*"\s*([A-Za-z_])/g, '", "$1')
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
      console.log(`OpenAI returned ${parsed.questions.length} questions, using the first one`)
      questionData = parsed.questions[0]

      if (!questionData.text || !questionData.optionA || !questionData.optionB || !questionData.optionC || !questionData.optionD || !questionData.correctAnswer || !questionData.explanation) {
        console.error("Invalid question structure in questions array:", questionData)
        throw new Error("Invalid response format from OpenAI - missing required fields in questions array")
      }
    } else if ('text' in parsed && 'optionA' in parsed && 'optionB' in parsed && 'optionC' in parsed && 'optionD' in parsed && 'correctAnswer' in parsed && 'explanation' in parsed) {
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

    // Mode-specific validation
    if (mode === "BASIC") {
      // YouTube Shorts specific validation
      if (questionData.text.length > 100) {
        console.warn(`Question text is too long for Shorts (${questionData.text.length} chars): ${questionData.text}`)
      }

      const explanationWords = questionData.explanation.toLowerCase()
      const technicalTerms = ['therefore', 'hence', 'consequently', 'furthermore', 'moreover', 'whereas', 'nonetheless']
      const hasTechnicalTerms = technicalTerms.some(term => explanationWords.includes(term))

      if (hasTechnicalTerms && questionData.explanation.length > 120) {
        console.warn(`Explanation might be too technical for Shorts: ${questionData.explanation}`)
      }
    }

    return questionData
  } catch (error) {
    console.error("Error generating question:", error)
    throw new Error("Failed to generate question")
  }
}

/**
 * Generate multiple questions about a SINGLE topic using batch API call
 * This is more efficient than calling generateQuestion() multiple times
 * 
 * USE THIS WHEN: You want multiple questions all about the same topic
 * EXAMPLE: Generate 5 questions about "Photosynthesis" in Biology
 * 
 * @param className - The class name (e.g., "Class 11", "Class 12")
 * @param subjectName - The subject name (e.g., "Physics", "Chemistry")
 * @param topicName - The topic name (e.g., "Gravity", "Photosynthesis")
 * @param count - Number of questions to generate
 * @param difficulty - Question difficulty level
 * @param mode - Question mode: BASIC (YouTube Shorts) or ADVANCED (NEET/JEE prep)
 * @returns Array of generated questions, all about the same topic
 */
export async function generateQuestionsForSingleTopic(
  className: string,
  subjectName: string,
  topicName: string,
  count: number = 5,
  difficulty: "EASY" | "MEDIUM" | "HARD" = "MEDIUM",
  mode: QuestionMode = "BASIC"
): Promise<GeneratedQuestion[]> {
  try {
    const promptTemplate = getPromptTemplate(mode, difficulty)
    const modeDescription = mode === "BASIC" 
      ? "optimized for YouTube Shorts" 
      : "for NEET/JEE competitive exam preparation"

    const prompt = `Create ${count} engaging multiple-choice questions for ${className} ${subjectName} students about "${topicName}" - ${modeDescription}!

IMPORTANT: Generate ${count} DIFFERENT questions that cover various aspects of "${topicName}". Each question should explore a different concept, fact, or angle related to this topic. DO NOT create variations of the same question!

${promptTemplate.optimization}

${promptTemplate.requirements}

${promptTemplate.style}

${promptTemplate.avoid}

✅ VARIETY EXAMPLE FOR "${topicName}" (${mode} MODE):
${mode === "BASIC" ? `
For "Photosynthesis" topic:
- Question 1: "What gas do plants breathe in during photosynthesis?"
- Question 2: "Which part of the plant cell captures sunlight?"
- Question 3: "What color light do plants reflect, making them appear green?"
- Question 4: "What is the main product that plants make during photosynthesis?"
- Question 5: "Why do plants perform photosynthesis only during the day?"` : `
For "Photosynthesis" topic:
- Question 1: "Why are C4 plants more efficient in hot climates compared to C3 plants?"
- Question 2: "What is the primary function of the light-independent reactions in photosynthesis?"
- Question 3: "How does photorespiration affect plant productivity?"
- Question 4: "What role does the electron transport chain play in generating ATP during photosynthesis?"
- Question 5: "Why is cyclic photophosphorylation important for plant cells?"
`}

You MUST respond with valid JSON in this exact format:
{
  "questions": [
    {
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

Do not include any other text, markdown, or formatting. Just the JSON object with the questions array.`

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: promptTemplate.systemPrompt
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: mode === "BASIC" ? 0.7 : 0.6,
      max_tokens: mode === "BASIC" ? 3000 : 4096,
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error("No response from OpenAI")
    }

    const parsed: { questions: GeneratedQuestion[] } = JSON.parse(content)

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      throw new Error("Invalid response format from OpenAI - missing 'questions' array")
    }

    // Validate each question
    for (const question of parsed.questions) {
      if (!question.text || !question.optionA || !question.optionB || !question.optionC || !question.optionD || !question.correctAnswer || !question.explanation) {
        console.error("Invalid question structure:", question)
        throw new Error("Invalid response format from OpenAI - missing required fields in a question")
      }

      if (!["A", "B", "C", "D"].includes(question.correctAnswer)) {
        throw new Error(`Invalid correct answer format: ${question.correctAnswer}`)
      }
    }

    console.log(`Successfully generated ${parsed.questions.length} questions (${mode} mode) for topic: ${topicName}`)
    return parsed.questions
  } catch (error) {
    console.error("Error generating questions for single topic:", error)
    throw new Error("Failed to generate questions")
  }
}

/**
 * Generate questions across MULTIPLE topics (one or more questions per topic)
 * This efficiently generates questions for different topics in a single API call
 * 
 * USE THIS WHEN: You want questions across different topics/subjects
 * EXAMPLE: Generate 1 question each for Physics, Chemistry, Biology topics
 * 
 * @param className - The class name (e.g., "Class 11", "Class 12")
 * @param difficulty - Question difficulty level
 * @param topics - Array of topics with their details
 * @param questionsPerTopic - Number of questions to generate per topic
 * @param mode - Question mode: BASIC (YouTube Shorts) or ADVANCED (NEET/JEE prep)
 * @returns Array of generated questions with topicId association
 */
export async function generateQuestionsForMultipleTopics(
  className: string,
  difficulty: "EASY" | "MEDIUM" | "HARD",
  topics: Array<{ id: string, name: string, subjectName: string }>,
  questionsPerTopic: number,
  mode: QuestionMode = "BASIC"
): Promise<GeneratedQuestion[]> {
  try {
    const promptTemplate = getPromptTemplate(mode, difficulty)
    const modeDescription = mode === "BASIC" 
      ? "optimized for YouTube Shorts" 
      : "for NEET/JEE competitive exam preparation"

    const topicsPrompt = topics.map(topic => `
      - Subject: "${topic.subjectName}", Topic: "${topic.name}", Topic ID: "${topic.id}"`
    ).join('')

    const prompt = `Create ${questionsPerTopic} engaging multiple-choice questions for EACH of the following topics for ${className} students - ${modeDescription}.
The total number of questions will be ${questionsPerTopic * topics.length}.

Topics: ${topicsPrompt}

It is very important that you provide enough variety of questions to cover all major aspects of each topic. Please do not send variations of the same question.

${promptTemplate.optimization}

${promptTemplate.requirements}

${promptTemplate.style}

${promptTemplate.avoid}

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
          content: promptTemplate.systemPrompt
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: mode === "BASIC" ? 0.7 : 0.6,
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

    console.log(`Successfully generated ${parsed.questions.length} questions (${mode} mode) across ${topics.length} topics`)
    return parsed.questions
  } catch (error) {
    console.error("Error generating questions for multiple topics:", error)
    throw new Error("Failed to generate questions for topics")
  }
}

/**
 * @deprecated Use generateQuestionsForSingleTopic instead for better efficiency
 * 
 * Legacy function that generates questions sequentially with delays
 * This is kept for backward compatibility but is not recommended for new code
 */
export async function generateQuestions(
  className: string,
  subjectName: string,
  topicName: string,
  count: number = 5,
  difficulty: "EASY" | "MEDIUM" | "HARD" = "MEDIUM",
  mode: QuestionMode = "BASIC"
): Promise<GeneratedQuestion[]> {
  console.warn('generateQuestions() is deprecated. Use generateQuestionsForSingleTopic() for better performance.')
  
  const questions: GeneratedQuestion[] = []

  for (let i = 0; i < count; i++) {
    try {
      const question = await generateQuestion(className, subjectName, topicName, difficulty, mode)
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
