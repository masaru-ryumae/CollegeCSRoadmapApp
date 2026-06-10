// Tutorial Engine for creating, updating, and publishing tutorials
import { Tutorial, TutorialStep, SEOSettings, ContentStatus } from '../types';

interface TutorialContent {
  title: string;
  description: string;
  steps: TutorialStep[];
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
}

interface TutorialMetadata {
  authorId: string;
  seo: SEOSettings;
}

// In-memory storage (replace with database in production)
const tutorialsDb = new Map<string, Tutorial>();
const analyticsDb = new Map<string, { views: number; engagement: number; lastUpdated: string }>();

/**
 * Create a new tutorial
 */
export const createTutorial = (
  content: TutorialContent,
  metadata: TutorialMetadata
): Tutorial => {
  const tutorialId = `tutorial_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const tutorial: Tutorial = {
    id: tutorialId,
    title: content.title,
    description: content.description,
    steps: content.steps,
    tags: content.tags,
    difficulty: content.difficulty,
    estimatedMinutes: content.estimatedMinutes,
    authorId: metadata.authorId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    seo: metadata.seo,
    status: 'draft',
    views: 0,
    engagement: 0,
    version: 1,
  };

  tutorialsDb.set(tutorialId, tutorial);
  analyticsDb.set(tutorialId, {
    views: 0,
    engagement: 0,
    lastUpdated: new Date().toISOString(),
  });

  return tutorial;
};

/**
 * Update tutorial content
 */
export const updateTutorial = (
  tutorialId: string,
  content: Partial<TutorialContent>
): Tutorial | null => {
  const tutorial = tutorialsDb.get(tutorialId);
  if (!tutorial) return null;

  const updatedTutorial: Tutorial = {
    ...tutorial,
    ...content,
    updatedAt: new Date().toISOString(),
    version: tutorial.version + 1,
  };

  tutorialsDb.set(tutorialId, updatedTutorial);
  return updatedTutorial;
};

/**
 * Publish a tutorial (make it publicly available)
 */
export const publishTutorial = (tutorialId: string): Tutorial | null => {
  const tutorial = tutorialsDb.get(tutorialId);
  if (!tutorial) return null;

  const publishedTutorial: Tutorial = {
    ...tutorial,
    status: 'published',
    publishedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  tutorialsDb.set(tutorialId, publishedTutorial);
  return publishedTutorial;
};

/**
 * Unpublish a tutorial (make it private)
 */
export const unpublishTutorial = (tutorialId: string): Tutorial | null => {
  const tutorial = tutorialsDb.get(tutorialId);
  if (!tutorial) return null;

  const unpublishedTutorial: Tutorial = {
    ...tutorial,
    status: 'draft',
    updatedAt: new Date().toISOString(),
  };

  tutorialsDb.set(tutorialId, unpublishedTutorial);
  return unpublishedTutorial;
};

/**
 * Get tutorial statistics (views, engagement)
 */
export const getTutorialStats = (tutorialId: string): { views: number; engagement: number } | null => {
  const analytics = analyticsDb.get(tutorialId);
  if (!analytics) return null;

  return {
    views: analytics.views,
    engagement: analytics.engagement,
  };
};

/**
 * Track a view for a tutorial
 */
export const trackTutorialView = (tutorialId: string): void => {
  const analytics = analyticsDb.get(tutorialId);
  if (analytics) {
    analytics.views += 1;
    analytics.lastUpdated = new Date().toISOString();
  }

  const tutorial = tutorialsDb.get(tutorialId);
  if (tutorial) {
    tutorial.views += 1;
  }
};

/**
 * Track engagement (e.g., completed step, quiz, etc.)
 */
export const trackEngagement = (tutorialId: string, engagementScore: number): void => {
  const analytics = analyticsDb.get(tutorialId);
  if (analytics) {
    analytics.engagement += engagementScore;
    analytics.lastUpdated = new Date().toISOString();
  }

  const tutorial = tutorialsDb.get(tutorialId);
  if (tutorial) {
    tutorial.engagement += engagementScore;
  }
};

/**
 * Export tutorial to different formats
 */
export const exportTutorial = (
  tutorialId: string,
  format: 'pdf' | 'markdown'
): string | null => {
  const tutorial = tutorialsDb.get(tutorialId);
  if (!tutorial) return null;

  if (format === 'markdown') {
    return generateMarkdown(tutorial);
  } else if (format === 'pdf') {
    // In production, use a PDF library like pdfkit or PDFDocument
    // For now, return markdown that can be converted to PDF
    return generateMarkdown(tutorial);
  }

  return null;
};

/**
 * Generate Markdown representation of tutorial
 */
const generateMarkdown = (tutorial: Tutorial): string => {
  let markdown = `# ${tutorial.title}\n\n`;
  markdown += `${tutorial.description}\n\n`;
  markdown += `**Difficulty:** ${tutorial.difficulty}\n`;
  markdown += `**Estimated Time:** ${tutorial.estimatedMinutes} minutes\n`;
  markdown += `**Tags:** ${tutorial.tags.join(', ')}\n\n`;

  markdown += '## Steps\n\n';

  tutorial.steps.forEach((step, index) => {
    markdown += `### Step ${index + 1}: ${step.title}\n\n`;
    markdown += `${step.description}\n\n`;

    if (step.codeBlocks && step.codeBlocks.length > 0) {
      step.codeBlocks.forEach((block) => {
        markdown += `\`\`\`${block.language}\n${block.code}\n\`\`\`\n\n`;
      });
    }

    if (step.checkpoint) {
      markdown += `**Checkpoint:** ${step.checkpoint.question}\n`;
      markdown += `Options:\n`;
      step.checkpoint.options.forEach((opt) => {
        markdown += `- ${opt.text}\n`;
      });
      markdown += `Answer: ${step.checkpoint.explanation}\n\n`;
    }
  });

  markdown += `---\n`;
  markdown += `Created: ${tutorial.createdAt}\n`;
  markdown += `Last Updated: ${tutorial.updatedAt}\n`;
  markdown += `Author ID: ${tutorial.authorId}\n`;

  return markdown;
};

/**
 * Get tutorial by ID
 */
export const getTutorial = (tutorialId: string): Tutorial | null => {
  return tutorialsDb.get(tutorialId) || null;
};

/**
 * Get all published tutorials
 */
export const getPublishedTutorials = (): Tutorial[] => {
  return Array.from(tutorialsDb.values()).filter((t) => t.status === 'published');
};

/**
 * Search tutorials by title or tags
 */
export const searchTutorials = (query: string): Tutorial[] => {
  const lowerQuery = query.toLowerCase();
  return Array.from(tutorialsDb.values()).filter(
    (t) =>
      t.status === 'published' &&
      (t.title.toLowerCase().includes(lowerQuery) ||
        t.description.toLowerCase().includes(lowerQuery) ||
        t.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)))
  );
};

/**
 * Get tutorials by author
 */
export const getTutorialsByAuthor = (authorId: string): Tutorial[] => {
  return Array.from(tutorialsDb.values()).filter((t) => t.authorId === authorId);
};

/**
 * Delete a tutorial (soft delete - archive)
 */
export const deleteTutorial = (tutorialId: string): boolean => {
  const tutorial = tutorialsDb.get(tutorialId);
  if (!tutorial) return false;

  tutorial.status = 'archived';
  tutorialsDb.set(tutorialId, tutorial);
  return true;
};

/**
 * Get tutorial versions (changelog)
 */
export const getTutorialVersions = (tutorialId: string): number[] => {
  const tutorial = tutorialsDb.get(tutorialId);
  if (!tutorial) return [];

  return Array.from({ length: tutorial.version }, (_, i) => i + 1);
};
