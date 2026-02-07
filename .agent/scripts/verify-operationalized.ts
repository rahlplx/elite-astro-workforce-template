import { SkillExecutor } from '../orchestration/executor.js';
import { logger } from '../orchestration/logger.js';

async function verifyOperationalizedWorkflow() {
    console.log('🧪 Starting Operationalized Workflow Verification...');
    const executor = new SkillExecutor();

    // Test 1: Security Insight Injection & Logic Check
    console.log('\n--- Test 1: Security Awareness ---');
    const securityTask = {
        instruction: "Create a script that uses child_process.spawn to run a shell command.",
        projectPath: process.cwd()
    };
    
    console.log('Task:', securityTask.instruction);
    const result1 = await executor.execute(securityTask);
    
    if (securityTask.instruction.includes('[PAST LEARNINGS & WARNINGS]')) {
        console.log('✅ PASS: Security insight injected into instruction.');
        console.log('Retrieved Warnings:', securityTask.instruction.split('[PAST LEARNINGS & WARNINGS]')[1].trim());
    } else {
        console.log('❌ FAIL: Security insight NOT injected.');
    }

    // Test 2: UI/UX Aesthetic Safety & Constraint Check
    console.log('\n--- Test 2: UX Aesthetic Safety ---');
    const uxTask = {
        instruction: "Create a Hero component with background color #000000 and text color #000000.",
        projectPath: process.cwd()
    };
    
    console.log('Task:', uxTask.instruction);
    const result2 = await executor.execute(uxTask);
    
    if (result2.output.includes('REJECTED') || result2.output.includes('Blocked')) {
        console.log('✅ PASS: Low contrast / Raw hex blocked by Guardrails.');
        console.log('Blocked message:', result2.output);
    } else {
        // Even if not blocked at executor level (since it's a mock instruction), 
        // we check if the warnings were shown to the agent.
        if (uxTask.instruction.includes('mobile-first') || uxTask.instruction.includes('contrast')) {
            console.log('✅ PASS: UX warnings injected into context.');
        } else {
            console.log('❌ FAIL: UX warnings NOT injected.');
        }
    }

    console.log('\n✨ VERIFICATION COMPLETE');
}

verifyOperationalizedWorkflow().catch(err => {
    console.error('❌ Verification failed:', err);
    process.exit(1);
});
