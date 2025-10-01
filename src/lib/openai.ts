import OpenAI from "openai"

export const openai = new OpenAI({
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
  topicId?: string // Optional: To associate question with a topic
}

export interface VideoContent {
  title: string
  description: string
  question: GeneratedQuestion
}

export interface SubjectContent {
  subjectName: string
  subjectId: string
  selectedTopic: string
  videoContent: VideoContent
}

export async function generateVideoContentForSubjects(
  className: string,
  subjects: Array<{ name: string, id: string, topics: string[] }>,
  topicsHistory: string[] = []
): Promise<SubjectContent[]> {
  try {
    // Create a comprehensive prompt for generating content for multiple subjects
    const subjectsPrompt = subjects.map((subject, index) => {
      const availableTopics = subject.topics.filter(topic =>
        !topicsHistory.includes(`${subject.name}:${topic}`)
      )

      const selectedTopic = availableTopics.length > 0
        ? availableTopics[Math.floor(Math.random() * availableTopics.length)]
        : subject.topics[Math.floor(Math.random() * subject.topics.length)]

      return `
Subject ${index + 1}: ${subject.name}
Available Topics: ${subject.topics.join(", ")}
Selected Topic: ${selectedTopic}
`
    }).join("\n")

    const prompt = `Create engaging YouTube Shorts quiz content for ${className} students across ${subjects.length} different subjects. Generate ONE question per subject with title and description optimized for YouTube Shorts.

SUBJECTS TO COVER:
${subjectsPrompt}

🎯 REQUIREMENTS FOR EACH VIDEO:
1. VIDEO TITLE: 30-60 characters, engaging and clickable (like "Mind-Blowing Physics Fact! 🤯" or "Chemistry Secret Revealed! ⚗️")
2. VIDEO DESCRIPTION: 200-300 characters, include:
   - Hook question at the start
   - Brief explanation of the topic
   - Call to action for engagement
   - Question text, correct answer, and explanation at the end
   - Relevant hashtags

3. QUIZ QUESTION: Follow all existing question requirements (theoretical, engaging, YouTube Shorts optimized)

📝 OUTPUT FORMAT: Return a JSON array where each object represents one subject:
[
  {
    "subjectName": "Physics",
    "subjectId": "physics-id",
    "selectedTopic": "Motion",
    "videoContent": {
      "title": "Why Do Things Fall? 🤔",
      "description": "Ever wondered why apples fall from trees? Discover the fascinating science behind gravity! Watch this quick quiz to test your knowledge about motion and forces. Perfect for Class 11 Physics students preparing for exams!\\n\\nQuestion: What force pulls objects toward Earth?\\nA) Magnetism\\nB) Gravity\\nC) Friction\\nD) Electricity\\n\\nCorrect Answer: B) Gravity\\n\\nExplanation: Gravity is the force that attracts all objects with mass toward each other, keeping us grounded on Earth!\\n\\n#Physics #Gravity #Motion #ScienceQuiz #Education",
      "question": {
        "text": "What force pulls objects toward Earth?",
        "optionA": "Magnetism",
        "optionB": "Gravity",
        "optionC": "Friction",
        "optionD": "Electricity",
        "correctAnswer": "B",
        "explanation": "Gravity is the force that attracts all objects with mass toward each other, keeping us grounded on Earth!"
      }
    }
  }
]

🎨 CONTENT STYLE:
- Make titles intriguing and curiosity-driven
- Use emojis strategically for visual appeal
- Keep descriptions conversational and engaging
- Ensure questions spark wonder and learning
- Include educational value while being entertaining

You MUST respond with valid JSON only - no extra text!`

    const response = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content: "You are a creative educational content creator specializing in YouTube Shorts. Create engaging, curiosity-driven quiz content that makes learning fun and addictive. Focus on creating titles that make viewers want to click, descriptions that hook them immediately, and questions that spark genuine interest in the subject. Keep the question inspired by NEET/JEE/CBSE/ICSE syllabus. But do not include numerical problems, and heavy calculations as the content is for YouTube Shorts. There are enough theoretical problems asked in previous exams and books like Concepts of Physics, H.C. Verma, etc. It is very important that if more than one question is asked to be generated in one request, then provide enough variety of questions to cover all major aspects of the topic."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 4000, // Increased for multiple subjects
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error("No response from OpenAI")
    }

    // Clean and parse JSON response
    let cleanedContent = content.trim()
    cleanedContent = cleanedContent.replace(/```json\s*/g, '').replace(/```\s*$/g, '')

    const jsonMatch = cleanedContent.match(/\[[\s\S]*\]/)
    if (jsonMatch) {
      cleanedContent = jsonMatch[0]
    }

    let parsed: SubjectContent[]
    try {
      parsed = JSON.parse(cleanedContent) as SubjectContent[]
    } catch (parseError) {
      console.error("JSON parse error:", parseError)
      console.error("Raw content:", content)
      console.error("Cleaned content:", cleanedContent)

      // Try to fix common JSON issues
      try {
        let fixedContent = cleanedContent.replace(/'/g, '"')
        fixedContent = fixedContent.replace(/,(\s*[}\]])/g, '$1')
        parsed = JSON.parse(fixedContent) as SubjectContent[]
        console.log("Successfully parsed after fixing JSON")
      } catch (fixError) {
        console.error("Failed to fix JSON:", fixError)
        throw new Error(`Failed to parse OpenAI response as JSON: ${parseError}`)
      }
    }

    // Validate the response structure
    if (!Array.isArray(parsed)) {
      throw new Error("Invalid response format: expected array")
    }

    for (const subjectContent of parsed) {
      if (!subjectContent.subjectName || !subjectContent.subjectId || !subjectContent.videoContent) {
        throw new Error("Invalid subject content structure")
      }

      const { title, description, question } = subjectContent.videoContent
      if (!title || !description || !question) {
        throw new Error("Invalid video content structure")
      }

      // Validate question structure
      if (!question.text || !question.optionA || !question.optionB || !question.optionC || !question.optionD || !question.correctAnswer || !question.explanation) {
        throw new Error("Invalid question structure")
      }

      if (!["A", "B", "C", "D"].includes(question.correctAnswer)) {
        throw new Error(`Invalid correct answer format: ${question.correctAnswer}`)
      }
    }

    return parsed
  } catch (error) {
    console.error("Error generating video content for subjects:", error)
    throw new Error("Failed to generate video content")
  }
}
