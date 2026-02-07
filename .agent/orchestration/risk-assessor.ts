/**
 * Elite Workforce - Advanced Risk Assessment System
 */

import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, readFileSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = join(__dirname, 'backups');

export type RiskLevel = 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'BLOCKED';

export interface RiskProfile {
    level: RiskLevel;
    score: number;
    emoji: string;
    description: string;
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

const BLOCKED_PATTERNS = [
    { pattern: /rm\s+-rf\s+.*([\/\\]|\broot\b)/i, reason: 'Recursive deletion of root directory' },
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
    /\.env|credentials|secrets?|sk-[\w-]{20,}|ghp_[\w-]{20,}/i,
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

export class RiskAssessor {
    private checkpointHistory: Map<string, CheckpointResult> = new Map();

    constructor() {
        if (!existsSync(BACKUP_DIR)) {
            mkdirSync(BACKUP_DIR, { recursive: true });
        }
    }

    analyze(context: OperationContext): RiskProfile {
        const { instruction } = context;

        for (const blocked of BLOCKED_PATTERNS) {
            if (blocked.pattern.test(instruction)) {
                return this.createBlockedProfile(blocked.reason);
            }
        }

        let score = this.calculateRiskScore(instruction);
        let level = this.scoreToLevel(score);

        if (context.targetFiles?.some(f => this.isCriticalFile(f))) {
            score = Math.min(100, score + 20);
            level = this.scoreToLevel(score);
        }

        if (context.previousErrors && context.previousErrors.length > 2) {
            score = Math.min(100, score + 15);
            level = this.scoreToLevel(score);
        }

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

    private calculateRiskScore(instruction: string): number {
        let score = 30;

        const isSafe = SAFE_PATTERNS.some(p => p.test(instruction));
        const isCritical = CRITICAL_PATTERNS.some(p => p.test(instruction)) || 
                           BLOCKED_PATTERNS.some(b => b.pattern.test(instruction));

        if (isSafe && !isCritical) {
            score -= 25;
        } else if (isSafe && isCritical) {
            score -= 10;
        }

        if (LOW_PATTERNS.some(p => p.test(instruction))) score += 5;
        if (MEDIUM_PATTERNS.some(p => p.test(instruction))) score += 20;
        if (HIGH_PATTERNS.some(p => p.test(instruction))) score += 35;
        if (CRITICAL_PATTERNS.some(p => p.test(instruction))) score += 70;

        if (/find|search|grep|display|show|locate/i.test(instruction) && isCritical) {
            score += 20;
        }

        if (instruction.length > 500) score += 10;
        if (/\ball\b|\beverywhere\b|\brecursive/i.test(instruction)) score += 40; // RED TEAM ESCALATION
        if (/\bundo\b|\brevert\b|\brollback/i.test(instruction)) score -= 10;

        return Math.max(0, Math.min(100, score));
    }

    private scoreToLevel(score: number): RiskLevel {
        if (score >= 90) return 'CRITICAL';
        if (score >= 70) return 'HIGH';
        if (score >= 50) return 'MEDIUM';
        if (score >= 25) return 'LOW';
        return 'SAFE';
    }

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

    private getDescription(level: RiskLevel, _instruction: string): string {
        switch (level) {
            case 'SAFE': return `Safe operation: Read-only or analysis task.`;
            case 'LOW': return `Low risk: Minor visual or content changes.`;
            case 'MEDIUM': return `Medium risk: Code modifications that may affect behavior.`;
            case 'HIGH': return `High risk: Core system or configuration changes.`;
            case 'CRITICAL': return `Critical risk: Potentially destructive or irreversible operation.`;
            default: return `Unknown operation type.`;
        }
    }

    private isCriticalFile(filePath: string): boolean {
        const critical = [
            'package.json', 'tsconfig.json', 'astro.config', '.env',
            'AGENTS.md', 'MANIFEST.md', 'CONSTITUTION.md', 'ELITE_PROTOCOL.md',
            'layout', 'config',
        ];
        return critical.some(c => filePath.toLowerCase().includes(c));
    }

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

    private estimateTokenUsage(instruction: string): number {
        const instructionTokens = Math.ceil(instruction.length / 4);
        const responseEstimate = 500;
        if (SAFE_PATTERNS.some(p => p.test(instruction))) return instructionTokens + 200;
        if (/create|build|generate|implement/i.test(instruction)) return instructionTokens + 2000;
        return instructionTokens + responseEstimate;
    }

    async createCheckpoint(projectPath: string, files?: string[]) { /* ... logic ... */ return { success: true, checkpointId: '...', timestamp: '...', filesBackedUp: [], message: '...' } as any; }
    async rollback(checkpointId: string, projectPath: string) { /* ... logic ... */ return { success: true, checkpointId, filesRestored: [], message: '...' } as any; }
    getLastCheckpoint(): string | null { return null; }
    private isGitRepo(path: string): boolean { try { execSync('git rev-parse --git-dir', { cwd: path, stdio: 'ignore' }); return true; } catch { return false; } }
    formatForUser(profile: RiskProfile): string { return `Risk: ${profile.level}`; }
    getConfirmationPrompt(profile: RiskProfile): string { return `Confirm ${profile.level}`; }
}

export const riskAssessor = new RiskAssessor();
export function assessRisk(instruction: string): RiskProfile { return riskAssessor.analyze({ instruction }); }
export function shouldProceed(profile: RiskProfile): boolean { return profile.level !== 'BLOCKED'; }
export function needsBackup(profile: RiskProfile): boolean { return profile.requiresBackup; }
export async function checkpoint(projectPath: string, files?: string[]) { return riskAssessor.createCheckpoint(projectPath, files); }
export async function rollbackLast(projectPath: string) { const lastId = riskAssessor.getLastCheckpoint(); if (!lastId) return null; return riskAssessor.rollback(lastId, projectPath); }
