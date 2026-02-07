/**
 * Skill Validation Script
 * Validates all SKILL.md files for proper YAML frontmatter and structure
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

interface SkillFrontmatter {
    name: string;
    description: string;
    version?: string;
    priority?: string;
    'allowed-tools'?: string;
}

interface ValidationResult {
    skillPath: string;
    valid: boolean;
    errors: string[];
    warnings: string[];
}

function validateSkill(skillPath: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
        const content = readFileSync(skillPath, 'utf8');
        
        // Check for YAML frontmatter
        if (!content.startsWith('---')) {
            errors.push('Missing YAML frontmatter (must start with ---)');
            return { skillPath, valid: false, errors, warnings };
        }

        const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
        if (!frontmatterMatch) {
            errors.push('Invalid YAML frontmatter format');
            return { skillPath, valid: false, errors, warnings };
        }

        const frontmatter = frontmatterMatch[1];
        
        // Check required fields
        if (!frontmatter.includes('name:')) {
            errors.push('Missing required field: name');
        }
        if (!frontmatter.includes('description:')) {
            errors.push('Missing required field: description');
        }

        // Check for deprecated patterns
        if (content.includes('@astrojs/tailwind')) {
            warnings.push('Contains deprecated @astrojs/tailwind reference (use @tailwindcss/vite)');
        }
        if (content.includes('Smile Savers')) {
            warnings.push('Contains brand-specific "Smile Savers" reference');
        }

        // Check for version field
        if (!frontmatter.includes('version:')) {
            warnings.push('Missing recommended field: version');
        }

    } catch (error) {
        errors.push(`Failed to read file: ${error}`);
    }

    return {
        skillPath,
        valid: errors.length === 0,
        errors,
        warnings
    };
}

function getAllSkills(skillsDir: string): string[] {
    const skills: string[] = [];
    const entries = readdirSync(skillsDir);

    for (const entry of entries) {
        const fullPath = join(skillsDir, entry);
        if (statSync(fullPath).isDirectory()) {
            const skillFile = join(fullPath, 'SKILL.md');
            try {
                statSync(skillFile);
                skills.push(skillFile);
            } catch {
                // SKILL.md doesn't exist in this directory
            }
        }
    }

    return skills;
}

async function main() {
    console.log('🔍 Elite Skill Validator');
    console.log('========================\n');

    const skillsDir = join(process.cwd(), '.agent', 'skills');
    const skills = getAllSkills(skillsDir);

    console.log(`Found ${skills.length} skills to validate...\n`);

    const results: ValidationResult[] = [];
    let totalErrors = 0;
    let totalWarnings = 0;

    for (const skillPath of skills) {
        const result = validateSkill(skillPath);
        results.push(result);
        totalErrors += result.errors.length;
        totalWarnings += result.warnings.length;
    }

    // Report results
    const failed = results.filter(r => !r.valid);
    const warned = results.filter(r => r.valid && r.warnings.length > 0);

    if (failed.length > 0) {
        console.error(`❌ ${failed.length} skill(s) FAILED validation:\n`);
        for (const result of failed) {
            const skillName = result.skillPath.split(/[\\/]/).slice(-2, -1)[0];
            console.error(`  [${skillName}]`);
            for (const error of result.errors) {
                console.error(`    ❌ ${error}`);
            }
        }
        console.error('');
    }

    if (warned.length > 0) {
        console.warn(`⚠️  ${warned.length} skill(s) have warnings:\n`);
        for (const result of warned) {
            const skillName = result.skillPath.split(/[\\/]/).slice(-2, -1)[0];
            console.warn(`  [${skillName}]`);
            for (const warning of result.warnings) {
                console.warn(`    ⚠️  ${warning}`);
            }
        }
        console.warn('');
    }

    const passed = results.filter(r => r.valid && r.warnings.length === 0);
    console.log(`✅ ${passed.length} skill(s) passed validation\n`);

    console.log('Summary:');
    console.log(`  Total Skills: ${skills.length}`);
    console.log(`  Passed: ${passed.length}`);
    console.log(`  Warnings: ${warned.length}`);
    console.log(`  Failed: ${failed.length}`);

    if (failed.length > 0) {
        process.exit(1);
    }
}

main();
