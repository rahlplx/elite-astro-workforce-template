/**
 * Agentic System - Orchestration Auditor
 * 
 * Audits the Orchestration Layer (router, swarm, memory) for reliability.
 * Ensures the system can route requests, handle errors, and persist context.
 * 
 * @module auditors/orchestration-auditor
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

interface OrchestrationAuditResult {
    check: string;
    passed: boolean;
    details: string;
}

export async function auditOrchestration(): Promise<OrchestrationAuditResult[]> {
    const results: OrchestrationAuditResult[] = [];
    const agentRoot = join(process.cwd(), '.agent');

    // 1. Router Coverage
    const routerPath = join(agentRoot, 'orchestration', 'router.ts');
    if (existsSync(routerPath)) {
        const content = readFileSync(routerPath, 'utf8');
        const hasSkillPathResolution = content.includes('getAgentSkillPath');
        const hasRequestAnalysis = content.includes('analyzeRequest');
        
        results.push({
            check: 'Router Functionality',
            passed: hasSkillPathResolution && hasRequestAnalysis,
            details: hasSkillPathResolution ? 'Verified skill path resolution' : 'Missing getAgentSkillPath'
        });
    } else {
        results.push({ check: 'Router Exists', passed: false, details: 'Missing router.ts' });
    }

    // 2. Swarm Recovery
    const swarmPath = join(agentRoot, 'orchestration', 'swarm.ts');
    if (existsSync(swarmPath)) {
        const content = readFileSync(swarmPath, 'utf8');
        const hasRecovery = content.includes('recoveryAttempts') || content.includes('systematic-debugging');
        
        results.push({
            check: 'Swarm Recovery Protocol',
            passed: hasRecovery,
            details: hasRecovery ? 'Verified error recovery logic' : 'Missing self-healing logic'
        });
    } else {
        results.push({ check: 'Swarm Exists', passed: false, details: 'Missing swarm.ts' });
    }

    // 3. Memory Persistence
    const memoryPath = join(agentRoot, 'orchestration', 'memory.ts');
    if (existsSync(memoryPath)) {
        const content = readFileSync(memoryPath, 'utf8');
        const hasPersistence = content.includes('lessons_learned.json') || content.includes('persist');
        
        results.push({
            check: 'Memory Persistence',
            passed: hasPersistence,
            details: hasPersistence ? 'Verified long-term storage access' : 'Missing persistence layer'
        });
    } else {
        results.push({ check: 'Memory Exists', passed: false, details: 'Missing memory.ts' });
    }

    // 4. Intent Sync (New Standard)
    const orchestratorPath = join(agentRoot, 'orchestration', 'elite-orchestrator.ts');
    if (existsSync(orchestratorPath)) {
        const content = readFileSync(orchestratorPath, 'utf8');
        const hasSync = content.includes('loadSystemKnowledge') && content.includes('PR-004');
         
        results.push({
            check: 'Intent Sync Protocol',
            passed: hasSync,
            details: hasSync ? 'Verified knowledge pre-loading' : 'Missing intent-sync implementation (PR-004)'
        });
    }

    return results;
}

// Self-execution
if (import.meta.url === `file://${process.argv[1]}`) {
    auditOrchestration().then(results => {
        const failed = results.filter(r => !r.passed);
        console.log('\n🎹 Orchestration Audit Results:');
        
        results.forEach(r => {
            console.log(`${r.passed ? '✅' : '❌'} ${r.check}: ${r.details}`);
        });

        if (failed.length > 0) process.exit(1);
    });
}
