/**
 * Smile Savers Flow - Learning Loop
 * 
 * Continuous improvement system that learns from task outcomes
 * 
 * @module orchestration/learning
 */

import { memory, type LearningData } from './memory.js';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

interface ImprovementSuggestion {
    type: 'routing' | 'prompt' | 'workflow';
    description: string;
    confidence: number;
}

export class LearningLoop {
    /**
     * Analyze recent performance and generate improvements
     */
    analyzePerformance(): ImprovementSuggestion[] {
        const data = memory.getLearningData();
        const suggestions: ImprovementSuggestion[] = [];

        // Analyze error patterns
        const highFreqErrors = Object.entries(data.errorPatterns)
            .filter(([_, count]) => count > 3)
            .sort(([_, a], [__, b]) => b - a);

        if (highFreqErrors.length > 0) {
            highFreqErrors.forEach(([error, count]) => {
                suggestions.push({
                    type: 'workflow',
                    description: `Frequent error detected: "${error}" (${count} times). Consider creating a specific validation rule or recovery agent.`,
                    confidence: 0.9
                });
            });
        }

        // Analyze task success rates
        const agentPerformance = this.calculateAgentSuccessRates(data);

        Object.entries(agentPerformance).forEach(([agent, rate]) => {
            if (rate < 0.6) {
                suggestions.push({
                    type: 'prompt',
                    description: `Agent "${agent}" has low success rate (${Math.round(rate * 100)}%). Review its system prompt and tool definitions.`,
                    confidence: 0.85
                });
            }
        });

        return suggestions;
    }

    /**
     * Calculate success rates per agent
     */
    private calculateAgentSuccessRates(data: LearningData): Record<string, number> {
        const agentStats: Record<string, { total: number; success: number }> = {};

        data.taskOutcomes.forEach(outcome => {
            if (!agentStats[outcome.agent]) {
                agentStats[outcome.agent] = { total: 0, success: 0 };
            }
            agentStats[outcome.agent].total++;
            if (outcome.success) agentStats[outcome.agent].success++;
        });

        const rates: Record<string, number> = {};
        Object.keys(agentStats).forEach(agent => {
            const stats = agentStats[agent];
            rates[agent] = stats.success / stats.total;
        });

        return rates;
    }

    /**
     * Feedback loop integration
     */
    processFeedback(taskId: string, wasHelpful: boolean, details?: string): void {
        console.log(`🔄 Learning Loop: Processing feedback for task ${taskId}`);

        if (!wasHelpful) {
            // Analyze what went wrong and update error patterns
            if (details) {
                memory.recordError(details);
            }
        }

        // Trigger analysis
        const improvements = this.analyzePerformance();
        if (improvements.length > 0) {
            console.log('💡 Suggested Improvements:');
            improvements.forEach(imp => {
                console.log(`  - [${imp.type}] ${imp.description}`);
                // Persist specific improvements to LEARNING_DB.md
                this.recordInsight(imp.type, imp.description);
            });
        }
    }

    /**
     * Explicitly record a technical insight
     */
    recordInsight(category: string, insight: string): void {
        console.log(`🧠 Learning Loop: New technical insight [${category}]: ${insight}`);
        memory.recordTechnicalInsight(category, insight);
        
        // AUTO-LEARNING: Update LEARNING_DB.md directly if it's a structural insight
        if (category === 'workflow' || category === 'technical') {
            const dbPath = join(dirname(memory.getProjectMemoryPath()), 'LEARNING_DB.md');
            try {
                const content = existsSync(dbPath) ? readFileSync(dbPath, 'utf-8') : '# LEARNING DATABASE\n\n';
                const entry = `\n### [${category.toUpperCase()}] ${new Date().toLocaleDateString()}\n- ${insight}\n`;
                if (!content.includes(insight)) {
                    writeFileSync(dbPath, content + entry);
                }
            } catch (error) {
                console.error('Failed to update LEARNING_DB.md:', error);
            }
        }
    }
    /**
     * Find relevant insights for a given instruction
     */
    findRelevantInsights(instruction: string): string[] {
        const data = memory.getLearningData();
        const relevant: string[] = [];
        const query = instruction.toLowerCase();

        // 1. Check Error Patterns
        Object.entries(data.errorPatterns).forEach(([error, count]) => {
            if (count > 2 && this.isRelevant(query, error)) {
                relevant.push(`⚠️ WARNING: Past tasks failed due to "${error}". Please ensure you have a mitigation strategy.`);
            }
        });

        // 2. Check Technical Insights
        data.technicalInsights.forEach(item => {
            if (this.isRelevant(query, item.insight) || this.isRelevant(query, item.category)) {
                relevant.push(`💡 INSIGHT [${item.category}]: ${item.insight}`);
            }
        });

        // 3. Check Success Patterns (if applicable)
        Object.entries(data.successPatterns || {}).forEach(([pattern, count]) => {
             if (count > 2 && this.isRelevant(query, pattern)) {
                relevant.push(`✅ TIP: Successful tasks often used "${pattern}".`);
            }
        });

        // Deduplicate and limit
        return [...new Set(relevant)].slice(0, 5);
    }

    /**
     * Simple relevance checker (can be upgraded to vector search later)
     */
    private isRelevant(query: string, text: string): boolean {
        const keywords = text.toLowerCase().split(/[^a-z0-9]+/);
        const queryWords = query.split(/[^a-z0-9]+/);
        
        let matches = 0;
        for (const kw of keywords) {
            if (kw.length > 3 && query.includes(kw)) matches++;
        }
        
        return matches >= 1;
    }
}

export const learning = new LearningLoop();
