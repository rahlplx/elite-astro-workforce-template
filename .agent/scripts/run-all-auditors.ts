/**
 * Agentic System - Swarm Validator
 * 
 * Runs all system auditors in parallel to validate the AI Workforce.
 * Aggregates results from Skill, Graph, Orchestration, and Portability auditors.
 * 
 * @module scripts/run-all-auditors
 */

import { auditSkills } from './auditors/skill-auditor.js';
import { auditGraph } from './auditors/graph-auditor.js';
import { auditOrchestration } from './auditors/orchestration-auditor.js';
import { auditPortability } from './auditors/portability-auditor.js';

async function runSwarmAudit() {
    console.log('🏁 Starting Elite Agentic System Audit...');
    console.log('=======================================\n');

    const startTime = Date.now();

    // Run auditors in parallel
    const [skills, graph, orchestration, portability] = await Promise.all([
        auditSkills(),
        auditGraph(),
        auditOrchestration(),
        auditPortability()
    ]);

    const duration = Date.now() - startTime;

    console.log('\n📊 AGGREGATED REPORT');
    console.log('===================');

    // 1. Skill Results
    const failedSkills = skills.filter(s => s.status === 'fail');
    const warnedSkills = skills.filter(s => s.status === 'warn');
    console.log(`\n🧠 Skills: ${skills.length - failedSkills.length - warnedSkills.length}/${skills.length} OK`);
    if (failedSkills.length > 0) console.log(`   ❌ ${failedSkills.length} Critical Issues`);
    if (warnedSkills.length > 0) console.log(`   ⚠️ ${warnedSkills.length} Warnings`);

    // 2. Graph Results
    const failedGraph = graph.filter(g => !g.passed);
    console.log(`\n🕸️  Graph: ${graph.length - failedGraph.length}/${graph.length} Checks Passed`);
    failedGraph.forEach(f => console.log(`   ❌ ${f.check}: ${f.issues.join(', ')}`));

    // 3. Orchestration Results
    const failedOrch = orchestration.filter(o => !o.passed);
    console.log(`\n🎹 Orchestration: ${orchestration.length - failedOrch.length}/${orchestration.length} Checks Passed`);
    failedOrch.forEach(f => console.log(`   ❌ ${f.check}: ${f.details}`));

    // 4. Portability Results
    const failedPort = portability.filter(p => !p.passed);
    console.log(`\n🌍 Portability: ${portability.length - failedPort.length}/${portability.length} Checks Passed`);
    failedPort.forEach(f => console.log(`   ❌ ${f.check}: ${f.issues.length} issues found`));

    // Final Verdict
    const totalFailures = failedSkills.length + failedGraph.length + failedOrch.length + failedPort.length;
    
    console.log('\n-------------------');
    if (totalFailures === 0) {
        console.log(`✅ SYSTEM AUDIT PASSED in ${duration}ms`);
        console.log('🎉 The Agentic Workforce is VIBE-READY and PORTABLE!');
        process.exit(0);
    } else {
        console.log(`❌ SYSTEM AUDIT FAILED with ${totalFailures} critical issues.`);
        process.exit(1);
    }
}

runSwarmAudit();
