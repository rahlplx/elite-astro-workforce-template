
import { learning } from '../orchestration/learning.js';
import { memory } from '../orchestration/memory.js';

console.log('🧪 Starting Learning System Verification...');

// 1. Setup Mock Data
console.log('1️⃣  Injecting mock learning data...');
memory.recordError('infinite_recursion_in_useEffect');
memory.recordError('infinite_recursion_in_useEffect');
memory.recordError('infinite_recursion_in_useEffect'); // 3 times to trigger warning
memory.recordTechnicalInsight('React', 'Always add dependency array to useEffect');

// 2. Test Retrieval
console.log('2️⃣  Testing retrieval with relevant query...');
const query = "Create a React component using useEffect";
const insights = learning.findRelevantInsights(query);

console.log(`Query: "${query}"`);
console.log('Retrieved Insights:');
insights.forEach(i => console.log(`  - ${i}`));

// 3. Verification
const hasWarning = insights.some(i => i.includes('infinite_recursion'));
const hasInsight = insights.some(i => i.includes('dependency array'));

if (hasWarning && hasInsight) {
    console.log('\n✅ VERIFICATION PASSED: System successfully retrieved both warnings and insights.');
    process.exit(0);
} else {
    console.error('\n❌ VERIFICATION FAILED: Missing expected insights.');
    console.log('Has Warning:', hasWarning);
    console.log('Has Insight:', hasInsight);
    process.exit(1);
}
