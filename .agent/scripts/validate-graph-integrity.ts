/**
 * Elite Agentic Workforce - Graph Integrity Validator
 * 
 * Validates agents.graph.json against the file system to detect orphaned references.
 * 
 * @module validators/graph-integrity
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AGENT_ROOT = join(__dirname, '..');
const GRAPH_PATH = join(AGENT_ROOT, 'graph', 'agents.graph.json');
const SKILLS_PATH = join(AGENT_ROOT, 'skills');
const VIOLATIONS_LOG = join(AGENT_ROOT, 'memory', 'integrity-violations.log');

export interface IntegrityViolation {
    type: 'orphaned-node' | 'dangling-edge' | 'orphaned-member' | 'missing-skill';
    message: string;
    affectedId: string;
    suggestedFix: string;
}

interface GraphNode {
    id: string;
    type: string;
    skillPath?: string;
    memberIds?: string[];
}

interface GraphEdge {
    from: string;
    to: string;
    type: string;
}

interface AgentGraph {
    version: string;
    nodes: GraphNode[];
    edges: GraphEdge[];
}

/**
 * Validates the agent graph for integrity violations.
 * @returns Array of violations found.
 */
export async function validateGraphIntegrity(): Promise<IntegrityViolation[]> {
    const violations: IntegrityViolation[] = [];

    if (!existsSync(GRAPH_PATH)) {
        console.warn('⚠️ Agent graph not found. Skipping integrity check.');
        return violations;
    }

    const graph: AgentGraph = JSON.parse(readFileSync(GRAPH_PATH, 'utf8'));
    const nodeIds = new Set(graph.nodes.map(n => n.id));

    // Rule 1: Node-to-Skill Validation
    for (const node of graph.nodes) {
        if (node.skillPath) {
            const fullSkillPath = join(AGENT_ROOT, '..', node.skillPath, 'SKILL.md');
            if (!existsSync(fullSkillPath)) {
                violations.push({
                    type: 'missing-skill',
                    message: `Node '${node.id}' references a SKILL.md that does not exist.`,
                    affectedId: node.id,
                    suggestedFix: `Create '${node.skillPath}/SKILL.md' OR remove node '${node.id}' from agents.graph.json.`
                });
            }
        }
    }

    // Rule 2: Edge-to-Node Validation
    for (const edge of graph.edges) {
        if (!nodeIds.has(edge.from)) {
            violations.push({
                type: 'dangling-edge',
                message: `Edge 'from' node '${edge.from}' does not exist in graph.nodes.`,
                affectedId: edge.from,
                suggestedFix: `Remove the edge or add a node with id '${edge.from}'.`
            });
        }
        if (!nodeIds.has(edge.to)) {
            violations.push({
                type: 'dangling-edge',
                message: `Edge 'to' node '${edge.to}' does not exist in graph.nodes.`,
                affectedId: edge.to,
                suggestedFix: `Remove the edge or add a node with id '${edge.to}'.`
            });
        }
    }

    // Rule 3: Team-Member Validation
    for (const node of graph.nodes.filter(n => n.type === 'team')) {
        if (node.memberIds) {
            for (const memberId of node.memberIds) {
                if (!nodeIds.has(memberId)) {
                    violations.push({
                        type: 'orphaned-member',
                        message: `Team '${node.id}' references non-existent member '${memberId}'.`,
                        affectedId: memberId,
                        suggestedFix: `Remove '${memberId}' from team '${node.id}' or create the corresponding node.`
                    });
                }
            }
        }
    }

    // Log violations
    if (violations.length > 0) {
        const logEntry = `\n--- Integrity Check: ${new Date().toISOString()} ---\n${violations.map(v => `[${v.type}] ${v.message}`).join('\n')}\n`;
        try {
            writeFileSync(VIOLATIONS_LOG, logEntry, { flag: 'a' });
        } catch { /* memory dir may not exist */ }
    }

    return violations;
}

/**
 * Run validation and report.
 */
async function main() {
    console.log('🔗 Elite Graph Integrity Validator');
    console.log('==================================\n');

    const violations = await validateGraphIntegrity();

    if (violations.length === 0) {
        console.log('✅ Graph Integrity: PASSED. No violations found.');
        process.exit(0);
    } else {
        console.error(`❌ Graph Integrity: FAILED. ${violations.length} violation(s) found.\n`);
        for (const v of violations) {
            console.error(`  [${v.type.toUpperCase()}] ${v.message}`);
            console.error(`     Fix: ${v.suggestedFix}\n`);
        }
        process.exit(1);
    }
}

// Run if executed directly
main();
