export interface SubjectContent {
  description: string
  educationalValue: string
  hashtags: string[]
  studyTips: string
  commonApplications: string
}

export const subjectContent: Record<string, SubjectContent> = {
  Physics: {
    description: "Explore the fundamental laws that govern our universe, from quantum mechanics to classical physics. Master concepts like motion, energy, forces, and electromagnetism that shape our understanding of the physical world.",
    educationalValue: "Develop critical thinking and problem-solving skills essential for engineering, research, and technology careers. Physics principles form the foundation for innovations in space exploration, renewable energy, and modern electronics.",
    hashtags: ["#Physics", "#QuantumMechanics", "#ClassicalPhysics", "#STEM", "#ScienceEducation", "#PhysicsLaws"],
    studyTips: "Practice problem-solving daily, visualize concepts with diagrams, and connect theoretical principles to real-world applications. Regular practice with numerical problems builds intuition.",
    commonApplications: "Used in engineering design, medical imaging, renewable energy systems, aerospace technology, and consumer electronics development."
  },
  Chemistry: {
    description: "Discover the building blocks of matter and the chemical reactions that power life itself. Learn about atoms, molecules, chemical bonds, and the periodic table that reveals nature's elemental secrets.",
    educationalValue: "Essential for medicine, pharmacy, environmental science, and materials engineering. Chemistry knowledge enables drug development, environmental protection, and creation of new materials.",
    hashtags: ["#Chemistry", "#PeriodicTable", "#ChemicalReactions", "#OrganicChemistry", "#InorganicChemistry", "#ChemistryLab"],
    studyTips: "Balance equations regularly, memorize key reaction types, and practice with molecular structures. Understanding electron configurations helps predict chemical behavior.",
    commonApplications: "Pharmaceutical development, environmental monitoring, materials science, food industry, and chemical manufacturing processes."
  },
  Mathematics: {
    description: "Master the language of patterns, logic, and quantitative reasoning. From basic arithmetic to advanced calculus, mathematics provides tools to model, analyze, and solve complex problems across all disciplines.",
    educationalValue: "Develops logical thinking, pattern recognition, and analytical skills crucial for data science, engineering, economics, and research. Mathematical thinking is fundamental to understanding our data-driven world.",
    hashtags: ["#Mathematics", "#Calculus", "#Algebra", "#Geometry", "#MathEducation", "#ProblemSolving"],
    studyTips: "Practice daily with varied problem types, understand concepts before memorizing formulas, and teach others to reinforce your understanding. Regular application builds confidence.",
    commonApplications: "Financial modeling, data analysis, cryptography, computer graphics, artificial intelligence, and engineering calculations."
  },
  Biology: {
    description: "Uncover the mysteries of life from cellular processes to ecosystem dynamics. Study genetics, evolution, physiology, and ecology to understand how living organisms function and interact.",
    educationalValue: "Critical for medicine, biotechnology, environmental conservation, and agricultural advancement. Biological knowledge drives medical breakthroughs and sustainable development solutions.",
    hashtags: ["#Biology", "#Genetics", "#Evolution", "#Ecology", "#CellBiology", "#LifeSciences"],
    studyTips: "Draw and label diagrams regularly, connect microscopic processes to macroscopic phenomena, and study real-world case studies. Understanding interconnected systems is key.",
    commonApplications: "Medical research, pharmaceutical development, environmental conservation, agriculture, biotechnology, and forensic science."
  },
  ComputerScience: {
    description: "Navigate the digital world through programming, algorithms, and computational thinking. Learn to create software, analyze data, and solve problems using computational approaches and logical reasoning.",
    educationalValue: "Essential for software development, data science, cybersecurity, and artificial intelligence. Computing skills are increasingly valuable across all industries in our technology-driven economy.",
    hashtags: ["#ComputerScience", "#Programming", "#Algorithms", "#DataStructures", "#SoftwareDevelopment", "#Coding"],
    studyTips: "Code daily, even small programs, and debug systematically. Practice algorithm design and understand time/space complexity. Build projects to apply theoretical knowledge.",
    commonApplications: "Software development, web applications, mobile apps, data analysis, artificial intelligence, cybersecurity, and automation systems."
  },
  English: {
    description: "Master the art of communication through literature, grammar, and creative expression. Develop reading comprehension, writing skills, and critical analysis of texts from various genres and historical periods.",
    educationalValue: "Enhances communication skills, critical thinking, and cultural awareness essential for all professional fields. Strong language skills improve career prospects and personal development.",
    hashtags: ["#EnglishLiterature", "#Grammar", "#WritingSkills", "#ReadingComprehension", "#LanguageArts", "#CreativeWriting"],
    studyTips: "Read diverse texts daily, practice writing regularly, and analyze literary devices. Vocabulary building through context and etymology strengthens understanding.",
    commonApplications: "Professional communication, content creation, journalism, marketing, technical writing, and creative industries."
  },
  History: {
    description: "Journey through time to understand how past events shape our present world. Study civilizations, wars, revolutions, and cultural movements that define human experience and societal development.",
    educationalValue: "Provides context for current events, develops critical thinking about cause and effect, and fosters cultural awareness. Historical perspective is crucial for informed citizenship and decision-making.",
    hashtags: ["#History", "#WorldHistory", "#AncientCivilizations", "#ModernHistory", "#HistoricalEvents", "#SocialStudies"],
    studyTips: "Create timelines for events, understand cause-effect relationships, and analyze primary sources critically. Connect historical patterns to contemporary issues.",
    commonApplications: "Policy analysis, journalism, museum curation, historical research, education, and cultural heritage preservation."
  },
  Geography: {
    description: "Explore Earth's diverse landscapes, climates, and human-environment interactions. Study physical geography, human geography, and the spatial relationships that shape our world and its inhabitants.",
    educationalValue: "Essential for environmental management, urban planning, international relations, and sustainable development. Geographic literacy helps understand global interconnectedness and local impacts.",
    hashtags: ["#Geography", "#PhysicalGeography", "#HumanGeography", "#WorldRegions", "#EnvironmentalGeography", "#Maps"],
    studyTips: "Use maps extensively, understand spatial relationships, and analyze human-environment interactions. Field observations and case studies enhance understanding.",
    commonApplications: "Urban planning, environmental management, international business, disaster management, tourism, and resource allocation."
  }
}

export function getSubjectContent(subjectName: string): SubjectContent {
  // Normalize subject name for case-insensitive lookup
  const normalizedName = subjectName.toLowerCase().trim()

  // Find exact match first
  const exactMatch = Object.keys(subjectContent).find(
    key => key.toLowerCase() === normalizedName
  )

  if (exactMatch) {
    return subjectContent[exactMatch]
  }

  // Find partial match for common variations
  const partialMatch = Object.keys(subjectContent).find(
    key => normalizedName.includes(key.toLowerCase()) || key.toLowerCase().includes(normalizedName)
  )

  if (partialMatch) {
    return subjectContent[partialMatch]
  }

  // Default content for unknown subjects
  return {
    description: "Explore this fascinating subject through engaging quiz questions designed to test and enhance your knowledge.",
    educationalValue: "Build strong foundational knowledge and critical thinking skills essential for academic success and lifelong learning.",
    hashtags: ["#Education", "#Learning", "#Quiz", "#Study"],
    studyTips: "Practice regularly, stay curious, and connect new concepts to what you already know. Consistent effort leads to mastery.",
    commonApplications: "Applicable across various academic disciplines and professional fields requiring analytical thinking."
  }
}

export function generateVideoDescription(
  count: number,
  topic: string,
  classSubject: string,
  subjectName?: string
): string {
  const subjectContent = subjectName ? getSubjectContent(subjectName) : getSubjectContent(classSubject)
  const questionText = count === 1 ? 'question' : 'questions'

  // Create an engaging description combining quiz info with subject-specific content
  return `Test your knowledge with ${count} ${questionText} on ${topic} from ${classSubject}. ${subjectContent.description.slice(0, 100)}... Perfect for exam preparation and building strong foundational understanding!`
}

export function generateDetailedVideoDescription(
  count: number,
  topic: string,
  classSubject: string,
  subjectName?: string,
  includeEducationalValue: boolean = false,
  includeHashtags: boolean = false,
  includeStudyTips: boolean = false
): string {
  const subjectContent = subjectName ? getSubjectContent(subjectName) : getSubjectContent(classSubject)
  const questionText = count === 1 ? 'question' : 'questions'

  let description = `Test your knowledge with ${count} ${questionText} on ${topic} from ${classSubject}. `

  if (includeEducationalValue) {
    description += `${subjectContent.educationalValue} `
  }

  if (includeStudyTips) {
    description += `Study tip: ${subjectContent.studyTips} `
  }

  if (includeHashtags) {
    description += `\n\n${subjectContent.hashtags.join(' ')}`
  }

  description += `\nPerfect for exam preparation!`

  return description
}
