import { AgentGraph, AgentNode, TeamNode, BaseEdge, RouteEdge } from './schema.js';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';

export class AgentGraphEngine {
  private graph: AgentGraph | null = null;
  private graphPath: string;

  constructor(graphPath: string) {
    this.graphPath = graphPath;
  }

  public async loadGraph(): Promise<void> {
    const fullPath = path.resolve(process.cwd(), this.graphPath);
    const data = await fs.readFile(fullPath, 'utf8');
    this.graph = JSON.parse(data) as AgentGraph;
  }

  public getNodes(): (AgentNode | TeamNode)[] {
    if (!this.graph) return [];
    return this.graph.nodes;
  }

  public getEdges(): BaseEdge[] {
    if (!this.graph) return [];
    return this.graph.edges;
  }

  /**
   * Find agents by their domain keywords
   */
  public findNodesByDomain(query: string): AgentNode[] {
    if (!this.graph) return [];
    const normalizedQuery = query.toLowerCase();
    
    return this.graph.nodes
      .filter(n => n.type !== 'team')
      .filter(n => {
        const agent = n as AgentNode;
        return agent.domain.some(d => normalizedQuery.includes(d.toLowerCase())) ||
               normalizedQuery.includes(agent.id.toLowerCase());
      }) as AgentNode[];
  }

  /**
   * Find agents by specific capabilities
   */
  public findNodesByCapability(capability: string): AgentNode[] {
    if (!this.graph) return [];
    const normalizedCap = capability.toLowerCase();

    return this.graph.nodes
      .filter(n => n.type !== 'team')
      .filter(n => {
        const agent = n as AgentNode;
        return agent.capabilities.some(c => c.toLowerCase().includes(normalizedCap));
      }) as AgentNode[];
  }

  public findNodeById(id: string): AgentNode | TeamNode | undefined {
    return this.graph?.nodes.find(n => n.id === id);
  }

  public getTeamMembers(teamId: string): AgentNode[] {
    const team = this.findNodeById(teamId) as TeamNode;
    if (!team || team.type !== 'team') return [];
    
    return team.memberIds
      .map(id => this.findNodeById(id) as AgentNode)
      .filter(n => n !== undefined);
  }

  public getRoutingPath(intent: { type: string; [key: string]: any }): AgentNode[] {
    if (!this.graph) return [];

    const routingEdges = this.graph.edges.filter(e => e.type === 'routes_to') as RouteEdge[];
    
    const matchingEdge = routingEdges.find(edge => {
      if (!edge.metadata?.condition) return false;
      return edge.metadata.condition.includes(intent.type);
    });

    if (matchingEdge) {
      const targetNode = this.findNodeById(matchingEdge.to) as AgentNode;
      return targetNode ? [targetNode] : [];
    }

    return [];
  }

  public getHierarchy(nodeId: string): (AgentNode | TeamNode)[] {
    const hierarchy: (AgentNode | TeamNode)[] = [];
    let currentId = nodeId;

    while (true) {
      const reportsToEdge = this.graph?.edges.find(e => e.from === currentId && e.type === 'reports_to');
      if (!reportsToEdge) break;

      const parent = this.findNodeById(reportsToEdge.to);
      if (!parent) break;

      hierarchy.push(parent);
      currentId = parent.id;
    }

    return hierarchy;
  }
}
