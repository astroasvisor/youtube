# Question Modes: Basic vs Advanced

## Overview

The question generation system now supports two distinct modes to cater to different use cases:

1. **BASIC Mode** - YouTube Shorts optimized content (fun, engaging, viral)
2. **ADVANCED Mode** - NEET/JEE competitive exam preparation (conceptually challenging)

---

## Mode Comparison

### BASIC Mode (YouTube Shorts)

**Purpose:** Create engaging, shareable content for social media platforms

**Characteristics:**
- ✅ Fun and engaging questions
- ✅ Quick to read and answer (5-8 seconds)
- ✅ Uses everyday examples
- ✅ Conversational and relatable tone
- ✅ Interesting facts and trivia
- ✅ Makes viewers think "Oh, I know this!" or "That's cool!"
- ✅ 60-80 characters max for question text
- ✅ Brief explanations (1-2 sentences)

**Example Questions:**
```
Topic: Photosynthesis

BASIC Question:
"What makes leaves green?"
A) Sunlight
B) Chlorophyll
C) Water
D) Soil
Correct: B

Explanation: "Chlorophyll is the green pigment in plants that captures sunlight to make food through photosynthesis!"
```

**Best For:**
- YouTube Shorts videos
- Instagram Reels
- TikTok educational content
- Engaging students with fun facts
- Building curiosity and interest

---

### ADVANCED Mode (NEET/JEE Preparation)

**Purpose:** Prepare students for competitive exams with conceptually challenging questions

**Characteristics:**
- ✅ Conceptually challenging and thought-provoking
- ✅ Tests deep understanding of concepts
- ✅ Similar to NEET/JEE previous year questions (but theoretical)
- ✅ Multi-step reasoning without calculations
- ✅ Requires application of concepts
- ✅ Uses standard academic terminology
- ✅ Challenging distractors that test misconceptions
- ✅ Detailed explanations (2-4 sentences with reasoning)

**Example Questions:**
```
Topic: Photosynthesis

ADVANCED Question:
"Why are C4 plants more efficient in hot climates compared to C3 plants?"
A) They have more chlorophyll
B) They minimize photorespiration
C) They perform only cyclic photophosphorylation
D) They don't require water

Correct: B

Explanation: "C4 plants have a specialized mechanism to concentrate CO2 around RuBisCO, which minimizes photorespiration that typically increases at high temperatures. This gives C4 plants an advantage in hot, dry climates where photorespiration would otherwise reduce photosynthetic efficiency in C3 plants."
```

**Best For:**
- NEET preparation
- JEE preparation
- Competitive exam practice
- Testing conceptual depth
- Advanced academic learning

---

## Technical Implementation

### API Parameters

Both generation endpoints now accept a `mode` parameter:

```typescript
// Single Topic Generation
POST /api/generate-questions
{
  "classId": "string",
  "subjectId": "string",
  "topicId": "string",
  "count": 5,
  "difficulty": "MEDIUM",
  "mode": "BASIC" | "ADVANCED"  // New parameter
}

// Multi-Topic Generation
POST /api/generate-questions-multi
{
  "classId": "string",
  "difficulty": "MEDIUM",
  "mode": "BASIC" | "ADVANCED",  // New parameter
  "subjectsPerRun": 4,
  "previewMode": false
}
```

### Function Signatures

```typescript
// src/lib/question-generation.ts

export type QuestionMode = "BASIC" | "ADVANCED"

// Generate questions for a single topic
export async function generateQuestionsForSingleTopic(
  className: string,
  subjectName: string,
  topicName: string,
  count: number = 5,
  difficulty: "EASY" | "MEDIUM" | "HARD" = "MEDIUM",
  mode: QuestionMode = "BASIC"  // New parameter
): Promise<GeneratedQuestion[]>

// Generate questions across multiple topics
export async function generateQuestionsForMultipleTopics(
  className: string,
  difficulty: "EASY" | "MEDIUM" | "HARD",
  topics: Array<{ id: string, name: string, subjectName: string }>,
  questionsPerTopic: number,
  mode: QuestionMode = "BASIC"  // New parameter
): Promise<GeneratedQuestion[]>
```

---

## UI/UX

### Mode Toggle

Both question generation forms now include a toggle button:

```
┌─────────────────────────────────────────┐
│ Question Mode                           │
├─────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐            │
│  │  Basic   │  │ Advanced │            │
│  │ Fun &    │  │ NEET/JEE │            │
│  │ Engaging │  │   Prep   │            │
│  └──────────┘  └──────────┘            │
│                                         │
│  YouTube Shorts optimized - Fun,        │
│  engaging questions with interesting    │
│  facts                                  │
└─────────────────────────────────────────┘
```

### Visual Indicators

- **Active mode**: Indigo background with white text
- **Inactive mode**: White background with gray text
- **Description**: Changes based on selected mode
- **Smooth transitions**: All state changes are animated

---

## Prompt Engineering

### BASIC Mode Prompt Strategy

**Focus:**
- Curiosity-driven content
- Viral potential
- Entertainment value
- Easy to understand

**System Prompt:**
> "You are a creative teacher making fun, engaging quiz questions for YouTube Shorts! Create theoretical questions that are quick to read, spark curiosity, and teach something interesting. Focus on conceptual understanding with everyday examples."

**Key Instructions:**
- Make it conversational
- Use everyday examples
- Add interesting twists
- Avoid dry, textbook style

---

### ADVANCED Mode Prompt Strategy

**Focus:**
- Conceptual depth
- Exam patterns
- Critical thinking
- Academic rigor

**System Prompt:**
> "You are an expert NEET/JEE educator creating challenging conceptual questions for competitive exam preparation. Focus on testing deep understanding, concept application, and critical thinking. Questions should be theoretical but challenging, similar to NEET/JEE papers."

**Key Instructions:**
- Use standard academic terminology
- Test mechanisms and principles
- Challenge common misconceptions
- Require multi-step reasoning

---

## OpenAI Configuration

### Model Parameters by Mode

**BASIC Mode:**
```typescript
{
  model: "gpt-4o-mini",
  temperature: 0.7,        // Higher for creativity
  max_tokens: 3000,
  response_format: { type: "json_object" }
}
```

**ADVANCED Mode:**
```typescript
{
  model: "gpt-4o-mini",
  temperature: 0.6,        // Slightly lower for precision
  max_tokens: 4096,        // More for detailed explanations
  response_format: { type: "json_object" }
}
```

---

## Usage Examples

### Frontend (React)

```tsx
// Single Topic Form
const [generateForm, setGenerateForm] = useState({
  classId: "",
  subjectId: "",
  topicId: "",
  count: 5,
  difficulty: "MEDIUM",
  mode: "BASIC" as "BASIC" | "ADVANCED"
})

// Toggle mode
<button
  onClick={() => setGenerateForm({ 
    ...generateForm, 
    mode: "BASIC" 
  })}
>
  Basic Mode
</button>
```

### Backend (API)

```typescript
// Extract mode from request
const { 
  classId, 
  subjectId, 
  topicId, 
  count = 5, 
  difficulty = "MEDIUM", 
  mode = "BASIC" 
} = await request.json()

// Pass to generation function
const questions = await generateQuestionsForSingleTopic(
  className,
  subjectName,
  topicName,
  count,
  difficulty,
  mode  // Pass the mode
)
```

---

## Benefits

### For Content Creators (BASIC Mode)
- ✅ Questions optimized for social media engagement
- ✅ Higher click-through rates
- ✅ Better viewer retention
- ✅ More shareable content
- ✅ Builds curiosity and interest

### For Students (ADVANCED Mode)
- ✅ Exam-focused preparation
- ✅ Tests conceptual understanding
- ✅ Identifies knowledge gaps
- ✅ Builds problem-solving skills
- ✅ Aligns with NEET/JEE patterns

### For Educators
- ✅ Flexibility to choose appropriate content type
- ✅ Same interface for both modes
- ✅ Clear differentiation between content types
- ✅ Better content organization
- ✅ Serves different learning objectives

---

## Question Quality Guidelines

### What Makes a Good BASIC Question?

✅ **DO:**
- Use simple, relatable language
- Make it surprising or interesting
- Keep it short and snappy
- Add a fun fact to the explanation
- Use everyday examples

❌ **DON'T:**
- Use complex terminology
- Make it too long
- Require deep analysis
- Include calculations
- Be boring or dry

### What Makes a Good ADVANCED Question?

✅ **DO:**
- Test conceptual depth
- Require reasoning
- Use proper academic terms
- Challenge misconceptions
- Explain thoroughly

❌ **DON'T:**
- Include numerical calculations
- Be trivial or obvious
- Test only definitions
- Use informal language
- Oversimplify concepts

---

## Migration Guide

### For Existing Code

All existing code will continue to work with default BASIC mode:

```typescript
// Old code (still works)
const questions = await generateQuestionsForSingleTopic(
  "Class 11",
  "Physics",
  "Gravity",
  5,
  "MEDIUM"
)
// Defaults to BASIC mode

// New code (explicit mode)
const questions = await generateQuestionsForSingleTopic(
  "Class 11",
  "Physics",
  "Gravity",
  5,
  "MEDIUM",
  "ADVANCED"  // Now explicitly ADVANCED
)
```

### Backward Compatibility

- ✅ Default mode is `BASIC` (matches previous behavior)
- ✅ No breaking changes to API
- ✅ All existing endpoints work as before
- ✅ Optional parameter can be omitted

---

## Testing Recommendations

### BASIC Mode Testing
1. Verify questions are short (<80 characters)
2. Check for conversational tone
3. Ensure explanations are brief (1-2 sentences)
4. Validate engagement factor
5. Test across different difficulty levels

### ADVANCED Mode Testing
1. Verify conceptual depth
2. Check for proper terminology
3. Ensure detailed explanations
4. Validate challenging distractors
5. Test alignment with NEET/JEE patterns

### Cross-Mode Testing
1. Generate same topic in both modes
2. Compare question complexity
3. Verify distinct characteristics
4. Check explanation length differences
5. Ensure mode parameter is respected

---

## Future Enhancements

### Potential Additions
- 📊 Analytics per mode (engagement metrics)
- 🎯 Hybrid mode (balanced approach)
- 📚 Subject-specific mode variations
- 🔄 Mode-based difficulty auto-adjustment
- 📈 Performance tracking by mode

### Advanced Features
- AI-powered mode recommendation
- Adaptive difficulty based on mode
- Custom prompt templates per mode
- Mode-specific question banks
- Automated quality scoring per mode

---

## Summary

The two-mode system provides flexibility to serve different audiences:

- **BASIC Mode**: Perfect for viral educational content and YouTube Shorts
- **ADVANCED Mode**: Ideal for serious exam preparation and conceptual learning

Both modes maintain the same interface and workflow, making it easy to switch between content types based on your needs.

**Default Behavior:** All questions default to BASIC mode unless explicitly specified, ensuring backward compatibility and seamless integration.

