/**
 * Elite Workforce - Learning Synchronization Engine
 * 
 * Automatically promotes documented lessons into system-wide rules.
 * This is the 'Auto-Implementation' layer of the Agentic System.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AGENT_ROOT = join(__dirname, '..');
const LESSONS_FILE = join(AGENT_ROOT, 'tasks', 'lessons.md');
const LEARNED_RULES_FILE = join(AGENT_ROOT, 'rules', 'LEARNED_RULES.md');

async function syncLearning() {
    console.log('🧠 [SYNC-LEARNING] Distilling lessons into rules...');

    if (!existsSync(LESSONS_FILE)) {
        console.log('⚠️ No lessons found to sync.');
        return;
    }

    const lessonsContent = readFileSync(LESSONS_FILE, 'utf-8');
    const sections = lessonsContent.split(/^## /m).filter(s => s.trim() && s.match(/^\d{4}/));

    if (sections.length === 0) {
        console.log('⚠️ No new lessons detected.');
        return;
    }

    const currentRules = existsSync(LEARNED_RULES_FILE) 
        ? readFileSync(LEARNED_RULES_FILE, 'utf-8') 
        : '# Learned System Rules\n\n';

    let updatedRules = currentRules;

    for (const section of sections) {
        const lesson = parseLesson(section);
        if (lesson && lesson.preventionRule) {
            // Check if rule already exists to avoid duplication
            const ruleGist = lesson.preventionRule.slice(0, 50);
            if (!currentRules.includes(ruleGist)) {
                updatedRules = addRuleToCategory(updatedRules, lesson.category, lesson.preventionRule);
                console.log(`✨ Promoted lesson to rule: ${lesson.category} -> ${ruleGist}...`);
            }
        }
    }

    writeFileSync(LEARNED_RULES_FILE, updatedRules);
    console.log('✅ System rules updated successfully.');
}

function parseLesson(section: string) {
    const lines = section.split('\n');
    const header = lines[0];
    const categoryMatch = header.match(/\d{4}-\d{2}-\d{2} - (\w+)/);
    const category = categoryMatch ? categoryMatch[1].toLowerCase() : 'general';

    // Look for Lesson Learned or Prevention Rule
    let preventionRule = '';
    const lessonIdx = lines.findIndex(l => l.includes('**Lesson Learned:**') || l.includes('**Prevention Rule:**'));
    if (lessonIdx !== -1) {
        // Collect points until next header or divider
        for (let i = lessonIdx + 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.startsWith('##') || line.startsWith('---') || line.startsWith('**')) break;
            if (line.startsWith('-')) {
                preventionRule += line + '\n';
            }
        }
    }

    return { category, preventionRule: preventionRule.trim() };
}

function addRuleToCategory(content: string, category: string, rule: string): string {
    const categoryHeader = `## ${capitalize(category)}`;
    if (content.includes(categoryHeader)) {
        // Insert after header
        return content.replace(categoryHeader, `${categoryHeader}\n\n${rule}`);
    } else {
        // Append new category
        return content + `\n${categoryHeader}\n\n${rule}\n`;
    }
}

function capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

syncLearning().catch(console.error);
