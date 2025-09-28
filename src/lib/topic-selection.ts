import { prisma } from "./prisma"

export interface TopicUsageStats {
  topicId: string
  topicName: string
  subjectId: string
  subjectName: string
  classId: string
  className: string
  usageCount: number
  lastUsedAt: Date | null
}

export interface SubjectTopics {
  subjectId: string
  subjectName: string
  topics: Array<{
    id: string
    name: string
    usageCount: number
    lastUsedAt: Date | null
  }>
}

/**
 * Get topic usage statistics for a specific class
 */
export async function getTopicUsageStats(classId: string): Promise<TopicUsageStats[]> {
  try {
    const topicsWithUsage = await prisma.topic.findMany({
      where: {
        subject: {
          classId: classId,
        },
      },
      include: {
        subject: {
          include: {
            class: true,
          },
        },
        _count: {
          select: {
            videos: true,
          },
        },
      },
    })

    const stats: TopicUsageStats[] = []

    for (const topic of topicsWithUsage) {
      // Get the most recent usage for this topic
      const recentUsage = await prisma.topicUsage.findFirst({
        where: {
          classId: classId,
          subjectId: topic.subjectId,
          topicId: topic.id,
        },
        orderBy: {
          usedAt: 'desc',
        },
      })

      stats.push({
        topicId: topic.id,
        topicName: topic.name,
        subjectId: topic.subjectId,
        subjectName: topic.subject.name,
        classId: topic.subject.class.id,
        className: topic.subject.class.name,
        usageCount: topic._count.videos,
        lastUsedAt: recentUsage?.usedAt || null,
      })
    }

    return stats
  } catch (error) {
    console.error("Error getting topic usage stats:", error)
    throw new Error("Failed to get topic usage statistics")
  }
}

/**
 * Get topics organized by subject for a specific class
 */
export async function getSubjectsWithTopics(classId: string): Promise<SubjectTopics[]> {
  try {
    const subjects = await prisma.subject.findMany({
      where: {
        classId: classId,
      },
      include: {
        topics: {
          include: {
            _count: {
              select: {
                videos: true,
              },
            },
          },
        },
      },
    })

    const subjectsWithTopics: SubjectTopics[] = subjects.map(subject => ({
      subjectId: subject.id,
      subjectName: subject.name,
      topics: subject.topics.map(topic => ({
        id: topic.id,
        name: topic.name,
        usageCount: topic._count.videos,
        lastUsedAt: null, // Will be populated if needed
      })),
    }))

    return subjectsWithTopics
  } catch (error) {
    console.error("Error getting subjects with topics:", error)
    throw new Error("Failed to get subjects with topics")
  }
}

/**
 * Select topics intelligently for video generation
 * Prioritizes topics that haven't been used recently or at all
 */
export async function selectTopicsForVideoGeneration(
  classId: string,
  subjectsPerRun: number = 4
): Promise<Array<{ subjectId: string, subjectName: string, topicId: string, topicName: string }>> {
  try {
    const subjectsWithTopics = await getSubjectsWithTopics(classId)

    // If we have fewer subjects than requested, use all available
    const subjectsToUse = subjectsWithTopics.slice(0, subjectsPerRun)

    const selectedTopics = []

    for (const subject of subjectsToUse) {
      // Sort topics by usage count (ascending - least used first)
      const sortedTopics = subject.topics.sort((a, b) => a.usageCount - b.usageCount)

      // Select the least used topic
      const selectedTopic = sortedTopics[0]

      if (!selectedTopic) {
        throw new Error(`No topics available for subject: ${subject.subjectName}`)
      }

      selectedTopics.push({
        subjectId: subject.subjectId,
        subjectName: subject.subjectName,
        topicId: selectedTopic.id,
        topicName: selectedTopic.name,
      })
    }

    return selectedTopics
  } catch (error) {
    console.error("Error selecting topics:", error)
    throw new Error("Failed to select topics for video generation")
  }
}

/**
 * Record topic usage when a video is created
 */
export async function recordTopicUsage(
  classId: string,
  subjectId: string,
  topicId: string,
  videoId?: string
): Promise<void> {
  try {
    await prisma.topicUsage.create({
      data: {
        classId,
        subjectId,
        topicId,
        videoId,
      },
    })
  } catch (error) {
    console.error("Error recording topic usage:", error)
    // Don't throw error as this is not critical for video creation
  }
}

/**
 * Get topics history as a formatted string for OpenAI prompt
 */
export async function getTopicsHistory(classId: string): Promise<string[]> {
  try {
    const usageRecords = await prisma.topicUsage.findMany({
      where: {
        classId: classId,
      },
      orderBy: {
        usedAt: 'desc',
      },
      take: 100, // Limit to recent 100 usages
    })

    // Get topic and subject information for each usage record
    const historyPromises = usageRecords.map(async (record) => {
      const topic = await prisma.topic.findUnique({
        where: { id: record.topicId },
        include: {
          subject: true,
        },
      })

      if (topic && topic.subject) {
        return `${topic.subject.name}:${topic.name}`
      }
      return null
    })

    const historyResults = await Promise.all(historyPromises)
    const history = historyResults.filter((item): item is string => item !== null)

    return history
  } catch (error) {
    console.error("Error getting topics history:", error)
    return []
  }
}

/**
 * Check if all topics in a class have been used at least once
 */
export async function checkAllTopicsCovered(classId: string): Promise<boolean> {
  try {
    const subjectsWithTopics = await getSubjectsWithTopics(classId)

    for (const subject of subjectsWithTopics) {
      const unusedTopics = subject.topics.filter(topic => topic.usageCount === 0)
      if (unusedTopics.length > 0) {
        return false // Still have unused topics
      }
    }

    return true // All topics have been used at least once
  } catch (error) {
    console.error("Error checking topic coverage:", error)
    return false
  }
}

