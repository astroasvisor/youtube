export interface Theme {
  name: string
  backgroundGradient: string
  primaryColor: string
  secondaryColor: string
  characterImage: string
  accentColor: string
}

export const themes: Record<string, Theme> = {
  default: {
    name: "Default",
    backgroundGradient: "linear-gradient(135deg, #1e40af 0%, #059669 100%)",
    primaryColor: "#1e40af",
    secondaryColor: "#059669",
    characterImage: "images/thinking.png",
    accentColor: "#3b82f6"
  },
  biology: {
    name: "Biology",
    backgroundGradient: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
    primaryColor: "#059669",
    secondaryColor: "#10b981",
    characterImage: "images/girl.png",
    accentColor: "#34d399"
  },
  chemistry: {
    name: "Chemistry",
    backgroundGradient: "linear-gradient(135deg, #1e40af 0%,rgb(140, 59, 246) 100%)",
    primaryColor: "#1e40af",
    secondaryColor: "#3b82f6",
    characterImage: "images/thinking.png",
    accentColor: "#60a5fa"
  },
  physics: {
    name: "Physics",
    backgroundGradient: "linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)",
    primaryColor: "#4c1d95",
    secondaryColor: "#7c3aed",
    characterImage: "images/thinking.png",
    accentColor: "#8b5cf6"
  },
  mathematics: {
    name: "Mathematics",
    backgroundGradient: "linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)",
    primaryColor: "#1e40af",
    secondaryColor: "#3b82f6",
    characterImage: "images/thinking.png",
    accentColor: "#60a5fa"
  }
}

export function getThemeForSubject(subjectName: string): Theme {
  const normalizedSubject = subjectName.toLowerCase().trim()

  // Map subject names to theme keys
  if (normalizedSubject.includes('biology') || normalizedSubject.includes('bio')) {
    return themes.biology
  } else if (normalizedSubject.includes('chemistry') || normalizedSubject.includes('chem')) {
    return themes.chemistry
  } else if (normalizedSubject.includes('physics') || normalizedSubject.includes('phy')) {
    return themes.physics
  } else if (normalizedSubject.includes('mathematics') || normalizedSubject.includes('math')) {
    return themes.mathematics
  } else {
    return themes.default
  }
}
