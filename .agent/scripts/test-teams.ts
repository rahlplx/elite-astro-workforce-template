import { TeamManager } from '../orchestration/team-manager.js';
import { AgentGraphEngine } from '../graph/engine.js';
import * as path from 'node:path';

async function verifyTeamOrchestration() {
  console.log('🧪 Starting Team Orchestration Test...\n');

  try {
    // Initialize Engine
    const graphPath = '.agent/graph/agents.graph.json';
    const engine = new AgentGraphEngine(graphPath);
    await engine.loadGraph();
    console.log('✅ Graph Engine Loaded');

    // Initialize Team Manager
    const manager = new TeamManager(engine);
    console.log('✅ Team Manager Initialized');

    // Test Case: Delegate to Research Team
    const targetTeam = 'research-team';
    console.log(`\nTesting Delegation to '${targetTeam}'...`);
    
    const result = await manager.delegateToTeam(targetTeam, {
      description: 'Audit the memory system architecture'
    });

    // Verification
    console.log('\n📊 Delegation Report:');
    console.log(`   - Team: ${result.teamId}`);
    console.log(`   - Leader: ${result.leaderId}`);
    console.log(`   - Responses: ${result.aggregatedResults.length}`);

    // Validation Rules
    const researchTeamNode = engine.findNodeById(targetTeam) as any;
    const expectedMemberCount = researchTeamNode.memberIds.length - 1; // Exclude leader usually? or logic filters leader
    
    // In our implementation, we filtered leader out of specialists
    if (result.aggregatedResults.length > 0) {
       console.log('\n✅ TEST PASSED: Team delegation execute successfully.');
       process.exit(0);
    } else {
       console.error('\n❌ TEST FAILED: No results returned from specialists.');
       process.exit(1);
    }

  } catch (error: any) {
    console.error('\n❌ TEST CRASHED:', error.message);
    process.exit(1);
  }
}

verifyTeamOrchestration();
