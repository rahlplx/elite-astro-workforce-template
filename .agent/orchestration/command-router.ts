/**
 * Slash Command Router
 *
 * Handles slash command detection and routing from Antigravity Kit patterns.
 * Zero-configuration usage with automatic agent selection.
 *
 * @module orchestration/command-router
 */

import { analyzeRequest, RoutingDecision } from './router.js';

export interface SlashCommand {
    name: string;
    description: string;
    agents: string[];
    workflow: string;
    requiresSocraticGate: boolean;
}

/**
 * Available slash commands
 */
export const SLASH_COMMANDS: Record<string, SlashCommand> = {
    brainstorm: {
        name: 'brainstorm',
        description: 'Explore design options and generate ideas',
        agents: ['brainstorming', 'architecture', 'design-expert'],
        workflow: 'brainstorm-workflow',
        requiresSocraticGate: true
    },
    create: {
        name: 'create',
        description: 'Build new features with full scaffolding',
        agents: ['app-builder', 'frontend-specialist', 'backend-specialist'],
        workflow: 'create-workflow',
        requiresSocraticGate: true
    },
    debug: {
        name: 'debug',
        description: 'Systematic troubleshooting workflow',
        agents: ['systematic-debugging', 'sentinel-auditor'],
        workflow: 'debug-workflow',
        requiresSocraticGate: false
    },
    plan: {
        name: 'plan',
        description: 'Task decomposition and planning',
        agents: ['plan-writing', 'architecture', 'brainstorming'],
        workflow: 'plan-workflow',
        requiresSocraticGate: true
    },
    test: {
        name: 'test',
        description: 'Generate and run tests',
        agents: ['tdd-workflow', 'testing-patterns', 'webapp-testing'],
        workflow: 'test-workflow',
        requiresSocraticGate: false
    },
    enhance: {
        name: 'enhance',
        description: 'Improve existing code quality',
        agents: ['clean-code', 'performance-profiling', 'code-review-checklist'],
        workflow: 'enhance-workflow',
        requiresSocraticGate: false
    },
    deploy: {
        name: 'deploy',
        description: 'Production deployment workflow',
        agents: ['deployment-procedures', 'cicd-automation', 'production-monitoring'],
        workflow: 'deploy-workflow',
        requiresSocraticGate: false
    },
    orchestrate: {
        name: 'orchestrate',
        description: 'Multi-agent coordination',
        agents: ['intelligent-routing', 'elite-core'],
        workflow: 'orchestrate-workflow',
        requiresSocraticGate: true
    },
    audit: {
        name: 'audit',
        description: 'Full project audit',
        agents: ['sentinel-auditor', 'vulnerability-scanner', 'seo-fundamentals'],
        workflow: 'audit-workflow',
        requiresSocraticGate: false
    },
    status: {
        name: 'status',
        description: 'Project health check',
        agents: ['elite-core'],
        workflow: 'status-workflow',
        requiresSocraticGate: false
    }
};

/**
 * Detect if message is a slash command
 */
export function detectSlashCommand(message: string): SlashCommand | null {
    const trimmed = message.trim();

    if (!trimmed.startsWith('/')) {
        return null;
    }

    const match = trimmed.match(/^\/(\w+)/);
    if (!match) {
        return null;
    }

    const commandName = match[1].toLowerCase();
    return SLASH_COMMANDS[commandName] || null;
}

/**
 * Extract arguments from slash command
 */
export function extractCommandArgs(message: string): string {
    return message.replace(/^\/\w+\s*/, '').trim();
}

/**
 * Route a message - handles both slash commands and natural language
 */
export function routeMessage(message: string): {
    type: 'command' | 'natural';
    command?: SlashCommand;
    args?: string;
    routing?: RoutingDecision;
} {
    const command = detectSlashCommand(message);

    if (command) {
        return {
            type: 'command',
            command,
            args: extractCommandArgs(message)
        };
    }

    // Fall back to intelligent routing
    const routing = analyzeRequest(message);

    return {
        type: 'natural',
        routing
    };
}

/**
 * Format command help
 */
export function getCommandHelp(): string {
    const commands = Object.values(SLASH_COMMANDS)
        .map(cmd => `  /${cmd.name.padEnd(12)} - ${cmd.description}`)
        .join('\n');

    return `
## Available Slash Commands

${commands}

**Usage:** Type a command followed by your request
**Example:** /create user authentication system
`.trim();
}

/**
 * Format command execution header
 */
export function formatCommandHeader(command: SlashCommand, args: string): string {
    const agentList = command.agents.slice(0, 3).map(a => `\`@${a}\``).join(' + ');

    return `
🎯 **/${command.name}** ${args}

Applying: ${agentList}
${command.requiresSocraticGate ? '📋 Socratic Gate: Active' : ''}
${'─'.repeat(50)}
`.trim();
}

/**
 * Get workflow steps for a command
 */
export function getWorkflowSteps(command: SlashCommand): string[] {
    const workflows: Record<string, string[]> = {
        'brainstorm-workflow': [
            'Analyze request with multi-domain BM25 search',
            'Generate 3-5 design options with trade-offs',
            'Present anti-patterns to avoid',
            'Ask clarifying questions (Socratic Gate)',
            'Output decision matrix with recommendations'
        ],
        'create-workflow': [
            'Trigger Socratic Gate if requirements unclear',
            'Detect project type and stack',
            'Generate scaffolding using templates',
            'Create implementation with tests',
            'Verify with lint/build'
        ],
        'debug-workflow': [
            'Reproduce the issue',
            'Isolate to specific component/function',
            'Identify root cause',
            'Implement fix',
            'Verify fix works',
            'Add regression test'
        ],
        'plan-workflow': [
            'Analyze request complexity',
            'Break into subtasks (max 5 per level)',
            'Identify dependencies between tasks',
            'Estimate effort (T-shirt sizing)',
            'Create todo.md entries'
        ],
        'test-workflow': [
            'Analyze code to test',
            'Determine test type (unit/integration/e2e)',
            'Generate test cases',
            'Run tests',
            'Report coverage'
        ],
        'enhance-workflow': [
            'Analyze current code',
            'Identify improvement areas',
            'Propose specific improvements',
            'Implement after approval',
            'Verify no regressions'
        ],
        'deploy-workflow': [
            'Pre-flight checks (tests, lint, build)',
            'Environment verification',
            'Deploy to staging',
            'Production deployment',
            'Post-deploy verification'
        ],
        'orchestrate-workflow': [
            'Analyze request with intelligent-routing',
            'Select appropriate agents',
            'Execute in sequence or parallel',
            'Aggregate results',
            'Present unified output'
        ],
        'audit-workflow': [
            'Security audit',
            'Performance audit',
            'SEO audit',
            'Code quality audit',
            'Generate report with priorities'
        ],
        'status-workflow': [
            'Git status and recent commits',
            'Test status',
            'Build status',
            'Dependency check',
            'Memory signals summary'
        ]
    };

    return workflows[command.workflow] || [];
}

export default {
    SLASH_COMMANDS,
    detectSlashCommand,
    extractCommandArgs,
    routeMessage,
    getCommandHelp,
    formatCommandHeader,
    getWorkflowSteps
};
