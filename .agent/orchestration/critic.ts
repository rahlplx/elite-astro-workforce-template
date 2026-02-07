/**
 * Agent Critic & Evaluator
 * 
 * Pattern: Evaluator-Optimizer
 * Validates agent output against standards and provides feedback for self-correction.
 */

import { logger } from './logger.js';

export interface CritiqueResult {
    passed: boolean;
    score: number; // 0-100
    feedback: string;
    improvements: string[];
}

export class AgentCritic {
    /**
     * Evaluate an agent's output against the "Definition of Done"
     */
    async evaluate(instruction: string, output: string, skill: string): Promise<CritiqueResult> {
        logger.info(`⚖️ [CRITIC]: Evaluating output for skill: ${skill}`);

        // 2025 Standard Checklist:
        // 1. Accuracy: Does it meet the instruction?
        // 2. Elegance: Is it the simplest structure?
        // 3. Performance: Is it optimized?
        // 4. Trace: Is the "verification story" clear?

        const feedback: string[] = [];
        const improvements: string[] = [];
        let score = 100;

        // Basic Heuristics (To be upgraded to LLM reasoning)
        if (output.length < 50) {
            score -= 30;
            feedback.push("Output is too short and likely lacks detail.");
            improvements.push("Provide more comprehensive context or implementation details.");
        }

        if (instruction.includes('logic') && !output.includes('Verification')) {
            score -= 20;
            feedback.push("Missing 'Verification Story' for a logic-based change.");
            improvements.push("Add automated test results or manual verification steps.");
        }

        if (skill === 'design-expert' && !output.includes('ATLAS_TOKENS')) {
            score -= 40;
            feedback.push("Violates Design System standard: Raw hex codes or ad-hoc styles detected.");
            improvements.push("Use semantic tokens from ATLAS_TOKENS.md.");
        }

        return {
            passed: score >= 80,
            score,
            feedback: feedback.join(' '),
            improvements
        };
    }

    /**
     * Provide a refined instruction based on critique
     */
    getSelfFixInstruction(original: string, critique: CritiqueResult): string {
        return `
[SELF-CORRECTION REQUEST]
Your previous attempt was evaluated by the System Critic and found wanting.

CRITIQUE: ${critique.feedback}

REQUIRED IMPROVEMENTS:
${critique.improvements.map(i => `- ${i}`).join('\n')}

Please re-execute the task following these corrections:
${original}
        `.trim();
    }
}

export const critic = new AgentCritic();
