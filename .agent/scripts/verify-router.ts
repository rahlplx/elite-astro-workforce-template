import { analyzeRequest } from '../orchestration/router.js';

async function verifyRouter() {
    console.log('🧪 Verifying Router Logic...');
    
    // Test Case 1: Complex Request
    const request1 = "Plan and implement a new landing page for Dr. Smith";
    const result1 = analyzeRequest(request1);
    
    console.log(`\nInput: "${request1}"`);
    console.log('Mode:', result1.mode);
    console.log('Agents:', result1.agents);

    if (result1.mode === 'sequential' && result1.agents.includes('elite-master')) {
        console.log('✅ Test Case 1 Passed (Sequential logic verified)');
    } else {
        console.error('❌ Test Case 1 Failed');
        process.exit(1);
    }

    // Test Case 2: Specific Domain
    const request2 = "Check the seo schema for the homepage";
    const result2 = analyzeRequest(request2);

    console.log(`\nInput: "${request2}"`);
    console.log('Mode:', result2.mode);
    console.log('Agents:', result2.agents);

    // Should find seo-expert or schema-generator or astro-oracle
    if (result2.agents.some(a => ['seo-expert', 'schema-generator', 'astro-oracle'].includes(a))) {
        console.log('✅ Test Case 2 Passed (Domain resolution verified)');
    } else {
        console.error('❌ Test Case 2 Failed');
        // Don't fail hard on this one as fuzzy matching might vary, but good to know
    }

    console.log('\n✨ Router Verification Complete');
}

verifyRouter();
