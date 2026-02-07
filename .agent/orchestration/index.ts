/**
 * Elite Workforce - Main Orchestrator
 *
 * Central hub that coordinates all systems:
 * - Router (intelligent request analysis)
 * - Executor (skill execution with caching)
 * - Risk Assessor (safety and checkpoints)
 * - Memory (learning and persistence)
 * - Cache (token optimization)
 *
 * @module orchestration
 */

import { analyzeRequest, formatRoutingDecision, type RoutingDecision } from './router.js';
import { executor, type ExecutionResult, type ExecutionContext } from './executor.js';
import { riskAssessor, assessRisk, type RiskProfile } from './risk-assessor.js';
import { memory } from './memory.js';
import { cache } from './cache.js';
import { bootstrapProject, type ProjectProfile } from '../scripts/bootstrap.js';

// ========================================
// TYPES & INTERFACES
// ========================================

export interface OrchestrationResult {
    success: boolean;
    mode: 'single' | 'swarm' | 'sequential' | 'audit' | 'bootstrap';
    agents: string[];
    skillResult?: ExecutionResult;
    riskProfile: RiskProfile;
    message: string;
    tokensSaved: number;
    cached: boolean;
    nextSteps?: string[];
}

export interface OrchestrationOptions {
    projectPath?: string;
    autoAudit?: boolean;
    skipCache?: boolean;
    forceConfirmation?: boolean;
}

// ========================================
// MAIN ORCHESTRATOR
// ========================================

/**
 * Main orchestration function - entry point for all requests
 */
export async function orchestrate(
    userRequest: string,
    options: OrchestrationOptions = {}
): Promise<OrchestrationResult> {
    const projectPath = options.projectPath || process.cwd();

    console.log('🚀 Elite Workforce: Processing request...\n');

    // Step 1: Check for special commands
    const specialResult = await handleSpecialCommands(userRequest, projectPath);
    if (specialResult) {
        return specialResult;
    }

    // Step 2: Assess risk first
    const riskProfile = assessRisk(userRequest);
    console.log(riskAssessor.formatForUser(riskProfile));

    // Step 3: Block dangerous operations
    if (riskProfile.level === 'BLOCKED') {
        return {
            success: false,
            mode: 'single',
            agents: [],
            riskProfile,
            message: `🚫 BLOCKED: ${riskProfile.blockedReason}`,
            tokensSaved: riskProfile.estimatedTokens,
            cached: false,
        };
    }

    // Step 4: Analyze and route
    const routing = analyzeRequest(userRequest);
    console.log(formatRoutingDecision(routing));
    console.log('');

    // Step 5: Record in memory
    memory.addMessage('user', userRequest);
    routing.agents.forEach(agent => memory.recordAgentUsage(agent));

    // Step 6: Execute based on mode
    const context: ExecutionContext = {
        instruction: userRequest,
        projectPath,
        userPreferences: memory.getPreferences(),
    };

    const skillResult = await executor.execute(context);

    // Step 7: Build result
    const cacheStats = cache.getStats();
    const result: OrchestrationResult = {
        success: skillResult.success,
        mode: routing.mode as 'single' | 'swarm' | 'sequential',
        agents: routing.agents,
        skillResult,
        riskProfile,
        message: generateMessage(routing, skillResult),
        tokensSaved: cacheStats.savedTokens,
        cached: skillResult.cached,
        nextSteps: skillResult.nextSteps,
    };

    // Step 8: Record outcome
    memory.addMessage('agent', result.message, skillResult.skillUsed);

    // Step 9: Display result
    displayResult(result);

    return result;
}

/**
 * Handle special commands like audit, bootstrap, rollback
 */
async function handleSpecialCommands(
    request: string,
    projectPath: string
): Promise<OrchestrationResult | null> {
    const query = request.toLowerCase();

    // Bootstrap / Initialize
    if (query.includes('bootstrap') || query.includes('initialize') || query.includes('scan project')) {
        console.log('🔍 Running project bootstrap...\n');
        const profile = await bootstrapProject(projectPath);

        return {
            success: true,
            mode: 'bootstrap',
            agents: ['project-scanner'],
            riskProfile: assessRisk('audit project'),
            message: `Project bootstrapped: ${profile.name} - Health: ${profile.health.overall}/100`,
            tokensSaved: 0,
            cached: false,
            nextSteps: profile.recommendations,
        };
    }

    // Full audit
    if (query.includes('audit') && (query.includes('full') || query.includes('project') || query.includes('my'))) {
        console.log('🔬 Running full audit...\n');
        const profile = await bootstrapProject(projectPath);

        return {
            success: true,
            mode: 'audit',
            agents: ['sentinel-auditor', 'design-expert', 'astro-oracle'],
            riskProfile: assessRisk('audit project'),
            message: generateAuditMessage(profile),
            tokensSaved: 0,
            cached: false,
            nextSteps: [
                'Fix auto-fixable issues',
                'Review warnings',
                'Address accessibility concerns',
            ],
        };
    }

    // Rollback
    if (query.includes('rollback') || query.includes('undo') || query.includes('revert')) {
        const lastCheckpoint = riskAssessor.getLastCheckpoint();
        if (!lastCheckpoint) {
            return {
                success: false,
                mode: 'single',
                agents: [],
                riskProfile: assessRisk('rollback'),
                message: 'No checkpoint available for rollback.',
                tokensSaved: 0,
                cached: false,
            };
        }

        const rollbackResult = await riskAssessor.rollback(lastCheckpoint, projectPath);
        return {
            success: rollbackResult.success,
            mode: 'single',
            agents: ['checkpoint-manager'],
            riskProfile: assessRisk('rollback'),
            message: rollbackResult.message,
            tokensSaved: 0,
            cached: false,
        };
    }

    // Cache stats
    if (query.includes('cache') && (query.includes('stats') || query.includes('status'))) {
        const stats = cache.getStats();
        return {
            success: true,
            mode: 'single',
            agents: ['cache-manager'],
            riskProfile: assessRisk('view cache'),
            message: `Cache Stats: ${stats.hitRate} hit rate, ${stats.savedTokens} tokens saved, ${stats.size} entries`,
            tokensSaved: stats.savedTokens,
            cached: false,
        };
    }

    return null;
}

/**
 * Generate user-friendly message
 */
function generateMessage(routing: RoutingDecision, result: ExecutionResult): string {
    if (!result.success) {
        return `❌ ${result.output}`;
    }

    if (result.cached) {
        return `⚡ ${result.skillUsed} (cached) - ${routing.agents.join(', ')}`;
    }

    return `✅ ${result.skillUsed} executed - ${result.duration}ms`;
}

/**
 * Generate audit summary message
 */
function generateAuditMessage(profile: ProjectProfile): string {
    const { auditResults, health } = profile;
    return `Audit Complete: Health ${health.overall}/100 | ` +
        `❌ ${auditResults.issues.length} issues | ` +
        `⚠️ ${auditResults.warnings.length} warnings | ` +
        `🔧 ${auditResults.autoFixable.length} auto-fixable`;
}

/**
 * Display result to user
 */
function displayResult(result: OrchestrationResult): void {
    console.log('\n');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log(`║  ${result.riskProfile.emoji}  ${result.message.substring(0, 55).padEnd(55)} ║`);
    console.log('╠══════════════════════════════════════════════════════════════╣');

    if (result.cached) {
        console.log('║  ⚡ Result from cache (0 tokens used)                        ║');
    }

    if (result.tokensSaved > 0) {
        console.log(`║  💰 Tokens saved: ${String(result.tokensSaved).padEnd(43)} ║`);
    }

    if (result.nextSteps && result.nextSteps.length > 0) {
        console.log('╠══════════════════════════════════════════════════════════════╣');
        console.log('║  Next Steps:                                                 ║');
        for (const step of result.nextSteps.slice(0, 3)) {
            console.log(`║  • ${step.substring(0, 58).padEnd(58)} ║`);
        }
    }

    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');
}

// ========================================
// CONVENIENCE EXPORTS
// ========================================

export { memory } from './memory.js';
export { cache } from './cache.js';
export { executor } from './executor.js';
export { riskAssessor, assessRisk, checkpoint, rollbackLast } from './risk-assessor.js';
export { analyzeRequest } from './router.js';
export { bootstrapProject } from '../scripts/bootstrap.js';
// 2026 Best Practice Infrastructure
export { Guardrails, guardrails } from './guardrails.js';
export { logger, type LogLevel, type LogEntry } from './logger.js';
export { handoff, type HandoffMessage, type HandoffResult } from './handoff.js';
export { TeamManager } from './team-manager.js';

// NEW: Enhanced orchestration from learning sources
// Source: UI UX Pro Max, Claude-Supermemory, AI Workflow Gist, Antigravity Kit
export { signalCapture, SignalCaptureManager, SIGNAL_KEYWORDS } from './signal-capture.js';
export { recordLesson, searchLessons, checkForSimilarLessons } from './self-improvement.js';
export { detectSlashCommand, routeMessage, SLASH_COMMANDS, getCommandHelp } from './command-router.js';
export { EliteOrchestrator, orchestrator } from './elite-orchestrator.js';

/**
 * Get memory statistics
 */
export function getMemoryStats() {
    const context = memory.getContext();
    const prefs = memory.getPreferences();
    const learning = memory.getLearningData();
    const cacheStats = cache.getStats();

    return {
        sessionId: context.sessionId,
        messageCount: context.messages.length,
        completedTasks: context.completedTasks.length,
        mostUsedAgent: Object.entries((prefs.preferredAgents || {}) as unknown as Record<string, number>)
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 'none',
        totalTaskOutcomes: learning.taskOutcomes.length,
        successRate: calculateSuccessRate(learning.taskOutcomes),
        cache: cacheStats as unknown as Record<string, unknown>,
        tokenUsage: executor.getTokenUsage(),
    };
}

function calculateSuccessRate(outcomes: Array<{ success: boolean }>): string {
    if (outcomes.length === 0) return '0%';
    const successful = outcomes.filter(o => o.success).length;
    return `${Math.round((successful / outcomes.length) * 100)}%`;
}

/**
 * Quick orchestration for simple requests
 */
export async function run(request: string): Promise<OrchestrationResult> {
    return orchestrate(request);
}

/**
 * Get all available skills
 */
export function getSkills(): string[] {
    return executor.listSkills();
}

/**
 * Clear all caches and memory
 */
export function reset(): void {
    cache.clear();
    memory.clear();
    console.log('🔄 All caches and memory cleared');
}
