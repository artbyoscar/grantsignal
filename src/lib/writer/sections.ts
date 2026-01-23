/**
 * Standard grant proposal sections with target word counts
 */

export interface SectionDefinition {
  id: string;
  title: string;
  targetWordCount: number;
  description?: string;
}

export const STANDARD_SECTIONS: SectionDefinition[] = [
  {
    id: 'executive-summary',
    title: 'Executive Summary',
    targetWordCount: 500,
    description: 'Brief overview of your proposal and key points',
  },
  {
    id: 'organization-background',
    title: 'Organization Background',
    targetWordCount: 750,
    description: 'Your organization\'s mission, history, and qualifications',
  },
  {
    id: 'problem-statement',
    title: 'Problem Statement',
    targetWordCount: 600,
    description: 'The issue or need your project will address',
  },
  {
    id: 'project-description',
    title: 'Project Description',
    targetWordCount: 1000,
    description: 'Detailed description of your proposed project',
  },
  {
    id: 'goals-objectives',
    title: 'Goals and Objectives',
    targetWordCount: 500,
    description: 'Specific, measurable goals and objectives',
  },
  {
    id: 'methods-strategies',
    title: 'Methods and Strategies',
    targetWordCount: 800,
    description: 'How you will implement your project',
  },
  {
    id: 'evaluation-plan',
    title: 'Evaluation Plan',
    targetWordCount: 600,
    description: 'How you will measure success and outcomes',
  },
  {
    id: 'budget-justification',
    title: 'Budget and Justification',
    targetWordCount: 500,
    description: 'Financial details and budget narrative',
  },
  {
    id: 'sustainability-plan',
    title: 'Sustainability Plan',
    targetWordCount: 400,
    description: 'Long-term sustainability and future funding',
  },
];

export interface SectionProgress {
  sectionId: string;
  title: string;
  currentWordCount: number;
  targetWordCount: number;
  completionPercentage: number;
  status: 'not-started' | 'in-progress' | 'completed';
  content: string;
  lastUpdated?: Date;
}

/**
 * Calculate word count from text content
 */
export function calculateWordCount(text: string): number {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Calculate completion percentage based on word count
 */
export function calculateCompletion(
  currentWords: number,
  targetWords: number
): number {
  if (targetWords === 0) return 0;
  const percentage = Math.round((currentWords / targetWords) * 100);
  return Math.min(percentage, 100); // Cap at 100%
}

/**
 * Determine section status based on completion
 */
export function getSectionStatus(
  completionPercentage: number
): SectionProgress['status'] {
  if (completionPercentage === 0) return 'not-started';
  if (completionPercentage >= 100) return 'completed';
  return 'in-progress';
}

/**
 * Calculate progress for a single section
 */
export function calculateSectionProgress(
  section: SectionDefinition,
  content: string
): SectionProgress {
  const currentWordCount = calculateWordCount(content);
  const completionPercentage = calculateCompletion(
    currentWordCount,
    section.targetWordCount
  );
  const status = getSectionStatus(completionPercentage);

  return {
    sectionId: section.id,
    title: section.title,
    currentWordCount,
    targetWordCount: section.targetWordCount,
    completionPercentage,
    status,
    content,
  };
}

/**
 * Calculate overall progress across all sections
 */
export function calculateOverallProgress(
  sections: SectionProgress[]
): number {
  if (sections.length === 0) return 0;

  const totalCompletion = sections.reduce(
    (sum, section) => sum + section.completionPercentage,
    0
  );

  return Math.round(totalCompletion / sections.length);
}

/**
 * Parse section content from a combined document
 * Looks for section headers and extracts content between them
 */
export function parseSectionsFromContent(
  fullContent: string
): Record<string, string> {
  const sectionContents: Record<string, string> = {};

  STANDARD_SECTIONS.forEach((section) => {
    // Look for section headers in various formats
    const patterns = [
      new RegExp(`^#{1,3}\\s*${section.title}\\s*$`, 'im'),
      new RegExp(`^${section.title}\\s*$`, 'im'),
      new RegExp(`^\\*\\*${section.title}\\*\\*\\s*$`, 'im'),
    ];

    let match: RegExpMatchArray | null = null;
    let pattern: RegExp | null = null;

    for (const p of patterns) {
      match = fullContent.match(p);
      if (match) {
        pattern = p;
        break;
      }
    }

    if (match && match.index !== undefined && pattern) {
      const startIndex = match.index + match[0].length;

      // Find the next section header
      let endIndex = fullContent.length;
      for (const otherSection of STANDARD_SECTIONS) {
        if (otherSection.id === section.id) continue;

        const otherPatterns = [
          new RegExp(`^#{1,3}\\s*${otherSection.title}\\s*$`, 'im'),
          new RegExp(`^${otherSection.title}\\s*$`, 'im'),
          new RegExp(`^\\*\\*${otherSection.title}\\*\\*\\s*$`, 'im'),
        ];

        for (const op of otherPatterns) {
          const otherMatch = fullContent.slice(startIndex).match(op);
          if (otherMatch && otherMatch.index !== undefined) {
            const potentialEnd = startIndex + otherMatch.index;
            if (potentialEnd < endIndex) {
              endIndex = potentialEnd;
            }
          }
        }
      }

      sectionContents[section.id] = fullContent
        .slice(startIndex, endIndex)
        .trim();
    }
  });

  return sectionContents;
}

/**
 * Insert or update a section header in the content
 */
export function insertSectionHeader(
  content: string,
  sectionTitle: string
): string {
  // Check if section already exists
  const patterns = [
    new RegExp(`^#{1,3}\\s*${sectionTitle}\\s*$`, 'im'),
    new RegExp(`^${sectionTitle}\\s*$`, 'im'),
    new RegExp(`^\\*\\*${sectionTitle}\\*\\*\\s*$`, 'im'),
  ];

  for (const pattern of patterns) {
    if (pattern.test(content)) {
      return content; // Section already exists
    }
  }

  // Add section header at the end
  const header = `\n\n## ${sectionTitle}\n\n`;
  return content + header;
}
