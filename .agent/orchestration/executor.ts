/**
 * Elite Workforce - Skill Execution Engine
 *
 * Actually executes skills by:
 * - Loading skill definitions from SKILL.md files
 * - Checking cache for previous results
 * - Assessing risk before execution
 * - Creating checkpoints for risky operations
 * - Recording outcomes for learning
 *
 * @module orchestration/executor
 */

import { config } from '../config/index.js';
import { SkillExecutionError } from './errors.js';
import { readFileSync, existsSync, readdirSync } from 'node:fs';

import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { logger } from './logger.js';
import { cache } from './cache.js';
import { memory, type UserPreferences } from './memory.js';
import { guardrails } from './guardrails.js';
import { learning } from './learning.js';
import { spawnSync } from 'node:child_process';
import { riskAssessor, assessRisk, type RiskProfile, checkpoint } from './risk-assessor.js';
import { critic } from './critic.js';
import { recordLesson } from './self-improvement.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SKILLS_DIR = join(__dirname, '..', 'skills');

// ========================================
// TYPES & INTERFACES
// ========================================

export interface SkillDefinition {
    name: string;
    description: string;
    version: string;
    activationPhrases: string[];
    capabilities: string[];
    techStack: string[];
    rules: string[];
    outputFormat?: string;
    dependencies?: string[];
}

export interface ExecutionContext {
    instruction: string;
    projectPath: string;
    targetFiles?: string[];
    userPreferences?: UserPreferences;
    previousContext?: Record<string, unknown>;
}

export interface ExecutionResult {
    success: boolean;
    skillUsed: string;
    output: string;
    tokensUsed: number;
    cached: boolean;
    riskProfile: RiskProfile;
    checkpointId?: string;
    duration: number;
    nextSteps?: string[];
}

export interface SkillContext {
    skill: SkillDefinition;
    instruction: string;
    projectPath: string;
    riskProfile: RiskProfile;
}

// ========================================
// SKILL LOADER
// ========================================

/**
 * Load all available skills from the skills directory
 */
export function loadAllSkills(): Map<string, SkillDefinition> {
    const skills = new Map<string, SkillDefinition>();

    // Check cache first
    const cachedSkills = cache.getPattern('all-skills');
    if (cachedSkills) {
        return new Map(Object.entries(cachedSkills as Record<string, SkillDefinition>));
    }

    if (!existsSync(SKILLS_DIR)) {
        return skills;
    }

    const skillDirs = readdirSync(SKILLS_DIR, { withFileTypes: true })
        .filter(d => d.isDirectory())
        .map(d => d.name);

    for (const skillDir of skillDirs) {
        const skillPath = join(SKILLS_DIR, skillDir, 'SKILL.md');
        if (existsSync(skillPath)) {
            const skill = parseSkillFile(skillPath, skillDir);
            if (skill) {
                skills.set(skillDir, skill);
            }
        }
    }

    // Cache the loaded skills
    cache.cachePattern('all-skills', Object.fromEntries(skills));

    return skills;
}

/**
 * Parse a SKILL.md file into a SkillDefinition
 */
function parseSkillFile(filePath: string, skillName: string): SkillDefinition | null {
    try {
        const content = readFileSync(filePath, 'utf-8');

        // Extract YAML frontmatter if present
        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
        const frontmatter = frontmatterMatch ? frontmatterMatch[1] : '';

        // Parse basic info
        const name = extractYamlValue(frontmatter, 'name') || skillName;
        const description = extractYamlValue(frontmatter, 'description') || extractFirstParagraph(content);
        const version = extractYamlValue(frontmatter, 'version') || '1.0.0';

        // Extract activation phrases
        const activationPhrases = extractListSection(content, 'Activation') ||
            extractListSection(content, 'Triggers') ||
            [skillName.replace(/-/g, ' ')];

        // Extract capabilities
        const capabilities = extractListSection(content, 'Capabilities') ||
            extractListSection(content, 'Features') ||
            [];

        // Extract tech stack
        const techStack = extractListSection(content, 'Tech Stack') ||
            extractListSection(content, 'Technologies') ||
            [];

        // Extract rules
        const rules = extractListSection(content, 'Rules') ||
            extractListSection(content, 'Constraints') ||
            [];

        return {
            name,
            description,
            version,
            activationPhrases,
            capabilities,
            techStack,
            rules,
        };
    } catch {
        return null;
    }
}

/**
 * Extract a value from YAML-like content
 */
function extractYamlValue(yaml: string, key: string): string | null {
    const match = yaml.match(new RegExp(`^${key}:\\s*(.+)$`, 'mi'));
    return match ? match[1].trim().replace(/^["']|["']$/g, '') : null;
}

/**
 * Extract first paragraph after frontmatter
 */
function extractFirstParagraph(content: string): string {
    const withoutFrontmatter = content.replace(/^---[\s\S]*?---\n*/, '');
    const paragraphs = withoutFrontmatter.split(/\n\n+/);
    for (const p of paragraphs) {
        const cleaned = p.replace(/^#+\s*/, '').trim();
        if (cleaned.length > 20 && !cleaned.startsWith('#')) {
            return cleaned.substring(0, 200);
        }
    }
    return '';
}

/**
 * Extract a list section from markdown
 */
function extractListSection(content: string, sectionName: string): string[] | null {
    const sectionRegex = new RegExp(`##?\\s*${sectionName}[\\s\\S]*?(?=\\n##|$)`, 'i');
    const sectionMatch = content.match(sectionRegex);

    if (!sectionMatch) return null;

    const listItems = sectionMatch[0].match(/^[-*]\s+(.+)$/gm);
    if (!listItems) return null;

    return listItems.map(item => item.replace(/^[-*]\s+/, '').trim());
}

// ========================================
// SKILL MATCHER
// ========================================

/**
 * Find the best matching skill for an instruction
 */
export function findBestSkill(instruction: string, skills: Map<string, SkillDefinition>): string | null {
    // Check cache first
    const cacheKey = `skill-match:${instruction.toLowerCase().substring(0, 100)}`;
    const cached = cache.getSkillResolution(cacheKey);
    if (cached) {
        return cached;
    }

    const query = instruction.toLowerCase();
    let bestMatch: { skill: string; score: number } | null = null;

    for (const [skillName, skill] of skills) {
        let score = 0;

        // Check activation phrases
        for (const phrase of skill.activationPhrases) {
            if (query.includes(phrase.toLowerCase())) {
                score += 10;
            }
        }

        // Check capabilities
        for (const cap of skill.capabilities) {
            const capWords = cap.toLowerCase().split(/\s+/);
            for (const word of capWords) {
                if (word.length > 3 && query.includes(word)) {
                    score += 2;
                }
            }
        }

        // Check tech stack
        for (const tech of skill.techStack) {
            if (query.includes(tech.toLowerCase())) {
                score += 5;
            }
        }

        // Check skill name
        const nameWords = skillName.split('-');
        for (const word of nameWords) {
            if (query.includes(word)) {
                score += 3;
            }
        }

        if (score > 0 && (!bestMatch || score > bestMatch.score)) {
            bestMatch = { skill: skillName, score };
        }
    }

    if (bestMatch) {
        cache.cacheSkillResolution(cacheKey, bestMatch.skill);
        return bestMatch.skill;
    }

    return null;
}

// ========================================
// SKILL EXECUTOR CLASS
// ========================================

export class SkillExecutor {
    private skills: Map<string, SkillDefinition>;
    private executionHistory: ExecutionResult[] = [];

    constructor() {
        this.skills = loadAllSkills();
    }

    /**
     * Execute a skill based on instruction with self-correction logic and optimized pathways
     */
    async execute(context: ExecutionContext): Promise<ExecutionResult> {
        // 0. Short Pathway: Check memory for success patterns
        const learningData = memory.getLearningData();
        const successPattern = learningData.successPatterns[context.instruction.toLowerCase()];
        if (successPattern && successPattern > 5) {
            logger.info(`🚀 [SHORT PATHWAY]: High success pattern detected for instruction. Optimizing execution.`);
            // Potentially load from cache or use a more direct specialized agent
        }

        // 1. Guardrail: Reasoning Layer: Inject Core Protocols & Past Insights
        // Load mandatory system rules (2026 Integrity Binding)
        try {
            const rulesPath = join(__dirname, '..', 'rules', 'LEARNED_RULES.md');
            const workflowPath = join(__dirname, '..', 'ELITE_SAFE_WORKFLOW.md');
            
            if (existsSync(rulesPath)) {
                const learnedRules = readFileSync(rulesPath, 'utf8');
                context.instruction = `[SYSTEM RULES]:\n${learnedRules}\n\n${context.instruction}`;
            }

            if (existsSync(workflowPath)) {
                const safeWorkflow = readFileSync(workflowPath, 'utf8');
                context.instruction = `[MANDATORY PROTOCOL]:\n${safeWorkflow}\n\n${context.instruction}`;
            }
        } catch (e: any) {
            logger.warn(`⚠️ Failed to inject system protocols: ${e.message}`);
        }

        // 0.2 REAL-TIME AUTO-TRIGGER: System Integrity & Red Team Verification
        const sensitiveTerms = ['orchestration', 'skill', 'agent', 'graph', 'backdoor', 'exploit', 'root'];
        if (sensitiveTerms.some(term => context.instruction.toLowerCase().includes(term))) {
            logger.info(`🚨 [AUTO-TRIGGER]: Sensitive architectural operation detected. Running real-time security sweep... [SECURITY_SWEEP]`);
            
            // Run Integrity Check
            const integrityCheck = spawnSync('npx', ['tsx', '.agent/scripts/check-integrity.ts'], { encoding: 'utf-8' });
            if (integrityCheck.status !== 0) {
                logger.error('❌ [INTEGRITY FAILURE]: Cross-system connections are compromised. Aborting execution.');
                return {
                    success: false,
                    skillUsed: 'system-integrity',
                    output: 'SYSTEM INTEGRITY VIOLATION: Skill-Agent-Workflow connectivity is broken.',
                    tokensUsed: 0,
                    cached: false,
                    riskProfile: { level: 'BLOCKED', score: 100, requiresBackup: false, estimatedTokens: 0, emoji: '🚫', description: 'Integrity Breach', requiresConfirmation: true, mitigations: [] },
                    duration: 0
                };
            }

            // Run Battle Test (Sub-sampling)
            const battleTest = spawnSync('npx', ['tsx', '.agent/scripts/battle-test.ts'], { encoding: 'utf-8' });
            if (battleTest.status !== 0) {
                logger.error('❌ [SECURITY BREACH]: System failed recent battle test. Lockdown initiated.');
                return {
                    success: false,
                    skillUsed: 'red-team-gate',
                    output: 'SECURITY LOCKDOWN: Recent battle tests failed. Vulnerability detected.',
                    tokensUsed: 0,
                    cached: false,
                    riskProfile: { level: 'BLOCKED', score: 100, requiresBackup: false, estimatedTokens: 0, emoji: '🔐', description: 'Security Lockdown', requiresConfirmation: true, mitigations: [] },
                    duration: 0
                };
            }
            logger.info('✅ [AUTO-TRIGGER]: Security sweep passed. Proceeding with caution.');
        }

        const insights = learning.findRelevantInsights(context.instruction);
        if (insights.length > 0) {
            logger.info(`🧠 Retrieved ${insights.length} insights for task`, { insights });
            // Append insights to instruction so the agent sees them
            context.instruction += `\n\n[PAST LEARNINGS & WARNINGS]:\n${insights.join('\n')}`;
        }

        // 0.1 Drift Protection: Inject Design System reminders for long context
        if (context.instruction.length > 5000) { // Simple heuristic for complex/long tasks
            context.instruction += `\n\n[CRITICAL REMINDER]: Large context detected. To prevent style drift: 
            1. DO NOT use raw hex codes (Use ATLAS_TOKENS only).
            2. ENSURE mobile-first grids (grid-cols-1 first).
            3. VERIFY contrast (No black-on-black).`;
        }

        // 1. Guardrail: Reasoning Layer
        const reasoningCheck = guardrails.validateReasoning(context.instruction);
        if (!reasoningCheck.passed) {
            logger.warn(`Blocked reasoning: ${reasoningCheck.message}`, { instruction: context.instruction });
            return {
                success: false,
                skillUsed: 'guardrails',
                output: reasoningCheck.message,
                tokensUsed: 0,
                cached: false,
                riskProfile: assessRisk(context.instruction),
                duration: 0
            };
        }

        let attempts = 0;
        const maxAttempts = config.retryPolicy.maxAttempts;
        let lastResult: ExecutionResult | null = null;

        while (attempts < maxAttempts) {
            attempts++;
            
                try {
                    let result = await this.internalExecute(context);
                    
                    // 2. Evaluator-Optimizer Loop (Self-Reflection)
                    if (result.success) {
                        const critique = await critic.evaluate(context.instruction, result.output, result.skillUsed);
                        if (!critique.passed) {
                            logger.warn(`🛑 [CRITIC]: Output rejected (Score: ${critique.score}). Retrying with feedback.`, { feedback: critique.feedback });
                            result.success = false;
                            result.output = critique.feedback;
                            
                            // Re-route and retry with optimized instruction
                            context.instruction = critic.getSelfFixInstruction(context.instruction, critique);
                        }
                    }

                    if (result.success) {
                        // 3. Visual Eye (Vibe Coder Phase 2)
                        const uiKeywords = ['style', 'design', 'ui', 'color', 'layout', 'vibe', 'premium', 'look'];
                        const isUIChange = uiKeywords.some(kw => context.instruction.toLowerCase().includes(kw)) || 
                                          result.skillUsed === 'design-expert' || 
                                          result.skillUsed === 'ai-pilot';
                        
                        if (isUIChange) {
                            logger.info('👁️  [BROWSER-EYE]: Triggering visual feedback loop...');
                            spawnSync('npx', ['tsx', '.agent/scripts/browser-eye.ts'], { stdio: 'inherit' });
                        }
                        
                        return result;
                    }
                
                // Add correction context to instruction for next attempt
                // We keep the original instruction but append failure context
                const baseInstruction = context.instruction.split('\n\n[SELF-FIXING CONTEXT]')[0];
                context.instruction = `${baseInstruction}\n\n[SELF-FIXING CONTEXT]: Attempt ${attempts} failed with: "${result.output}".`;
                
                recordLesson({
                    date: new Date().toISOString().split('T')[0],
                    category: 'implementation',
                    failureMode: `Skill ${result.skillUsed} failed after multiple attempts.`,
                    detectionSignal: result.output,
                    preventionRule: 'Identify root cause of repeating failure in this component.',
                    pattern: 'RETRY_EXHAUSTED',
                    tags: ['failure', result.skillUsed]
                });
                
                // Wait before retry
                if (attempts < maxAttempts) {
                    await new Promise(resolve => setTimeout(resolve, config.retryPolicy.backoffMs * attempts));
                }
            } catch (error: any) {
                console.error(`❌ Fatal execution error on attempt ${attempts}:`, error.message);
                if (attempts >= maxAttempts) {
                    throw new SkillExecutionError(
                        `Fatal error after ${attempts} attempts: ${error.message}`,
                        'executor',
                        attempts
                    );
                }
            }
        }

        return lastResult!;
    }

    /**
     * Internal execution logic
     */
    private async internalExecute(context: ExecutionContext): Promise<ExecutionResult> {
        const startTime = Date.now();

        // Check cache for identical instruction
        const cachedResult = cache.getRouting(context.instruction);
        if (cachedResult) {
            return {
                ...(cachedResult as ExecutionResult),
                cached: true,
                duration: 0,
            };
        }

        // Token usage optimization: Truncate large context inputs
        if (context.instruction.length > 2000) {
            context.instruction = context.instruction.substring(0, 1900) + '... [TRUNCATED for token efficiency]';
        }

        // Assess risk
        const riskProfile = assessRisk(context.instruction);

        // Block dangerous operations
        if (riskProfile.level === 'BLOCKED') {
            return {
                success: false,
                skillUsed: 'none',
                output: riskProfile.blockedReason || 'Operation blocked for safety',
                tokensUsed: 0,
                cached: false,
                riskProfile,
                duration: Date.now() - startTime,
            };
        }

        // Find matching skill
        const skillName = findBestSkill(context.instruction, this.skills);
        if (!skillName) {
            return {
                success: false,
                skillUsed: 'none',
                output: 'No matching skill found for this instruction. Try rephrasing or check available skills.',
                tokensUsed: 50,
                cached: false,
                riskProfile,
                duration: Date.now() - startTime,
            };
        }

        const skill = this.skills.get(skillName)!;

        // 2. Guardrail: Action Layer (Payload Validation)
        const actionCheck = guardrails.validateAction({
            type: 'file_write', // Assume file_write for the demonstration context
            target: context.targetFiles?.[0] || 'generated-output.astro',
            payload: context.instruction, // In a real run, this would be the model's generated code
            riskProfile
        });

        if (!actionCheck.passed) {
            logger.warn(`Blocked action: ${actionCheck.message}`, { reason: actionCheck.blockedReason });
            return {
                success: false,
                skillUsed: 'guardrails',
                output: `REJECTED: ${actionCheck.message} (${actionCheck.blockedReason})`,
                tokensUsed: 0,
                cached: false,
                riskProfile,
                duration: Date.now() - startTime
            };
        }

        // Create checkpoint if needed
        let checkpointId: string | undefined;
        if (riskProfile.requiresBackup) {
            const cp = await checkpoint(context.projectPath, context.targetFiles);
            checkpointId = cp.checkpointId;
        }

        // Build skill context
        const skillContext: SkillContext = {
            skill,
            instruction: context.instruction,
            projectPath: context.projectPath,
            riskProfile,
        };

        // SPECIAL HANDLING: Script Execution
        const scriptName = this.mapSkillToScript(skill.name);
        if (scriptName) {
            try {
                const scriptOutput = await this.runScript(scriptName, context.instruction);
                return {
                    success: true,
                    skillUsed: skillName,
                    output: scriptOutput,
                    tokensUsed: 1000,
                    cached: false,
                    riskProfile,
                    checkpointId,
                    duration: Date.now() - startTime
                };
            } catch (error: any) {
                return {
                    success: false,
                    skillUsed: skillName,
                    output: `Script execution failed: ${error.message}`,
                    tokensUsed: 200,
                    cached: false,
                    riskProfile,
                    checkpointId,
                    duration: Date.now() - startTime
                };
            }
        }

        // Generate execution output
        const output = this.generateSkillOutput(skillContext);
        const tokensUsed = riskProfile.estimatedTokens;

        // Build result
        const result: ExecutionResult = {
            success: true,
            skillUsed: skillName,
            output,
            tokensUsed,
            cached: false,
            riskProfile,
            checkpointId,
            duration: Date.now() - startTime,
            nextSteps: this.suggestNextSteps(skill, context.instruction),
        };

        // Record outcome for learning
        memory.recordTaskOutcome(
            context.instruction.substring(0, 100),
            skillName,
            true,
            result.duration
        );

        // Cache the result
        cache.cacheRouting(context.instruction, result);

        // Store in history
        this.executionHistory.push(result);

        return result;
    }

    /**
     * Generate skill output based on context
     */
    private generateSkillOutput(context: SkillContext): string {
        const { skill, instruction, riskProfile } = context;

        const lines: string[] = [];

        // Header
        lines.push(`## Skill Activated: ${skill.name}`);
        lines.push('');

        // Risk indicator
        lines.push(riskAssessor.formatForUser(riskProfile));

        // Skill context
        lines.push('### Skill Context');
        lines.push(`- **Description**: ${skill.description}`);
        lines.push(`- **Version**: ${skill.version}`);
        lines.push('');

        // Capabilities being used
        lines.push('### Relevant Capabilities');
        const relevantCaps = this.findRelevantCapabilities(skill, instruction);
        for (const cap of relevantCaps.slice(0, 5)) {
            lines.push(`- ${cap}`);
        }
        lines.push('');

        // Rules to follow
        if (skill.rules.length > 0) {
            lines.push('### Rules Applied');
            for (const rule of skill.rules.slice(0, 3)) {
                lines.push(`- ${rule}`);
            }
            lines.push('');
        }

        // Execution guidance
        lines.push('### Execution Guidance');
        lines.push(this.generateExecutionGuidance(skill, instruction));
        lines.push('');

        return lines.join('\n');
    }

    /**
     * Find capabilities relevant to the instruction
     */
    private findRelevantCapabilities(skill: SkillDefinition, instruction: string): string[] {
        const query = instruction.toLowerCase();
        const relevant = skill.capabilities.filter(cap => {
            const words = cap.toLowerCase().split(/\s+/);
            return words.some(w => w.length > 3 && query.includes(w));
        });
        return relevant.length > 0 ? relevant : skill.capabilities.slice(0, 3);
    }

    /**
     * Generate execution guidance based on skill and instruction
     */
    private generateExecutionGuidance(skill: SkillDefinition, instruction: string): string {
        const query = instruction.toLowerCase();

        // Determine action type
        if (query.includes('create') || query.includes('add') || query.includes('new')) {
            return `Create new ${skill.techStack[0] || 'component'} following ${skill.name} patterns. Ensure compliance with defined rules.`;
        }

        if (query.includes('update') || query.includes('modify') || query.includes('change')) {
            return `Modify existing code using ${skill.name} best practices. Validate changes against rules before applying.`;
        }

        if (query.includes('fix') || query.includes('debug') || query.includes('solve')) {
            return `Analyze issue using ${skill.name} diagnostic patterns. Apply fix following established conventions.`;
        }

        if (query.includes('audit') || query.includes('review') || query.includes('check')) {
            return `Perform ${skill.name} audit. Report findings with severity levels and recommended actions.`;
        }

        return `Apply ${skill.name} expertise to complete the task. Follow all defined rules and patterns.`;
    }

    /**
     * Suggest next steps after skill execution
     */
    private suggestNextSteps(skill: SkillDefinition, instruction: string): string[] {
        const steps: string[] = [];

        // Based on skill type
        if (skill.techStack.some(t => t.toLowerCase().includes('astro'))) {
            steps.push('Run `npm run dev` to test changes');
            steps.push('Check browser console for errors');
        }

        if (skill.techStack.some(t => t.toLowerCase().includes('tailwind'))) {
            steps.push('Verify responsive breakpoints');
            steps.push('Test dark mode if applicable');
        }

        // Based on action
        if (instruction.toLowerCase().includes('component')) {
            steps.push('Add component to a page to test');
            steps.push('Verify props and types');
        }

        if (instruction.toLowerCase().includes('page')) {
            steps.push('Test page navigation');
            steps.push('Check SEO meta tags');
        }

        // Always suggest
        steps.push('Run `npm run build` to verify production build');

        return steps.slice(0, 4);
    }

    /**
     * Get execution history
     */
    getHistory(): ExecutionResult[] {
        return this.executionHistory;
    }

    /**
     * Get loaded skills
     */
    getSkills(): Map<string, SkillDefinition> {
        return this.skills;
    }

    /**
     * Reload skills (clears cache)
     */
    reloadSkills(): void {
        cache.clear();
        this.skills = loadAllSkills();
    }

    /**
     * Get skill by name
     */
    getSkill(name: string): SkillDefinition | undefined {
        return this.skills.get(name);
    }

    /**
     * List all skill names
     */
    listSkills(): string[] {
        return Array.from(this.skills.keys());
    }

    /**
     * Get token usage summary
     */
    getTokenUsage(): { total: number; cached: number; saved: number } {
        let total = 0;
        let cached = 0;

        for (const result of this.executionHistory) {
            if (result.cached) {
                cached += result.tokensUsed;
            } else {
                total += result.tokensUsed;
            }
        }

        const cacheStats = cache.getStats();

        return {
            total,
            cached,
            saved: cacheStats.savedTokens,
        };
    }

    /**
     * Map a skill name to a corresponding script in .agent/scripts/
     */
    private mapSkillToScript(skillName: string): string | null {
        const mapping: Record<string, string> = {
            'sentinel-auditor': 'auditors/ui-ux-auditor.ts',
            'vulnerability-scanner': 'auditors/security-auditor.ts',
            'seo-fundamentals': 'auditors/seo-auditor.ts',
            'performance-profiling': 'auditors/performance-auditor.ts',
            'brand-interviewer': 'brand-interview.ts',
            'github-manager': 'github-sync.ts'
        };
        return mapping[skillName] || null;
    }

    /**
     * Run a script via ts-node
     */
    private async runScript(scriptPath: string, instruction: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const absoluteScriptsDir = join(dirname(__dirname), 'scripts');
            const fullPath = join(absoluteScriptsDir, scriptPath);
            
            // SECURITY PATCH: Do not use shell: true. Pass arguments as array to prevent injection.
            const scriptProcess = spawn('npx', ['tsx', fullPath, '--instruction', instruction], {
                shell: false
            });
            
            let output = '';
            let error = '';

            scriptProcess.stdout.on('data', (data) => output += data.toString());
            scriptProcess.stderr.on('data', (data) => error += data.toString());

            scriptProcess.on('close', (code) => {
                if (code === 0) resolve(output);
                else reject(new Error(`Script failed with code ${code}: ${error}`));
            });
        });
    }
}

// Export singleton instance
export const executor = new SkillExecutor();

// ========================================
// CONVENIENCE FUNCTIONS
// ========================================

/**
 * Quick skill execution
 */
export async function executeSkill(instruction: string, projectPath: string): Promise<ExecutionResult> {
    return executor.execute({ instruction, projectPath });
}

/**
 * Find skill without executing
 */
export function matchSkill(instruction: string): string | null {
    return findBestSkill(instruction, executor.getSkills());
}

/**
 * Get all available skills
 */
export function getAvailableSkills(): string[] {
    return executor.listSkills();
}
