/**
 * Smile Savers Flow - Router
 * 
 * Analyzes user requests and routes to appropriate agent(s)
 * 
 * @module orchestration/router
 */

import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { AgentGraphEngine } from '../graph/engine.js';

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
    
    // Find matching agents using the graph engine
    const matchedAgents = graphEngine.findNodesByDomain(normalizedRequest);
    const sortedAgents = matchedAgents.map(a => a.id);

    // Determine mode based on complexity and specific keywords

    // Determine mode based on complexity and specific keywords
    let mode: 'single' | 'swarm' | 'sequential' = 'single';
    let agents: string[] = [];

    const isComplex = /plan|implement|verify|deploy|refactor/i.test(userRequest);

    if (isComplex) {
        mode = 'sequential';
        // Always include elite-master for complex tasks, plus any specialists found
        agents = ['elite-master', ...sortedAgents.filter(a => a !== 'elite-master')].slice(0, 3);
    } else {
        if (sortedAgents.length === 0) {
            agents = ['elite-master'];
        } else if (sortedAgents.length === 1) {
            agents = sortedAgents;
        } else {
            mode = 'swarm';
            agents = sortedAgents.slice(0, 3);
        }
    }

    const priority = determinePriority(normalizedRequest);

    return {
        mode,
        agents,
        priority,
        context: {
            originalRequest: userRequest,
            timestamp: new Date().toISOString(),
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
    return join(skillsDir, agentName, 'SKILL.md');
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
