import { AgentGraphEngine } from './engine.js';

async function testGraph() {
  console.log('--- Testing Agent Graph Engine ---');
  
  const engine = new AgentGraphEngine('.agent/graph/agents.graph.json');
  
  try {
    await engine.loadGraph();
    
    // 1. Test Finding Nodes
    const oracle = engine.findNodeById('astro-oracle');
    console.log('Found Oracle:', oracle?.id === 'astro-oracle' ? 'PASSED' : 'FAILED');
    
    // 2. Test Team Membership
    const researchMembers = engine.getTeamMembers('research-team');
    console.log('Research Team Members:', researchMembers.map(m => m.id).join(', '));
    console.log('Team Membership Count:', researchMembers.length === 3 ? 'PASSED' : 'FAILED');
    
    // 3. Test Routing
    const routingPath = engine.getRoutingPath({ type: 'research' });
    console.log('Routing Path for "research":', routingPath.map(p => p.id).join(' -> '));
    console.log('Routing Path Logic:', routingPath[0]?.id === 'context7' ? 'PASSED' : 'FAILED');
    
    // 4. Test Hierarchy
    const hierarchy = engine.getHierarchy('research-team');
    console.log('Hierarchy for Research Team:', hierarchy.map(h => h.id).join(' -> '));
    console.log('Hierarchy Logic:', hierarchy[0]?.id === 'astro-oracle' ? 'PASSED' : 'FAILED');
    
    console.log('--- All Engine Tests Completed ---');
  } catch (err) {
    console.error('Test Failed:', err);
  }
}

testGraph();
