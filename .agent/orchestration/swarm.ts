/**
 * Elite Agentic Workforce - Swarm Coordinator
 * 
 * Orchestrates multiple agents working together on complex tasks
 * 
 * @module orchestration/swarm
 */

import { getAgentSkillPath, analyzeRequest } from './router.js';
import { memory } from './memory.js';
import { validator } from './validators.js';
import { executor } from './executor.js';

interface SwarmResult {
    success: boolean;
    results: Record<string, any>;
    summary: string;
}

interface AgentTask {
    agent: string;
    instruction: string;
    dependencies?: string[]; // Agent names this task depends on
}

/**
 * Swarm Coordinator - Hardened for Battle
 */
export class SwarmCoordinator {
    private recoveryAttempts: number = 0;

    /**
     * Execute tasks in parallel (Independent Swarm)
     */
    async executeParallel(tasks: AgentTask[]): Promise<SwarmResult> {
        console.log(`🐝 Swarm: Starting parallel execution of ${tasks.length} tasks`);

        // Verify stack health before parallel execution
        const stackStatus = await validator.validateAll();
        if (!stackStatus.passed) {
            console.warn('⚠️  Swarm Warning: Stack validation failed. Some tasks may fail.');
            stackStatus.checks.filter(c => !c.passed).forEach(c => console.warn(`  - ${c.message}`));
        }

        const results: Record<string, any> = {};

        // Execute real logic wrappers
        const promises = tasks.map(async (task) => {
            const skillPath = getAgentSkillPath(task.agent);
            console.log(`  ▶️ [${task.agent}] Starting: ${task.instruction.substring(0, 50)}...`);
            console.log(`      (Using skill: ${skillPath.split(/[\\/]/).pop()})`);

            const startTime = Date.now();
            let success = true;
            let output = '';

            try {
                // ELITE BRIDGE: Invoke the real Execution Engine
                const execResult = await executor.execute({ agent: task.agent, instruction: task.instruction } as any);
                output = execResult.output;
                success = execResult.success;
                
                if (!success) {
                    output = `Execution Failed: ${execResult.output}`;
                }
            } catch (e: any) {
                success = false;
                output = e.message;
            }

            const duration = Date.now() - startTime;
            console.log(`  ${success ? '✅' : '❌'} [${task.agent}] ${success ? 'Completed' : 'Failed'}`);

            results[task.agent] = {
                status: success ? 'completed' : 'failed',
                output,
                duration: `${duration}ms`,
                timestamp: new Date().toISOString()
            };

            memory.recordTaskOutcome(task.instruction, task.agent, success, duration);
        });

        await Promise.all(promises);

        return {
            success: true,
            results,
            summary: `Executed ${tasks.length} tasks in parallel with Elite standards.`
        };
    }

    /**
     * Execute tasks in sequence (Pipeline Swarm)
     */
    async executeSequential(tasks: AgentTask[]): Promise<SwarmResult> {
        console.log(`📋 Swarm: Starting sequential execution of ${tasks.length} tasks`);

        const results: Record<string, any> = {};
        let sharedContext = "";

        for (const task of tasks) {
            const skillPath = getAgentSkillPath(task.agent);
            console.log(`  ▶️ [${task.agent}] Working...`);
            
            const startTime = Date.now();

            try {
                // Enhance instruction with shared context from previous agents
                const enhancedInstruction = sharedContext 
                    ? `${task.instruction}\n\n[CONTEXT FROM PREVIOUS AGENTS]:\n${sharedContext}`
                    : task.instruction;

                const execResult = await executor.execute({ 
                    agent: task.agent, 
                    instruction: enhancedInstruction 
                } as any);

                const duration = Date.now() - startTime;
                
                if (execResult.success) {
                    console.log(`  ✅ [${task.agent}] Completed in ${duration}ms`);
                    sharedContext += `\n--- [Result from ${task.agent}] ---\n${execResult.output}\n`;
                } else {
                    console.log(`  ❌ [${task.agent}] Failed: ${execResult.output}`);
                }

                results[task.agent] = {
                    status: execResult.success ? 'completed' : 'failed',
                    output: execResult.output,
                    duration: `${duration}ms`,
                    timestamp: new Date().toISOString()
                };

                memory.recordTaskOutcome(task.instruction, task.agent, execResult.success, duration);

                // Short pathway: If the goal is seemingly achieved, stop the chain
                if (execResult.output.toLowerCase().includes("task complete") || 
                    execResult.output.toLowerCase().includes("implementation finished")) {
                    console.log(`  🏁 [SHORT PATHWAY]: Task achieved early by ${task.agent}. Stopping chain.`);
                    break;
                }
            } catch (error: any) {
                console.error(`  🚨 [${task.agent}] Fatal error: ${error.message}`);
                results[task.agent] = { status: 'error', output: error.message };
            }
        }

        return {
            success: true,
            results,
            summary: `Executed pipeline. Shared context accumulated ${sharedContext.length} chars.`
        };
    }

    /**
     * Plan and execute a complex feature implementation with Dynamic Swarm
     */
    async planFeatureImplementation(featureRequest: string): Promise<SwarmResult> {
        console.log(`🏗️  Swarm: Initiating Dynamic Agentic Pipeline for: "${featureRequest.substring(0, 30)}..."`);

        // 1. Analyze and Route
        const decision = analyzeRequest(featureRequest);
        console.log(`🎯 Routing Decision: ${decision.mode.toUpperCase()} mode with agents: ${decision.agents.join(', ')}`);

        // 2. Build Pipeline
        const pipeline: AgentTask[] = decision.agents.map(agentId => ({
            agent: agentId,
            instruction: `Process feature request as specialist: ${featureRequest}`
        }));

        // 3. Execution
        try {
            if (decision.mode === 'sequential') {
                return await this.executeSequential(pipeline);
            } else {
                return await this.executeParallel(pipeline);
            }
        } catch (error) {
            console.error(`🚨 Swarm Pipeline Failure: ${error}`);
            
            // Circuit Breaker & Recovery
            if (this.recoveryAttempts < 3) {
                this.recoveryAttempts++;
                console.log(`🔄 Initiating Recovery Protocol (Attempt ${this.recoveryAttempts})...`);
                // In a real implementation: engage systematic-debugging agent
                const debugResult = await executor.execute({ agent: 'systematic-debugging', instruction: `The following swarm pipeline failed: ${error}. Analyze and propose fix.` } as any);
                console.log(`🛠️  Debug Insight: ${debugResult.output.substring(0, 100)}...`);
            }

            return {
                success: false,
                results: {},
                summary: 'Pipeline failed. Check systematic-debugging logs for details.'
            };
        }
    }
}

// Export singleton
export const swarm = new SwarmCoordinator();
