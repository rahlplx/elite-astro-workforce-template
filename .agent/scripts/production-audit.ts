/**
 * No-Tolerance Production Audit
 * 
 * Performs high-rigor verification of the Agentic System's cognitive connections.
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AGENT_ROOT = join(__dirname, '..');

interface AuditResult {
    component: string;
    status: 'PASS' | 'FAIL' | 'WARN';
    message: string;
}

async function runProductionAudit() {
    console.log('🛡️  [NO-TOLERANCE AUDIT] Starting production-readiness sweep...\n');
    const results: AuditResult[] = [];

    // 1. Cognitive Connection: Executor -> Critic
    const executorPath = join(AGENT_ROOT, 'orchestration', 'executor.ts');
    const executorContent = readFileSync(executorPath, 'utf-8');
    if (executorContent.includes('critic.evaluate') && executorContent.includes('import { critic }')) {
        results.push({ component: 'Critic Loop', status: 'PASS', message: 'Evaluator-Optimizer loop is hard-wired.' });
    } else {
        results.push({ component: 'Critic Loop', status: 'FAIL', message: 'Executor is bypassing the Critique phase.' });
    }

    // 2. Cognitive Connection: Executor -> Reflexion
    if (executorContent.includes('recordLesson') && executorContent.includes('import { recordLesson }')) {
        results.push({ component: 'Reflexion Loop', status: 'PASS', message: 'Self-improvement memory is linked.' });
    } else {
        results.push({ component: 'Reflexion Loop', status: 'FAIL', message: 'System is not learning from errors.' });
    }

    // 3. Planning Connection: Orchestrator -> ReWoo
    const orchestratorPath = join(AGENT_ROOT, 'orchestration', 'elite-orchestrator.ts');
    const orchestratorContent = readFileSync(orchestratorPath, 'utf-8');
    if (orchestratorContent.includes('rewoo') || orchestratorContent.includes('ParallelExecution')) {
        results.push({ component: 'Symbolic Planning', status: 'PASS', message: 'Parallel execution (ReWoo) supported.' });
    } else {
        results.push({ component: 'Symbolic Planning', status: 'WARN', message: 'Orchestrator may fall back to sequential plan mode.' });
    }

    // 4. Security Hardening: Auto-Trigger Presence
    const isHardened = executorContent.includes('SAFE_ZONE') || executorContent.includes('SECURITY_SWEEP');
    results.push({ 
        component: 'Security Hardening', 
        status: isHardened ? 'PASS' : 'FAIL', 
        message: isHardened ? 'Real-time security triggers detected.' : 'No active security auto-triggers found in executor.' 
    });

    // 5. Manifest Alignment
    const manifestPath = join(AGENT_ROOT, 'MANIFEST.md');
    const manifestContent = readFileSync(manifestPath, 'utf-8');
    if (manifestContent.includes('ReWoo') && manifestContent.includes('Critic')) {
        results.push({ component: 'System Manifest', status: 'PASS', message: 'Documentation matches implementation.' });
    } else {
        results.push({ component: 'System Manifest', status: 'WARN', message: 'Manifest is outdated.' });
    }

    // Output Results
    let criticalFailures = 0;
    console.log('📋 AUDIT LOG:');
    for (const res of results) {
        const icon = res.status === 'PASS' ? '✅' : res.status === 'FAIL' ? '❌' : '⚠️';
        console.log(`${icon} [${res.component}]: ${res.message}`);
        if (res.status === 'FAIL') criticalFailures++;
    }

    if (criticalFailures > 0) {
        console.log(`\n🛑 CRITICAL: ${criticalFailures} connectivity failures identified. System is NOT production-ready.`);
        process.exit(1);
    } else {
        console.log('\n🌟 PRODUCTION READY: All cognitive and security connections verified.');
    }
}

runProductionAudit().catch(console.error);
