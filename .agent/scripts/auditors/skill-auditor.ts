/**
 * Agentic System - Skill Auditor
 * 
 * Audits the AI Workforce skills for portability, compliance, and "Vibe Ready" status.
 * Checks YAML frontmatter, versioning, deprecated dependencies, and key metadata.
 * 
 * @module auditors/skill-auditor
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

interface SkillAuditResult {
    skill: string;
    path: string;
    status: 'pass' | 'fail' | 'warn';
    issues: string[];
}

export async function auditSkills(): Promise<SkillAuditResult[]> {
    const results: SkillAuditResult[] = [];
    const skillsDir = join(process.cwd(), '.agent', 'skills');

    try {
        const skills = getAllSkills(skillsDir);
        console.log(`🔍 Auditing ${skills.length} skills for Agentic System compliance...`);

        for (const skillPath of skills) {
            const issues: string[] = [];
            let status: 'pass' | 'fail' | 'warn' = 'pass';
            const skillName = skillPath.split(/[\\/]/).slice(-2, -1)[0];

            try {
                const content = readFileSync(skillPath, 'utf8');

                // 1. YAML Frontmatter Check
                const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
                if (!content.startsWith('---') || !frontmatterMatch) {
                    issues.push('❌ Invalid YAML frontmatter');
                    status = 'fail';
                } else {
                    const frontmatter = frontmatterMatch[1];
                    
                    // 2. Required Fields
                    if (!frontmatter.includes('name:')) issues.push('❌ Missing "name" field');
                    if (!frontmatter.includes('description:')) issues.push('❌ Missing "description" field');
                    
                    // 3. Versioning (Critical for portability)
                    if (!frontmatter.includes('version:')) {
                        issues.push('⚠️ Missing "version" field (Required for portability)');
                        if (status === 'pass') status = 'warn';
                    }

                    // 4. Tools/Capabilities
                    if (content.includes('allowed-tools:')) {
                        // Good
                    }
                }

                // 5. Deprecated Patterns (Zero-Legacy)
                if (content.includes('@astrojs/tailwind')) {
                    issues.push('❌ Usage of deprecated @astrojs/tailwind');
                    status = 'fail';
                }
                if (content.includes('tailwind.config.cjs') || content.includes('tailwind.config.mjs')) {
                     // Only warn if it's not the architect skill describing migration
                    if (skillName !== 'tailwind-v4-architect') {
                        issues.push('⚠️ Reference to legacy tailwind config');
                        if (status === 'pass') status = 'warn';
                    }
                }

                // 6. Brand Neutrality
                if (content.includes('Smile Savers')) {
                     issues.push('❌ Contains "Smile Savers" brand reference');
                     status = 'fail';
                }

            } catch (err) {
                issues.push(`❌ internal error: ${err}`);
                status = 'fail';
            }

            results.push({ skill: skillName, path: skillPath, status, issues });
        }
    } catch (error) {
        console.error('Fatal error in skill auditor:', error);
    }

    return results;
}

function getAllSkills(dir: string): string[] {
    const skills: string[] = [];
    try {
        const entries = readdirSync(dir);
        for (const entry of entries) {
            const fullPath = join(dir, entry);
            if (statSync(fullPath).isDirectory()) {
                const skillFile = join(fullPath, 'SKILL.md');
                try {
                    if (statSync(skillFile).isFile()) skills.push(skillFile);
                } catch {}
            }
        }
    } catch (e) {
        console.warn(`Warning: Could not read skills dir: ${dir}`);
    }
    return skills;
}

// Self-execution if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    auditSkills().then(results => {
        const failed = results.filter(r => r.status === 'fail');
        const warned = results.filter(r => r.status === 'warn');
        
        console.log('\n📊 Skill Audit Results:');
        console.log(`✅ Passed: ${results.length - failed.length - warned.length}`);
        console.log(`⚠️ Warnings: ${warned.length}`);
        console.log(`❌ Failed: ${failed.length}`);

        if (failed.length > 0) {
            console.log('\n🚨 Failures:');
            failed.forEach(f => console.log(`  - ${f.skill}: ${f.issues.join(', ')}`));
            process.exit(1);
        }
        
        if (warned.length > 0) {
            console.log('\n⚠️ Warnings:');
            warned.forEach(w => console.log(`  - ${w.skill}: ${w.issues.join(', ')}`));
        }
    });
}
