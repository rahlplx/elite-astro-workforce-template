/**
 * Elite Agentic Workforce - Router
 * 
 * Analyzes user requests and routes to appropriate agent(s)
 * 
 * @module orchestration/router
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AgentGraphEngine } from '../graph/engine.js';
import { config } from '../config/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const graphEngine = new AgentGraphEngine(join(__dirname, '..', 'graph', 'agents.graph.json'));

// Load graph synchronously for router initialization if possible, or handle async in callers
// For simplicity in this shell, we'll assume callers await analysis or we use a sync loader if performance allows.
// Here we fix the logic to at least try loading.
try {
    const graphData = readFileSync(join(__dirname, '..', 'graph', 'agents.graph.json'), 'utf8');
    // @ts-ignore - reaching into private for initialization in this specific context
    graphEngine.graph = JSON.parse(graphData);
} catch (e) {
    console.error('Failed to pre-load agent graph:', e);
}

export interface RoutingDecision {
    mode: 'single' | 'swarm' | 'sequential';
    agents: string[];
    priority: 'high' | 'medium' | 'low';
    context: Record<string, unknown>;
}


/**
 * Analyze user request and determine routing using the Graph Engine
 */
export function analyzeRequest(userRequest: string): RoutingDecision {
    const normalizedRequest = userRequest.toLowerCase();
    
    // 1. Find directly matching agents
    const matchedAgents = graphEngine.findNodesByDomain(normalizedRequest);
    const initialAgents = matchedAgents.map(a => a.id);

    // 2. Discover related agents via Teams and Hierarchy
    const agentsSet = new Set<string>(initialAgents);
    
    for (const agentId of initialAgents) {
        // If it's a leader, recruit the team for a swarm
        const node = graphEngine.findNodeById(agentId);
        if (node && (node.type === 'leader' || node.type === 'team')) {
            const teamMembers = graphEngine.getTeamMembers(agentId);
            teamMembers.forEach(m => agentsSet.add(m.id));
        }

        // Add supervisors to the loop for safety/audit
        const hierarchy = graphEngine.getHierarchy(agentId);
        hierarchy.forEach(h => agentsSet.add(h.id));
    }

    // 3. Always ensure elite-core is in the loop for complex tasks
    const isComplex = /plan|implement|verify|deploy|refactor|architecture|setup/i.test(userRequest);
    if (isComplex || agentsSet.size === 0) {
        agentsSet.add('elite-core');
    }

    // 4. Force 'Audit' coverage for high-priority tasks
    if (/critical|urgent|fix|broken|security/i.test(userRequest)) {
        agentsSet.add('sentinel-auditor');
    }

    let agents = Array.from(agentsSet);
    
    // 5. Determine Mode
    let mode: 'single' | 'swarm' | 'sequential' = 'single';
    
    if (isComplex) {
        mode = 'sequential';
        // Put elite-core first for planning if sequential
        agents = ['elite-core', ...agents.filter(a => a !== 'elite-core')];
    } else if (agents.length > 1) {
        mode = 'swarm';
    }
    // Limit to top N agents per task to avoid token bloat
    const finalAgents = agents.slice(0, config.orchestration.maxAgents);

    const priority = determinePriority(normalizedRequest);

    return {
        mode,
        agents: finalAgents,
        priority,
        context: {
            originalRequest: userRequest,
            timestamp: new Date().toISOString(),
            matchedKeywords: matchedAgents.flatMap(a => (a as any).domain || []), // Heuristic
        },
    };
}

/**
 * Determine task priority based on keywords
 */
function determinePriority(request: string): 'high' | 'medium' | 'low' {
    if (/urgent|critical|broken|error|fix/i.test(request)) {
        return 'high';
    }
    if (/refactor|optimize|improve/i.test(request)) {
        return 'medium';
    }
    return 'low';
}


/**
 * Get agent skill path
 */
export function getAgentSkillPath(agentName: string): string {
    const skillsDir = join(__dirname, '..', 'skills');
    
    // RED TEAM HARDENING: Prevent path traversal
    const sanitizedName = agentName.replace(/[\\/]/g, '').toLowerCase();
    const targetPath = join(skillsDir, sanitizedName, 'SKILL.md');

    return targetPath;
}

/**
 * Format routing decision for display
 */
export function formatRoutingDecision(decision: RoutingDecision): string {
    const keywords = (decision.context.matchedKeywords as string[]) || [];
    return `
🎯 Routing Decision:
  Mode: ${decision.mode}
  Agents: ${decision.agents.join(', ')}
  Priority: ${decision.priority}
  Matched Keywords: ${keywords.length > 0 ? keywords.join(', ') : 'none'}
  `.trim();
}
