/**
 * Elite Workforce - Advanced Risk Assessment System
 *
 * Provides comprehensive risk analysis with:
 * - Risk Meter (🟢🟡🟠🔴⛔)
 * - Git checkpoint before risky operations
 * - User confirmation for dangerous actions
 * - Rollback capability
 * - Token-aware operation sizing
 *
 * @module orchestration/risk-assessor
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = join(__dirname, 'backups');

// ========================================
// TYPES & INTERFACES
// ========================================

export type RiskLevel = 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'BLOCKED';

export interface RiskProfile {
    level: RiskLevel;
    score: number;          // 0-100
    emoji: string;          // Visual indicator
    description: string;    // Human-readable
    requiresConfirmation: boolean;
    requiresBackup: boolean;
    blockedReason?: string;
    mitigations: string[];
    estimatedTokens: number;
}

export interface OperationContext {
    instruction: string;
    targetFiles?: string[];
    projectPath?: string;
    previousErrors?: string[];
}

export interface CheckpointResult {
    success: boolean;
    checkpointId: string;
    timestamp: string;
    filesBackedUp: string[];
    gitStash?: string;
    message: string;
}

export interface RollbackResult {
    success: boolean;
    checkpointId: string;
    filesRestored: string[];
    message: string;
}

// ========================================
// RISK PATTERNS
// ========================================

const BLOCKED_PATTERNS = [
    { pattern: /rm\s+-rf\s+[\/\\]/, reason: 'Recursive deletion of root directory' },
    { pattern: /rm\s+-rf\s+\.\./, reason: 'Deletion of parent directory' },
    { pattern: /format\s+[cC]:/, reason: 'Formatting system drive' },
    { pattern: />(\/dev\/null|nul)\s*2>&1.*rm/, reason: 'Silent destructive operation' },
    { pattern: /git\s+push\s+.*--force\s+origin\s+(main|master)/, reason: 'Force push to protected branch' },
    { pattern: /DROP\s+DATABASE/i, reason: 'Database deletion' },
    { pattern: /TRUNCATE\s+TABLE/i, reason: 'Table truncation' },
    { pattern: /\.env.*secret|password|api.?key/i, reason: 'Potential secret exposure' },
];

const CRITICAL_PATTERNS = [
    /delete|remove all|rm\s|unlink/i,
    /drop\s|truncate/i,
    /force|--force|-f\s+push/i,
    /reset\s+--hard/i,
    /checkout\s+\./i,
    /clean\s+-fd/i,
    /\.env|credentials|secrets?/i,
    /sudo|admin|root/i,
    /format|wipe|destroy/i,
];

const HIGH_PATTERNS = [
    /config|configuration/i,
    /auth|login|password|session/i,
    /header|footer|layout|template/i,
    /database|migration|schema/i,
    /deploy|publish|release/i,
    /package\.json|tsconfig|astro\.config/i,
    /global|base|root/i,
    /api|endpoint|route/i,
];

const MEDIUM_PATTERNS = [
    /refactor|restructure|reorganize/i,
    /update|modify|change|edit/i,
    /component|page|module/i,
    /import|export|interface|type/i,
    /logic|function|method/i,
    /content|collection|data/i,
];

const LOW_PATTERNS = [
    /style|css|tailwind|color/i,
    /text|label|copy|content/i,
    /padding|margin|spacing/i,
    /image|icon|asset/i,
    /class|className/i,
];

const SAFE_PATTERNS = [
    /analyze|audit|check|scan|inspect/i,
    /read|view|show|display|list/i,
    /find|search|grep|locate/i,
    /explain|describe|document/i,
    /status|info|version/i,
];

// ========================================
// RISK ASSESSOR CLASS
// ========================================

export class RiskAssessor {
    private checkpointHistory: Map<string, CheckpointResult> = new Map();

    constructor() {
        if (!existsSync(BACKUP_DIR)) {
            mkdirSync(BACKUP_DIR, { recursive: true });
        }
    }

    // ========================================
    // MAIN RISK ANALYSIS
    // ========================================

    /**
     * Comprehensive risk analysis of an instruction
     */
    analyze(context: OperationContext): RiskProfile {
        const { instruction } = context;

        // Check for blocked operations first
        for (const blocked of BLOCKED_PATTERNS) {
            if (blocked.pattern.test(instruction)) {
                return this.createBlockedProfile(blocked.reason);
            }
        }

        // Analyze risk level
        let score = this.calculateRiskScore(instruction);
        let level = this.scoreToLevel(score);

        // Adjust based on context
        if (context.targetFiles?.some(f => this.isCriticalFile(f))) {
            score = Math.min(100, score + 20);
            level = this.scoreToLevel(score);
        }

        if (context.previousErrors && context.previousErrors.length > 2) {
            score = Math.min(100, score + 15);
            level = this.scoreToLevel(score);
        }

        // Build profile
        return {
            level,
            score,
            emoji: this.levelToEmoji(level),
            description: this.getDescription(level, instruction),
            requiresConfirmation: score >= 60,
            requiresBackup: score >= 40,
            mitigations: this.getMitigations(level, context),
            estimatedTokens: this.estimateTokenUsage(instruction),
        };
    }

    /**
     * Calculate numerical risk score (0-100)
     */
    private calculateRiskScore(instruction: string): number {
        let score = 30; // Base score

        // Check patterns
        if (SAFE_PATTERNS.some(p => p.test(instruction))) score -= 25;
        if (LOW_PATTERNS.some(p => p.test(instruction))) score += 5;
        if (MEDIUM_PATTERNS.some(p => p.test(instruction))) score += 20;
        if (HIGH_PATTERNS.some(p => p.test(instruction))) score += 35;
        if (CRITICAL_PATTERNS.some(p => p.test(instruction))) score += 50;

        // Modifier checks
        if (instruction.length > 500) score += 10; // Long/complex instruction
        if (/\ball\b|\beverywhere\b|\brecursive/i.test(instruction)) score += 15;
        if (/\bundo\b|\brevert\b|\brollback/i.test(instruction)) score -= 10;

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Convert score to risk level
     */
    private scoreToLevel(score: number): RiskLevel {
        if (score >= 90) return 'CRITICAL';
        if (score >= 70) return 'HIGH';
        if (score >= 50) return 'MEDIUM';
        if (score >= 25) return 'LOW';
        return 'SAFE';
    }

    /**
     * Get emoji for risk level
     */
    private levelToEmoji(level: RiskLevel): string {
        switch (level) {
            case 'SAFE': return '🟢';
            case 'LOW': return '🟡';
            case 'MEDIUM': return '🟠';
            case 'HIGH': return '🔴';
            case 'CRITICAL': return '⛔';
            case 'BLOCKED': return '🚫';
        }
    }

    /**
     * Create blocked profile
     */
    private createBlockedProfile(reason: string): RiskProfile {
        return {
            level: 'BLOCKED',
            score: 100,
            emoji: '🚫',
            description: `BLOCKED: ${reason}`,
            requiresConfirmation: false,
            requiresBackup: false,
            blockedReason: reason,
            mitigations: ['This operation is not allowed for safety reasons.'],
            estimatedTokens: 0,
        };
    }

    /**
     * Get human-readable description
     */
    private getDescription(level: RiskLevel, _instruction: string): string {
        switch (level) {
            case 'SAFE':
                return `Safe operation: Read-only or analysis task.`;
            case 'LOW':
                return `Low risk: Minor visual or content changes.`;
            case 'MEDIUM':
                return `Medium risk: Code modifications that may affect behavior.`;
            case 'HIGH':
                return `High risk: Core system or configuration changes.`;
            case 'CRITICAL':
                return `Critical risk: Potentially destructive or irreversible operation.`;
            default:
                return `Unknown operation type.`;
        }
    }

    /**
     * Check if file is critical
     */
    private isCriticalFile(filePath: string): boolean {
        const critical = [
            'package.json',
            'tsconfig.json',
            'astro.config',
            '.env',
            'AGENTS.md',
            'MANIFEST.md',
            'CONSTITUTION.md',
            'ELITE_PROTOCOL.md',
            'layout',
            'config',
        ];

        return critical.some(c => filePath.toLowerCase().includes(c));
    }

    /**
     * Get mitigation suggestions
     */
    private getMitigations(level: RiskLevel, context: OperationContext): string[] {
        const mitigations: string[] = [];

        if (level === 'CRITICAL' || level === 'HIGH') {
            mitigations.push('Git checkpoint will be created before execution');
            mitigations.push('Review changes carefully before confirming');
        }

        if (level === 'MEDIUM') {
            mitigations.push('Files will be backed up before modification');
        }

        if (context.targetFiles?.length) {
            mitigations.push(`Affects ${context.targetFiles.length} file(s)`);
        }

        return mitigations;
    }

    /**
     * Estimate token usage for operation
     */
    private estimateTokenUsage(instruction: string): number {
        // Base estimate: instruction tokens + response tokens
        const instructionTokens = Math.ceil(instruction.length / 4);
        const responseEstimate = 500; // Average response

        // Adjust based on operation type
        if (SAFE_PATTERNS.some(p => p.test(instruction))) {
            return instructionTokens + 200; // Read-only = smaller response
        }

        if (/create|build|generate|implement/i.test(instruction)) {
            return instructionTokens + 2000; // Code generation = larger response
        }

        return instructionTokens + responseEstimate;
    }

    // ========================================
    // CHECKPOINT & BACKUP SYSTEM
    // ========================================

    /**
     * Create a checkpoint before risky operations
     */
    async createCheckpoint(projectPath: string, files?: string[]): Promise<CheckpointResult> {
        const checkpointId = `checkpoint-${Date.now()}-${Math.random().toString(36).substring(7)}`;
        const checkpointDir = join(BACKUP_DIR, checkpointId);
        const timestamp = new Date().toISOString();
        const filesBackedUp: string[] = [];

        mkdirSync(checkpointDir, { recursive: true });

        // Try git stash first
        let gitStash: string | undefined;
        try {
            if (this.isGitRepo(projectPath)) {
                const stashResult = execSync('git stash push -m "Elite-Checkpoint-' + checkpointId + '"', {
                    cwd: projectPath,
                    encoding: 'utf-8',
                });
                if (!stashResult.includes('No local changes')) {
                    gitStash = checkpointId;
                }
            }
        } catch {
            // Git not available or failed, continue with file backup
        }

        // Backup specific files
        if (files && files.length > 0) {
            for (const file of files) {
                try {
                    const sourcePath = join(projectPath, file);
                    if (existsSync(sourcePath)) {
                        const destPath = join(checkpointDir, file.replace(/[\/\\]/g, '_'));
                        copyFileSync(sourcePath, destPath);
                        filesBackedUp.push(file);
                    }
                } catch {
                    // Skip failed files
                }
            }
        }

        // Save checkpoint metadata
        const result: CheckpointResult = {
            success: true,
            checkpointId,
            timestamp,
            filesBackedUp,
            gitStash,
            message: `Checkpoint created: ${filesBackedUp.length} files backed up${gitStash ? ' + git stash' : ''}`,
        };

        this.checkpointHistory.set(checkpointId, result);

        // Save metadata to disk
        writeFileSync(
            join(checkpointDir, 'metadata.json'),
            JSON.stringify(result, null, 2)
        );

        return result;
    }

    /**
     * Rollback to a checkpoint
     */
    async rollback(checkpointId: string, projectPath: string): Promise<RollbackResult> {
        const checkpointDir = join(BACKUP_DIR, checkpointId);
        const filesRestored: string[] = [];

        if (!existsSync(checkpointDir)) {
            return {
                success: false,
                checkpointId,
                filesRestored: [],
                message: `Checkpoint ${checkpointId} not found`,
            };
        }

        // Load metadata
        const metadataPath = join(checkpointDir, 'metadata.json');
        const metadata: CheckpointResult = JSON.parse(readFileSync(metadataPath, 'utf-8'));

        // Restore git stash first
        if (metadata.gitStash) {
            try {
                execSync('git stash pop', { cwd: projectPath, encoding: 'utf-8' });
            } catch {
                // Stash may have conflicts, try apply
                try {
                    execSync('git stash apply', { cwd: projectPath, encoding: 'utf-8' });
                } catch {
                    // Continue with file restoration
                }
            }
        }

        // Restore files
        for (const file of metadata.filesBackedUp) {
            try {
                const backupPath = join(checkpointDir, file.replace(/[\/\\]/g, '_'));
                const destPath = join(projectPath, file);

                if (existsSync(backupPath)) {
                    // Ensure directory exists
                    mkdirSync(dirname(destPath), { recursive: true });
                    copyFileSync(backupPath, destPath);
                    filesRestored.push(file);
                }
            } catch {
                // Skip failed restorations
            }
        }

        return {
            success: true,
            checkpointId,
            filesRestored,
            message: `Rollback complete: ${filesRestored.length} files restored`,
        };
    }

    /**
     * Get last checkpoint ID
     */
    getLastCheckpoint(): string | null {
        const checkpoints = Array.from(this.checkpointHistory.keys());
        return checkpoints.length > 0 ? checkpoints[checkpoints.length - 1] : null;
    }

    /**
     * Check if directory is a git repo
     */
    private isGitRepo(path: string): boolean {
        try {
            execSync('git rev-parse --git-dir', { cwd: path, stdio: 'ignore' });
            return true;
        } catch {
            return false;
        }
    }

    // ========================================
    // USER CONFIRMATION
    // ========================================

    /**
     * Format risk profile for user display
     */
    formatForUser(profile: RiskProfile): string {
        const lines: string[] = [];

        lines.push('');
        lines.push('╔════════════════════════════════════════════════════╗');
        lines.push(`║  ${profile.emoji}  RISK ASSESSMENT: ${profile.level.padEnd(10)} Score: ${profile.score}/100  ║`);
        lines.push('╠════════════════════════════════════════════════════╣');
        lines.push(`║  ${profile.description.substring(0, 50).padEnd(50)}  ║`);

        if (profile.requiresBackup) {
            lines.push('║  📦 Backup will be created                         ║');
        }

        if (profile.requiresConfirmation) {
            lines.push('║  ⚠️  User confirmation required                     ║');
        }

        if (profile.mitigations.length > 0) {
            lines.push('╠════════════════════════════════════════════════════╣');
            lines.push('║  Mitigations:                                      ║');
            for (const m of profile.mitigations.slice(0, 3)) {
                lines.push(`║  • ${m.substring(0, 48).padEnd(48)}  ║`);
            }
        }

        lines.push('╚════════════════════════════════════════════════════╝');
        lines.push('');

        return lines.join('\n');
    }

    /**
     * Get confirmation prompt for risky operations
     */
    getConfirmationPrompt(profile: RiskProfile): string {
        if (profile.level === 'BLOCKED') {
            return `🚫 This operation is BLOCKED: ${profile.blockedReason}`;
        }

        if (profile.level === 'CRITICAL') {
            return '⛔ CRITICAL RISK: This operation may cause irreversible changes. Type "CONFIRM" to proceed.';
        }

        if (profile.level === 'HIGH') {
            return '🔴 HIGH RISK: This operation affects core system files. Proceed? (y/n)';
        }

        return '🟠 This operation requires confirmation. Proceed? (y/n)';
    }
}

// Export singleton instance
export const riskAssessor = new RiskAssessor();

// ========================================
// CONVENIENCE FUNCTIONS
// ========================================

/**
 * Quick risk check for an instruction
 */
export function assessRisk(instruction: string): RiskProfile {
    return riskAssessor.analyze({ instruction });
}

/**
 * Check if operation should proceed
 */
export function shouldProceed(profile: RiskProfile): boolean {
    return profile.level !== 'BLOCKED';
}

/**
 * Check if backup needed
 */
export function needsBackup(profile: RiskProfile): boolean {
    return profile.requiresBackup;
}

/**
 * Create checkpoint before operation
 */
export async function checkpoint(projectPath: string, files?: string[]): Promise<CheckpointResult> {
    return riskAssessor.createCheckpoint(projectPath, files);
}

/**
 * Rollback to last checkpoint
 */
export async function rollbackLast(projectPath: string): Promise<RollbackResult | null> {
    const lastId = riskAssessor.getLastCheckpoint();
    if (!lastId) return null;
    return riskAssessor.rollback(lastId, projectPath);
}
