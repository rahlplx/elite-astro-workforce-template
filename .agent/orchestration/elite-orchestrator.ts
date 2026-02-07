/**
 * Elite Orchestrator
 *
 * Comprehensive orchestration system combining learnings from:
 * - AI Workflow Orchestration Gist (plan mode, self-improvement)
 * - Claude-Supermemory (signal-based capture)
 * - UI UX Pro Max (multi-domain search, BM25 ranking)
 * - Antigravity Kit (slash commands, zero-config routing)
 *
 * @module orchestration/elite-orchestrator
 */

import { analyzeRequest, RoutingDecision, formatRoutingDecision } from './router.js';
import { memory, MemoryManager } from './memory.js';
import { signalCapture, SignalCaptureManager } from './signal-capture.js';
import { recordLesson, searchLessons, checkForSimilarLessons, Lesson } from './self-improvement.js';
import { detectSlashCommand, routeMessage, formatCommandHeader, getWorkflowSteps, SLASH_COMMANDS } from './command-router.js';
import { analyzeBrainstormRequest, formatBrainstormAnalysis, BrainstormContext } from '../skills/brainstorming/reasoning-engine.js';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export interface OrchestrationContext {
    sessionId: string;
    startedAt: string;
    mode: 'interactive' | 'autonomous' | 'plan';
    currentTask?: string;
    activeAgents: string[];
    history: OrchestrationEvent[];
}

export interface OrchestrationEvent {
    type: 'request' | 'routing' | 'execution' | 'completion' | 'error' | 'lesson';
    timestamp: string;
    data: Record<string, unknown>;
}

export interface OrchestrationResult {
    success: boolean;
    response: string;
    agentsUsed: string[];
    duration: number;
    memorySignals: number;
    lessonsApplied: number;
}

export interface SystemKnowledge {
    manifest: string;
    graph: string;
    tokens: string;
    lessons: string;
    protocol: string;
}

/**
 * Elite Orchestrator - Main orchestration engine
 */
export class EliteOrchestrator {
    private context: OrchestrationContext;
    private memory: MemoryManager;
    private signals: SignalCaptureManager;
    private systemKnowledge: SystemKnowledge | null = null;

    constructor() {
        this.memory = memory;
        this.signals = signalCapture;
        this.context = this.createContext();
    }

    /**
     * Load system knowledge for intent synchronization (PR-004)
     */
    private loadSystemKnowledge(): SystemKnowledge {
        if (this.systemKnowledge) return this.systemKnowledge;

        const agentRoot = join(__dirname, '..');
        const projectRoot = join(agentRoot, '..');

        const knowledge: SystemKnowledge = {
            manifest: this.loadFile(join(agentRoot, 'MANIFEST.md')),
            graph: this.loadFile(join(agentRoot, 'graph', 'agents.graph.json')),
            tokens: this.loadFile(join(projectRoot, 'ATLAS_TOKENS.md')),
            lessons: this.loadFile(join(agentRoot, 'memory', 'lessons_learned.json')),
            protocol: this.loadFile(join(agentRoot, 'rules', 'ELITE_PROTOCOL.md')),
        };

        this.systemKnowledge = knowledge;
        return knowledge;
    }

    private loadFile(path: string): string {
        try {
            return existsSync(path) ? readFileSync(path, 'utf8') : '';
        } catch {
            return '';
        }
    }

    /**
     * Process a user request through the full orchestration pipeline
     */
    async processRequest(userRequest: string): Promise<OrchestrationResult> {
        const startTime = Date.now();
        let lessonsApplied = 0;

        try {
            // 1. Intent Sync: Load system knowledge (PR-004)
            const knowledge = this.loadSystemKnowledge();
            console.log('📚 Intent Sync: Loaded MANIFEST, Graph, Tokens, Lessons, Protocol');

            // 2. Log the request
            this.logEvent('request', { content: userRequest, knowledgeLoaded: true });
            this.signals.addTurn('user', userRequest);

            // 3. Check for slash commands first
            const routeResult = routeMessage(userRequest);

            if (routeResult.type === 'command' && routeResult.command) {
                return this.executeSlashCommand(routeResult.command, routeResult.args || '', startTime);
            }

            // 3. Check for similar lessons before proceeding
            const lessonWarnings = checkForSimilarLessons(userRequest);
            if (lessonWarnings) {
                lessonsApplied = 1;
                console.log(lessonWarnings);
            }

            // 4. Analyze with multi-domain BM25 search
            const brainstormContext = analyzeBrainstormRequest(userRequest);

            // 5. Get routing decision
            const routing = routeResult.routing || analyzeRequest(userRequest);
            this.logEvent('routing', { decision: routing, brainstorm: brainstormContext });

            // 6. Determine if Socratic Gate should be triggered
            if (this.shouldTriggerSocraticGate(brainstormContext, routing)) {
                return this.triggerSocraticGate(brainstormContext, routing, startTime, lessonsApplied);
            }

            // 7. Execute with selected agents
            const response = await this.executeWithAgents(routing, userRequest);

            // 8. Capture signals from response
            this.signals.addTurn('agent', response);

            // 9. Record completion
            this.logEvent('completion', {
                success: true,
                agentsUsed: routing.agents,
                duration: Date.now() - startTime
            });

            return {
                success: true,
                response,
                agentsUsed: routing.agents,
                duration: Date.now() - startTime,
                memorySignals: this.signals.getStats().total,
                lessonsApplied
            };

        } catch (error) {
            this.logEvent('error', { error: String(error) });

            // Record error as lesson
            recordLesson({
                date: new Date().toISOString().split('T')[0],
                category: 'implementation',
                whatHappened: `Error processing request: ${userRequest.slice(0, 100)}`,
                rootCause: String(error),
                lessonLearned: 'Add error handling for this case',
                pattern: 'ERROR → ANALYZE → RECORD → PREVENT',
                tags: ['error', 'orchestration']
            });

            return {
                success: false,
                response: `Error: ${String(error)}`,
                agentsUsed: [],
                duration: Date.now() - startTime,
                memorySignals: 0,
                lessonsApplied: 0
            };
        }
    }

    /**
     * Execute a slash command
     */
    private async executeSlashCommand(
        command: typeof SLASH_COMMANDS[keyof typeof SLASH_COMMANDS],
        args: string,
        startTime: number
    ): Promise<OrchestrationResult> {
        const header = formatCommandHeader(command, args);
        const steps = getWorkflowSteps(command);

        this.logEvent('execution', {
            type: 'slash-command',
            command: command.name,
            args,
            agents: command.agents
        });

        // Build response with workflow steps
        let response = header + '\n\n';
        response += '## Workflow Steps\n\n';
        steps.forEach((step, i) => {
            response += `${i + 1}. ${step}\n`;
        });

        // Check for Socratic Gate requirement
        if (command.requiresSocraticGate && args.length < 50) {
            const brainstorm = analyzeBrainstormRequest(args);
            response += '\n\n' + formatBrainstormAnalysis(brainstorm);
        }

        this.signals.addTurn('agent', response);

        return {
            success: true,
            response,
            agentsUsed: command.agents,
            duration: Date.now() - startTime,
            memorySignals: this.signals.getStats().total,
            lessonsApplied: 0
        };
    }

    /**
     * Determine if Socratic Gate should be triggered
     */
    private shouldTriggerSocraticGate(
        brainstorm: BrainstormContext,
        routing: RoutingDecision
    ): boolean {
        // Trigger for complex tasks
        if (brainstorm.complexity === 'complex') return true;

        // Trigger for greenfield projects
        if (brainstorm.type === 'greenfield') return true;

        // Trigger if there are blocking decisions
        if (brainstorm.blockers.length > 0) return true;

        // Trigger for orchestrator mode
        if (routing.mode === 'swarm' || routing.mode === 'sequential') return true;

        return false;
    }

    /**
     * Trigger Socratic Gate for clarification
     */
    private triggerSocraticGate(
        brainstorm: BrainstormContext,
        routing: RoutingDecision,
        startTime: number,
        lessonsApplied: number
    ): OrchestrationResult {
        const analysis = formatBrainstormAnalysis(brainstorm);
        const routingInfo = formatRoutingDecision(routing);

        const response = `
🛑 **Socratic Gate Activated**

Before proceeding, I need to understand your requirements better.

${analysis}

${routingInfo}

---

## Questions Before Implementation

${brainstorm.blockers.map((b, i) => `
### ${i + 1}. ${b}

**Why This Matters:** This decision affects the architecture and cannot be easily changed later.

**Options:** [Need your input]

**If Not Specified:** I'll use a sensible default, but please confirm.
`).join('\n')}

Please answer these questions so I can proceed with the best approach.
`.trim();

        return {
            success: true,
            response,
            agentsUsed: ['brainstorming', 'intelligent-routing'],
            duration: Date.now() - startTime,
            memorySignals: this.signals.getStats().total,
            lessonsApplied
        };
    }

    /**
     * Execute request with selected agents
     */
    private async executeWithAgents(routing: RoutingDecision, request: string): Promise<string> {
        const agentList = routing.agents.map(a => `\`@${a}\``).join(' + ');

        let response = `🤖 **Applying: ${agentList}**\n\n`;

        if (routing.mode === 'sequential') {
            response += `📋 **Mode:** Sequential (agents work in order)\n\n`;
        } else if (routing.mode === 'swarm') {
            response += `📋 **Mode:** Swarm (agents work in parallel)\n\n`;
        }

        response += `**Priority:** ${routing.priority}\n\n`;
        response += `---\n\n`;

        // Simulate agent execution (in real use, this would invoke actual agents)
        response += `Processing request with ${routing.agents.length} specialist(s)...\n\n`;

        // Record agent usage in preferences
        for (const agent of routing.agents) {
            this.memory.recordAgentUsage(agent);
        }

        return response;
    }

    /**
     * Get current orchestration status
     */
    getStatus(): string {
        const memStats = this.signals.getStats();
        const lessonStats = this.getLessonStats();

        return `
## 📊 Orchestration Status

**Session:** ${this.context.sessionId}
**Started:** ${this.context.startedAt}
**Mode:** ${this.context.mode}
**Active Agents:** ${this.context.activeAgents.length > 0 ? this.context.activeAgents.join(', ') : 'None'}

### Memory Signals
- **Total:** ${memStats.total}
- **By Category:** ${Object.entries(memStats.byCategory).map(([k, v]) => `${k}: ${v}`).join(', ')}

### Lessons
- **Total:** ${lessonStats.total}
- **Recent Tags:** ${lessonStats.recentTags.slice(0, 5).join(', ') || 'None'}

### Available Commands
${Object.keys(SLASH_COMMANDS).map(c => `- /${c}`).join('\n')}
`.trim();
    }

    /**
     * Record a lesson from this session
     */
    recordSessionLesson(lesson: Omit<Lesson, 'date'>): void {
        recordLesson({
            ...lesson,
            date: new Date().toISOString().split('T')[0]
        });
    }

    // Private helpers

    private createContext(): OrchestrationContext {
        return {
            sessionId: `orch-${Date.now()}-${Math.random().toString(36).substring(7)}`,
            startedAt: new Date().toISOString(),
            mode: 'interactive',
            activeAgents: [],
            history: []
        };
    }

    private logEvent(type: OrchestrationEvent['type'], data: Record<string, unknown>): void {
        this.context.history.push({
            type,
            timestamp: new Date().toISOString(),
            data
        });
    }

    private getLessonStats(): { total: number; recentTags: string[] } {
        const lessons = searchLessons('');
        const allTags = lessons.flatMap(l => l.tags);
        return {
            total: lessons.length,
            recentTags: [...new Set(allTags.slice(-10))]
        };
    }
}

// Export singleton instance
export const orchestrator = new EliteOrchestrator();

export default {
    EliteOrchestrator,
    orchestrator
};
