/**
 * Self-Improvement Loop
 *
 * Implements the learning loop from AI Workflow Orchestration Guidelines.
 * Records lessons after corrections and failures for continuous improvement.
 *
 * @module orchestration/self-improvement
 */

import { readFileSync, writeFileSync, existsSync, appendFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TASKS_DIR = join(__dirname, '..', 'tasks');
const LESSONS_FILE = join(TASKS_DIR, 'lessons.md');
const TODO_FILE = join(TASKS_DIR, 'todo.md');

export interface Lesson {
    date: string;
    category: LessonCategory;
    failureMode: string;    // What went wrong (Gist Guideline)
    detectionSignal: string; // How we found it (Gist Guideline)
    preventionRule: string;  // How to stop it (Gist Guideline)
    pattern: string;
    tags: string[];
}

export type LessonCategory =
    | 'architecture'
    | 'implementation'
    | 'communication'
    | 'tooling'
    | 'performance'
    | 'security'
    | 'testing'
    | 'ux';

export interface TaskItem {
    priority: 'P0' | 'P1' | 'P2' | 'P3';
    description: string;
    context?: string;
    acceptance?: string;
    agent?: string;
    completed: boolean;
}

/**
 * Record a lesson after a correction or failure
 */
export function recordLesson(lesson: Lesson): void {
    const formattedLesson = formatLesson(lesson);

    if (existsSync(LESSONS_FILE)) {
        appendFileSync(LESSONS_FILE, '\n' + formattedLesson);
    } else {
        writeFileSync(LESSONS_FILE, formattedLesson);
    }

    console.log(`📝 Lesson recorded: ${lesson.category} - ${lesson.failureMode.slice(0, 50)}...`);
}

/**
 * Format a lesson for markdown
 */
function formatLesson(lesson: Lesson): string {
    return `
## ${lesson.date} - ${capitalize(lesson.category)}

**Failure Mode:** ${lesson.failureMode}

**Detection Signal:** ${lesson.detectionSignal}

**Prevention Rule:** ${lesson.preventionRule}

**Pattern to Remember:**
\`\`\`
${lesson.pattern}
\`\`\`

**Tags:** ${lesson.tags.map(t => `#${t}`).join(' ')}

---
`.trim();
}

/**
 * Search lessons for similar past mistakes
 */
export function searchLessons(query: string): Lesson[] {
    if (!existsSync(LESSONS_FILE)) {
        return [];
    }

    const content = readFileSync(LESSONS_FILE, 'utf-8');
    const queryLower = query.toLowerCase();

    // Simple search - find lessons containing query terms
    const sections = content.split(/^## /m).filter(s => s.trim());
    const matches: Lesson[] = [];

    for (const section of sections) {
        if (section.toLowerCase().includes(queryLower)) {
            const parsed = parseLesson(section);
            if (parsed) {
                matches.push(parsed);
            }
        }
    }

    return matches;
}

/**
 * Parse a lesson section from markdown
 */
function parseLesson(section: string): Lesson | null {
    try {
        const dateMatch = section.match(/^(\d{4}-\d{2}-\d{2}) - (\w+)/);
        const failureMatch = section.match(/\*\*Failure Mode:\*\* (.+)/);
        const detectionMatch = section.match(/\*\*Detection Signal:\*\* (.+)/);
        const preventionMatch = section.match(/\*\*Prevention Rule:\*\* (.+)/);
        const patternMatch = section.match(/```\n([\s\S]*?)\n```/);
        const tagsMatch = section.match(/\*\*Tags:\*\* (.+)/);

        if (!dateMatch) return null;

        return {
            date: dateMatch[1],
            category: dateMatch[2].toLowerCase() as LessonCategory,
            failureMode: failureMatch?.[1] || '',
            detectionSignal: detectionMatch?.[1] || '',
            preventionRule: preventionMatch?.[1] || '',
            pattern: patternMatch?.[1] || '',
            tags: tagsMatch?.[1]?.split(' ').map(t => t.replace('#', '')) || []
        };
    } catch {
        return null;
    }
}

/**
 * Get lessons by category
 */
export function getLessonsByCategory(category: LessonCategory): Lesson[] {
    if (!existsSync(LESSONS_FILE)) {
        return [];
    }

    const content = readFileSync(LESSONS_FILE, 'utf-8');
    const sections = content.split(/^## /m).filter(s => s.trim());

    return sections
        .filter(s => s.toLowerCase().includes(`- ${category}`))
        .map(parseLesson)
        .filter((l): l is Lesson => l !== null);
}

/**
 * Check for similar lessons before starting a task
 */
export function checkForSimilarLessons(taskDescription: string): string | null {
    const lessons = searchLessons(taskDescription);

    if (lessons.length === 0) {
        return null;
    }

    const relevantLessons = lessons.slice(0, 3);
    const warnings = relevantLessons.map(l =>
        `⚠️ **${l.date}**: ${l.preventionRule}`
    ).join('\n');

    return `
📚 **Relevant Past Lessons Found:**

${warnings}

Review these before proceeding to avoid repeating mistakes.
`.trim();
}

/**
 * Generate correction analysis
 */
export function analyzeCorrection(
    originalOutput: string,
    correctedOutput: string,
    userFeedback: string
): Partial<Lesson> {
    // Analyze the difference between original and corrected
    const analysis: Partial<Lesson> = {
        date: new Date().toISOString().split('T')[0],
        failureMode: userFeedback,
        tags: []
    };

    // Detect category from content
    if (/security|auth|password|token/i.test(userFeedback)) {
        analysis.category = 'security';
        analysis.tags?.push('security');
    } else if (/performance|slow|optimize/i.test(userFeedback)) {
        analysis.category = 'performance';
        analysis.tags?.push('performance');
    } else if (/test|spec|coverage/i.test(userFeedback)) {
        analysis.category = 'testing';
        analysis.tags?.push('testing');
    } else if (/design|architecture|pattern/i.test(userFeedback)) {
        analysis.category = 'architecture';
        analysis.tags?.push('architecture');
    } else {
        analysis.category = 'implementation';
        analysis.tags?.push('implementation');
    }

    return analysis;
}

/**
 * Get statistics on lessons
 */
export function getLessonStats(): {
    total: number;
    byCategory: Record<string, number>;
    recentTags: string[];
} {
    if (!existsSync(LESSONS_FILE)) {
        return { total: 0, byCategory: {}, recentTags: [] };
    }

    const content = readFileSync(LESSONS_FILE, 'utf-8');
    const sections = content.split(/^## /m).filter(s => s.trim() && s.match(/^\d{4}/));

    const byCategory: Record<string, number> = {};
    const allTags: string[] = [];

    for (const section of sections) {
        const lesson = parseLesson(section);
        if (lesson) {
            byCategory[lesson.category] = (byCategory[lesson.category] || 0) + 1;
            allTags.push(...lesson.tags);
        }
    }

    // Get most recent unique tags
    const recentTags = [...new Set(allTags.slice(-20))];

    return {
        total: sections.length,
        byCategory,
        recentTags
    };
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export default {
    recordLesson,
    searchLessons,
    getLessonsByCategory,
    checkForSimilarLessons,
    analyzeCorrection,
    getLessonStats
};
