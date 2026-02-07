/**
 * Agentic System - Graph Auditor
 * 
 * Audits the Knowledge Graph (agents.graph.json) for structural integrity.
 * Ensures all nodes are reachable, all edges valid, and teams properly formed.
 * 
 * @module auditors/graph-auditor
 */

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

interface GraphAuditResult {
    check: string;
    passed: boolean;
    issues: string[];
}

interface AgentGraph {
    nodes: Array<{ id: string; type: string; skillPath?: string; memberIds?: string[] }>;
    edges: Array<{ from: string; to: string; type: string }>;
}

export async function auditGraph(): Promise<GraphAuditResult[]> {
    const results: GraphAuditResult[] = [];
    const graphPath = join(process.cwd(), '.agent', 'graph', 'agents.graph.json');

    if (!existsSync(graphPath)) {
        return [{ check: 'Graph File Exists', passed: false, issues: ['❌ agents.graph.json missing'] }];
    }

    try {
        const graph: AgentGraph = JSON.parse(readFileSync(graphPath, 'utf8'));
        const nodeIds = new Set(graph.nodes.map(n => n.id));
        const issues: string[] = [];

        // 1. Node Integrity
        const orphanedNodes = graph.nodes.filter(n => {
            if (n.type === 'team') return false; // Teams might not have incoming edges in some models
            if (n.id === 'elite-core') return false; // Root node
            return !graph.edges.some(e => e.to === n.id || e.from === n.id);
        });
        
        if (orphanedNodes.length > 0) {
            orphanedNodes.forEach(n => issues.push(`⚠️ Orphaned Node: ${n.id}`));
        }
        results.push({ check: 'Node connectivity', passed: orphanedNodes.length === 0, issues });

        // 2. Skill Path Validity
        const pathIssues: string[] = [];
        graph.nodes.forEach(n => {
            if (n.skillPath) {
                const fullPath = join(process.cwd(), n.skillPath, 'SKILL.md');
                if (!existsSync(fullPath)) {
                    pathIssues.push(`❌ Broken Skill Path: ${n.id} -> ${n.skillPath}`);
                }
            }
        });
        results.push({ check: 'Skill Path Integrity', passed: pathIssues.length === 0, issues: pathIssues });

        // 3. Edge Validity
        const edgeIssues: string[] = [];
        graph.edges.forEach(e => {
            if (!nodeIds.has(e.from)) edgeIssues.push(`❌ Dead Edge Source: ${e.from}`);
            if (!nodeIds.has(e.to)) edgeIssues.push(`❌ Dead Edge Target: ${e.to}`);
        });
        results.push({ check: 'Edge Validity', passed: edgeIssues.length === 0, issues: edgeIssues });

        // 4. Team Coherence
        const teamIssues: string[] = [];
        graph.nodes.filter(n => n.type === 'team').forEach(team => {
            if (!team.memberIds || team.memberIds.length === 0) {
                teamIssues.push(`⚠️ Empty Team: ${team.id}`);
            } else {
                team.memberIds.forEach(memberId => {
                    if (!nodeIds.has(memberId)) {
                        teamIssues.push(`❌ Missing Team Member: ${team.id} references ${memberId}`);
                    }
                });
            }
        });
        results.push({ check: 'Team Structure', passed: teamIssues.length === 0, issues: teamIssues });

    } catch (error) {
        results.push({ check: 'JSON Parse', passed: false, issues: [`❌ Invalid JSON: ${error}`] });
    }

    return results;
}

// Self-execution
if (import.meta.url === `file://${process.argv[1]}`) {
    auditGraph().then(results => {
        const failed = results.filter(r => !r.passed);
        console.log('\n🕸️  Graph Audit Results:');
        
        results.forEach(r => {
            console.log(`${r.passed ? '✅' : '❌'} ${r.check}`);
            r.issues.forEach(i => console.log(`    ${i}`));
        });

        if (failed.length > 0) process.exit(1);
    });
}
