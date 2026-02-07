/**
 * Signal-Based Selective Memory Capture
 *
 * Implements memory patterns from Claude-Supermemory.
 * Only captures high-signal information based on keyword triggers.
 *
 * @module orchestration/signal-capture
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const MEMORY_DIR = join(__dirname, '..', 'memory');
const SIGNALS_FILE = join(MEMORY_DIR, 'signals.json');

/**
 * Signal keywords that trigger memory capture
 */
export const SIGNAL_KEYWORDS: Record<string, SignalCategory> = {
    // Explicit memory triggers
    'remember': 'preference',
    'always': 'rule',
    'never': 'rule',
    'don\'t forget': 'preference',

    // Pattern triggers
    'pattern': 'pattern',
    'approach': 'pattern',
    'solution': 'pattern',
    'workaround': 'pattern',

    // Bug/error triggers
    'bug': 'bug',
    'error': 'bug',
    'fix': 'bug',
    'issue': 'bug',
    'broken': 'bug',

    // Architecture triggers
    'architecture': 'decision',
    'design': 'decision',
    'structure': 'decision',
    'choice': 'decision',

    // Insight triggers
    'important': 'insight',
    'key': 'insight',
    'insight': 'insight',
    'learned': 'insight',
    'realize': 'insight'
};

export type SignalCategory = 'preference' | 'pattern' | 'bug' | 'decision' | 'insight' | 'rule';

export interface MemorySignal {
    id: string;
    category: SignalCategory;
    triggerKeyword: string;
    content: string;
    context: ConversationTurn[];
    timestamp: string;
    source: 'user' | 'agent' | 'system';
    projectId?: string;
    tags: string[];
}

export interface ConversationTurn {
    role: 'user' | 'agent';
    content: string;
    timestamp: string;
}

export interface SignalConfig {
    maxContextTurns: number;           // Default: 3
    signalExtraction: boolean;         // Only capture important turns
    toolFilters: string[];             // Tools that trigger memory (Edit, Write)
    containerTag?: string;             // Team vs personal memory
}

const DEFAULT_CONFIG: SignalConfig = {
    maxContextTurns: 3,
    signalExtraction: true,
    toolFilters: ['Edit', 'Write', 'Bash'],
    containerTag: 'project'
};

/**
 * Signal Capture Manager
 */
export class SignalCaptureManager {
    private signals: MemorySignal[] = [];
    private conversationHistory: ConversationTurn[] = [];
    private config: SignalConfig;

    constructor(config: Partial<SignalConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.loadSignals();
    }

    /**
     * Add a conversation turn to history
     */
    addTurn(role: 'user' | 'agent', content: string): void {
        this.conversationHistory.push({
            role,
            content,
            timestamp: new Date().toISOString()
        });

        // Keep only recent turns for context window
        const maxHistory = this.config.maxContextTurns * 3;
        if (this.conversationHistory.length > maxHistory) {
            this.conversationHistory = this.conversationHistory.slice(-maxHistory);
        }

        // Check for signal keywords
        this.detectAndCaptureSignals(content, role);
    }

    /**
     * Detect signal keywords and capture if found
     */
    private detectAndCaptureSignals(content: string, source: 'user' | 'agent'): void {
        const contentLower = content.toLowerCase();

        for (const [keyword, category] of Object.entries(SIGNAL_KEYWORDS)) {
            if (contentLower.includes(keyword.toLowerCase())) {
                this.captureSignal(keyword, category, content, source);
                break; // Only capture once per turn
            }
        }
    }

    /**
     * Capture a signal with context
     */
    private captureSignal(
        triggerKeyword: string,
        category: SignalCategory,
        content: string,
        source: 'user' | 'agent'
    ): void {
        // Get context window (turns before the signal)
        const contextWindow = this.conversationHistory.slice(
            -(this.config.maxContextTurns + 1),
            -1
        );

        const signal: MemorySignal = {
            id: this.generateId(),
            category,
            triggerKeyword,
            content,
            context: contextWindow,
            timestamp: new Date().toISOString(),
            source,
            containerTag: this.config.containerTag,
            tags: this.extractTags(content)
        };

        this.signals.push(signal);
        this.saveSignals();

        console.log(`🧠 Signal captured: [${category}] "${triggerKeyword}" detected`);
    }

    /**
     * Extract tags from content
     */
    private extractTags(content: string): string[] {
        const tags: string[] = [];

        // Extract hashtags
        const hashtagMatches = content.match(/#(\w+)/g);
        if (hashtagMatches) {
            tags.push(...hashtagMatches.map(t => t.replace('#', '')));
        }

        // Extract domain keywords
        const domains = ['auth', 'api', 'ui', 'database', 'performance', 'security', 'testing'];
        for (const domain of domains) {
            if (content.toLowerCase().includes(domain)) {
                tags.push(domain);
            }
        }

        return [...new Set(tags)];
    }

    /**
     * Search captured signals
     */
    search(query: string): MemorySignal[] {
        const queryLower = query.toLowerCase();

        return this.signals.filter(signal =>
            signal.content.toLowerCase().includes(queryLower) ||
            signal.tags.some(tag => tag.toLowerCase().includes(queryLower)) ||
            signal.context.some(turn => turn.content.toLowerCase().includes(queryLower))
        );
    }

    /**
     * Get signals by category
     */
    getByCategory(category: SignalCategory): MemorySignal[] {
        return this.signals.filter(signal => signal.category === category);
    }

    /**
     * Get recent signals
     */
    getRecent(count: number = 10): MemorySignal[] {
        return this.signals.slice(-count);
    }

    /**
     * Get all preferences (rules and preferences)
     */
    getPreferences(): MemorySignal[] {
        return this.signals.filter(s =>
            s.category === 'preference' || s.category === 'rule'
        );
    }

    /**
     * Get all patterns
     */
    getPatterns(): MemorySignal[] {
        return this.signals.filter(s => s.category === 'pattern');
    }

    /**
     * Get bug reports
     */
    getBugs(): MemorySignal[] {
        return this.signals.filter(s => s.category === 'bug');
    }

    /**
     * Format signals for context injection
     */
    formatForContext(signals: MemorySignal[]): string {
        if (signals.length === 0) {
            return '';
        }

        const formatted = signals.map(s => {
            const contextSummary = s.context
                .map(t => `[${t.role}]: ${t.content.slice(0, 100)}...`)
                .join('\n');

            return `
### [${s.category.toUpperCase()}] - ${s.timestamp.split('T')[0]}

**Trigger:** "${s.triggerKeyword}"

**Content:** ${s.content}

**Context:**
${contextSummary}

**Tags:** ${s.tags.map(t => `#${t}`).join(' ')}
`;
        }).join('\n---\n');

        return `
## 🧠 Captured Memories

${formatted}
`.trim();
    }

    /**
     * Get memory statistics
     */
    getStats(): {
        total: number;
        byCategory: Record<SignalCategory, number>;
        recentTags: string[];
    } {
        const byCategory: Record<SignalCategory, number> = {
            preference: 0,
            pattern: 0,
            bug: 0,
            decision: 0,
            insight: 0,
            rule: 0
        };

        const allTags: string[] = [];

        for (const signal of this.signals) {
            byCategory[signal.category]++;
            allTags.push(...signal.tags);
        }

        return {
            total: this.signals.length,
            byCategory,
            recentTags: [...new Set(allTags.slice(-20))]
        };
    }

    /**
     * Clear all signals (use with caution)
     */
    clear(): void {
        this.signals = [];
        this.saveSignals();
    }

    // Private helpers

    private loadSignals(): void {
        if (!existsSync(MEMORY_DIR)) {
            mkdirSync(MEMORY_DIR, { recursive: true });
        }

        if (existsSync(SIGNALS_FILE)) {
            try {
                const data = readFileSync(SIGNALS_FILE, 'utf-8');
                this.signals = JSON.parse(data);
            } catch {
                this.signals = [];
            }
        }
    }

    private saveSignals(): void {
        writeFileSync(SIGNALS_FILE, JSON.stringify(this.signals, null, 2));
    }

    private generateId(): string {
        return `sig-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    }
}

// Export singleton instance
export const signalCapture = new SignalCaptureManager();

export default {
    SignalCaptureManager,
    signalCapture,
    SIGNAL_KEYWORDS
};
