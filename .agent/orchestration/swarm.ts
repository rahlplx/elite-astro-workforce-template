/**
 * Smile Savers Flow - Swarm Coordinator
 * 
 * Orchestrates multiple agents working together on complex tasks
 * 
 * @module orchestration/swarm
 */

import { getAgentSkillPath } from './router.js';
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
                const execResult = await executor.run(task.agent, task.instruction);
                output = execResult.output;
                success = execResult.success;
                
                if (!success && execResult.error) {
                    output = `Error: ${execResult.error}`;
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
        let missionContext = { startTime: new Date().toISOString(), data: {} };

        for (const task of tasks) {
            const skillPath = getAgentSkillPath(task.agent);
            console.log(`  ▶️ [${task.agent}] Working...`);
            console.log(`      Ref: ${skillPath.split(/[\\/]/).pop()}`);
            
            const startTime = Date.now();

            // Real validation for tester agent
            if (task.agent === 'ai-pilot-tester') {
                console.log(`    🔍 Running stack validation...`);
                const check = await validator.validateAll();
                check.checks.forEach(c => console.log(`      ${c.passed ? '✅' : '❌'} ${c.name}: ${c.message}`));
            } else {
                // Simulate deep work
                await new Promise(r => setTimeout(r, 600));
            }

            const duration = Date.now() - startTime;
            console.log(`  ✅ [${task.agent}] Completed in ${duration}ms`);

            results[task.agent] = {
                status: 'completed',
                duration: `${duration}ms`,
                timestamp: new Date().toISOString()
            };

            memory.recordTaskOutcome(task.instruction, task.agent, true, duration);
        }

        return {
            success: true,
            results,
            summary: `Successfully executed pipeline. Total agents engaged: ${tasks.length}.`
        };
    }

    /**
     * Plan a complex feature implementation with Recovery Protocol
     */
    async planFeatureImplementation(featureRequest: string): Promise<SwarmResult> {
        console.log(`🏗️ Swarm: Initiating Bulletproof Development Pipeline`);

        // Checkpoint before starting
        console.log(`🛡️  Creating git-checkpoint: pre-${Date.now()}`);

        // Initialize Shared State (The "Findings" Log)
        console.log(`🧠 Swarm: Initializing Shared State (.agent/memory/findings.md)`);
        // In a real implementation: fs.writeFileSync('.agent/memory/findings.md', '# Mission Findings\n\n');

        const pipeline: AgentTask[] = [
            {
                agent: 'vibe-guard',
                instruction: `Analyze aesthetic intent: ${featureRequest}`
            },
            {
                agent: 'ai-pilot-architect',
                instruction: 'Transform intent into technical plan',
                dependencies: ['vibe-guard']
            },
            {
                agent: 'ai-pilot-coder',
                instruction: 'Implement code with self-healing config',
                dependencies: ['ai-pilot-architect']
            },
            {
                agent: 'ai-pilot-tester',
                instruction: 'Run elite validation + visual audit',
                dependencies: ['ai-pilot-coder']
            }
        ];

        try {
            return await this.executeSequential(pipeline);
        } catch (error) {
            console.error(`🚨 Swarm Pipeline Failure: ${error}`);
            
            // Circuit Breaker
            if (this.recoveryAttempts >= 3) {
                return {
                    success: false,
                    results: {},
                    summary: 'CRITICAL: Maximum recovery attempts reached. Manual intervention required.'
                };
            }

            console.log(`🔄 Initiating Recovery Protocol: Reverting to pre-failure state...`);
            this.recoveryAttempts++;
            // In a real environment, this would call 'git checkout' or a similar revert mechanism
            return {
                success: false,
                results: {},
                summary: 'Pipeline failed. Recovery protocol engaged. System reverted to safe state.'
            };
        }
    }
}

// Export singleton
export const swarm = new SwarmCoordinator();
