/**
 * Smile Savers Flow - Memory System
 * 
 * Manages context persistence and learning across sessions
 * 
 * @module orchestration/memory
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MEMORY_DIR = join(__dirname, 'memory');

export interface ConversationContext {
    sessionId: string;
    startedAt: string;
    lastActivity: string;
    messages: Array<{
        role: 'user' | 'agent';
        content: string;
        timestamp: string;
        agent?: string;
    }>;
    activeTask?: string;
    completedTasks: string[];
}

export interface UserPreferences {
    preferredAgents: Record<string, number>; // agent -> usage count
    codeStyle: {
        indentation: 'spaces' | 'tabs';
        quoteStyle: 'single' | 'double';
        semicolons: boolean;
    };
    workflowPreferences: {
        autoApprove: boolean;
        verboseLogging: boolean;
    };
}

export interface LearningData {
    taskOutcomes: Array<{
        task: string;
        agent: string;
        success: boolean;
        duration: number;
        timestamp: string;
    }>;
    errorPatterns: Record<string, number>; // error type -> count
    successPatterns: Record<string, number>; // pattern -> count
    technicalInsights: Array<{
        category: string;
        insight: string;
        timestamp: string;
    }>;
}

/**
 * Memory Manager
 */
export class MemoryManager {
    private contextPath: string;
    private preferencesPath: string;
    private learningPath: string;

    constructor() {
        if (!existsSync(MEMORY_DIR)) {
            mkdirSync(MEMORY_DIR, { recursive: true });
        }

        this.contextPath = join(MEMORY_DIR, 'context.json');
        this.preferencesPath = join(MEMORY_DIR, 'preferences.json');
        this.learningPath = join(MEMORY_DIR, 'learning.json');
    }

    /**
     * Get the path to the project memory directory
     */
    getProjectMemoryPath(): string {
        return MEMORY_DIR;
    }

    /**
     * Get current conversation context
     */
    getContext(): ConversationContext {
        if (!existsSync(this.contextPath)) {
            return this.createNewContext();
        }

        try {
            const data = readFileSync(this.contextPath, 'utf-8');
            return JSON.parse(data);
        } catch {
            return this.createNewContext();
        }
    }

    /**
     * Update conversation context
     */
    updateContext(updates: Partial<ConversationContext>): void {
        const current = this.getContext();
        const updated = {
            ...current,
            ...updates,
            lastActivity: new Date().toISOString(),
        };

        writeFileSync(this.contextPath, JSON.stringify(updated, null, 2));
    }

    /**
     * Add message to context
     */
    addMessage(role: 'user' | 'agent', content: string, agent?: string): void {
        const context = this.getContext();
        context.messages.push({
            role,
            content,
            timestamp: new Date().toISOString(),
            agent,
        });

        // Keep only last 50 messages to prevent bloat
        if (context.messages.length > 50) {
            context.messages = context.messages.slice(-50);
        }

        this.updateContext(context);
    }

    /**
     * Get user preferences
     */
    getPreferences(): UserPreferences {
        if (!existsSync(this.preferencesPath)) {
            return this.createDefaultPreferences();
        }

        try {
            const data = readFileSync(this.preferencesPath, 'utf-8');
            return JSON.parse(data);
        } catch {
            return this.createDefaultPreferences();
        }
    }

    /**
     * Update user preferences
     */
    updatePreferences(updates: Partial<UserPreferences>): void {
        const current = this.getPreferences();
        const updated = { ...current, ...updates };
        writeFileSync(this.preferencesPath, JSON.stringify(updated, null, 2));
    }

    /**
     * Record agent usage
     */
    recordAgentUsage(agentName: string): void {
        const prefs = this.getPreferences();
        prefs.preferredAgents[agentName] = (prefs.preferredAgents[agentName] || 0) + 1;
        this.updatePreferences(prefs);
    }

    /**
     * Get learning data
     */
    getLearningData(): LearningData {
        if (!existsSync(this.learningPath)) {
            return this.createDefaultLearningData();
        }

        try {
            const data = readFileSync(this.learningPath, 'utf-8');
            return JSON.parse(data);
        } catch {
            return this.createDefaultLearningData();
        }
    }

    /**
     * Record task outcome
     */
    recordTaskOutcome(task: string, agent: string, success: boolean, duration: number): void {
        const learning = this.getLearningData();
        learning.taskOutcomes.push({
            task,
            agent,
            success,
            duration,
            timestamp: new Date().toISOString(),
        });

        // Keep only last 100 outcomes
        if (learning.taskOutcomes.length > 100) {
            learning.taskOutcomes = learning.taskOutcomes.slice(-100);
        }

        writeFileSync(this.learningPath, JSON.stringify(learning, null, 2));
    }

    /**
     * Record error pattern
     */
    recordError(errorType: string): void {
        const learning = this.getLearningData();
        learning.errorPatterns[errorType] = (learning.errorPatterns[errorType] || 0) + 1;
        writeFileSync(this.learningPath, JSON.stringify(learning, null, 2));
    }

    /**
     * Record technical insight
     */
    recordTechnicalInsight(category: string, insight: string): void {
        const learning = this.getLearningData();
        learning.technicalInsights.push({
            category,
            insight,
            timestamp: new Date().toISOString(),
        });
        writeFileSync(this.learningPath, JSON.stringify(learning, null, 2));
    }

    /**
     * Get all recorded technical insights
     */
    getTechnicalInsights() {
        return this.getLearningData().technicalInsights;
    }

    /**
     * Clear all memory (reset)
     */
    clear(): void {
        if (existsSync(this.contextPath)) {
            writeFileSync(this.contextPath, JSON.stringify(this.createNewContext(), null, 2));
        }
    }

    // Private helper methods

    private createNewContext(): ConversationContext {
        return {
            sessionId: this.generateSessionId(),
            startedAt: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            messages: [],
            completedTasks: [],
        };
    }

    private createDefaultPreferences(): UserPreferences {
        return {
            preferredAgents: {},
            codeStyle: {
                indentation: 'spaces',
                quoteStyle: 'single',
                semicolons: true,
            },
            workflowPreferences: {
                autoApprove: false,
                verboseLogging: false,
            },
        };
    }

    private createDefaultLearningData(): LearningData {
        return {
            taskOutcomes: [],
            errorPatterns: {},
            successPatterns: {},
            technicalInsights: [],
        };
    }

    private generateSessionId(): string {
        return `session-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    }
}

// Export singleton instance
export const memory = new MemoryManager();
