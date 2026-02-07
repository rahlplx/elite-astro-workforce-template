/**
 * Metadata Standardizer
 * 
 * Automatically adds missing 'version' and updates legacy references in SKILL.md files.
 */

import { readFileSync, writeFileSync, readdirSync, lstatSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = join(__dirname, '..', 'skills');

async function standardize() {
    const skills = readdirSync(SKILLS_DIR);
    let updatedCount = 0;

    for (const skill of skills) {
        const skillPath = join(SKILLS_DIR, skill, 'SKILL.md');
        
        try {
            if (!lstatSync(skillPath).isFile()) continue;

            let content = readFileSync(skillPath, 'utf8');
            let modified = false;

            // 1. Add missing version
            if (!content.includes('version:')) {
                content = content.replace('---', '---\nversion: 1.0.0');
                modified = true;
            }

            // 2. Update legacy Tailwind references
            if (content.includes('@astrojs/tailwind')) {
                content = content.replace(/@astrojs\/tailwind/g, '@tailwindcss/vite');
                modified = true;
            }

            if (modified) {
                writeFileSync(skillPath, content);
                console.log(`✅ Standardized: ${skill}`);
                updatedCount++;
            }
        } catch (e) {
            // Skill might not have SKILL.md at top level
        }
    }

    console.log(`\n🚀 Metadata Standardization Complete. Updated ${updatedCount} skills.`);
}

standardize();
