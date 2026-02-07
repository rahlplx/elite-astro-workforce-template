import { AgentGraphEngine } from '../graph/engine.js';
import { AgentNode, TeamNode } from '../graph/schema.js';

export interface DelegationResult {
  teamId: string;
  leaderId: string;
  aggregatedResults: {
    specialistId: string;
    status: 'completed' | 'failed' | 'pending';
    result: string;
  }[];
}

export interface TeamTask {
  description: string;
  [key: string]: any;
}

/**
 * Team Manager (TypeScript Edition)
 * Handles leader-specialist delegation and team aggregation with strict types.
 */
export class TeamManager {
  private engine: AgentGraphEngine;

  constructor(engine: AgentGraphEngine) {
    this.engine = engine;
  }

  /**
   * Delegates a task to a team by:
   * 1. Identifying the team and leader.
   * 2. Distributing subtasks onto all available specialists (simple broadcast for now).
   * 3. Aggregating results.
   */
  public async delegateToTeam(teamId: string, task: TeamTask): Promise<DelegationResult> {
    const team = this.engine.findNodeById(teamId);
    
    if (!team) {
      throw new Error(`Team '${teamId}' not found in the graph.`);
    }
    
    if (team.type !== 'team') {
      throw new Error(`Node '${teamId}' is a ${team.type}, not a team.`);
    }

    const teamNode = team as TeamNode;
    const leader = this.engine.findNodeById(teamNode.leaderId);

    if (!leader) {
      throw new Error(`Leader '${teamNode.leaderId}' for team '${teamId}' not found.`);
    }

    console.log(`[TeamManager] 👥 Team: ${teamNode.name} | 👑 Leader: ${leader.id}`);
    console.log(`[TeamManager] 📋 Task: ${task.description}`);

    // Get all specialists in the team
    const members = this.engine.getTeamMembers(teamId);
    
    // Filter out the leader from the members list if present (though getTeamMembers typically returns all)
    // The previous JS implementation treated all members as specialists to delegate to.
    const specialists = members.filter(m => m.id !== leader.id);

    if (specialists.length === 0) {
      console.warn(`[TeamManager] ⚠️ Team '${teamNode.name}' has no specialists.`);
    }

    // Simulate delegation (in a real system, this would call the actual agent functions)
    const delegationPromises = specialists.map(async (specialist) => {
      console.log(`[TeamManager] ➡️ Delegating subtask to Specialist: ${specialist.id}`);
      
      // Simulating async work
      await new Promise(resolve => setTimeout(resolve, 50));

      return {
        specialistId: specialist.id,
        status: 'completed' as const,
        result: `[${specialist.id}] Analysis completed for: ${task.description}`
      };
    });

    const results = await Promise.all(delegationPromises);

    console.log(`[TeamManager] 🔄 Aggregating ${results.length} results for leader ${leader.id}...`);

    return {
      teamId: teamNode.id,
      leaderId: leader.id,
      aggregatedResults: results
    };
  }
}
