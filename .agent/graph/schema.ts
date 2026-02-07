/**
 * Agent Graph Schema
 * Version: 1.0.0
 * 
 * Defines the core structure for the graph-based AI Agentic System.
 */

// Node Types
export type NodeType = 'specialist' | 'leader' | 'orchestrator' | 'team';

export interface BaseNode {
  id: string;
  type: NodeType;
  metadata?: Record<string, any>;
}

export interface AgentNode extends BaseNode {
  type: 'specialist' | 'leader' | 'orchestrator';
  domain: string[];
  skillPath?: string; // Path to .agent/skills/{skill}
  capabilities: string[];
}

export interface TeamNode extends BaseNode {
  type: 'team';
  purpose: string;
  leaderId: string;
  memberIds: string[];
}

// Edge Types
export type EdgeType = 'reports_to' | 'member_of' | 'routes_to' | 'depends_on';

export interface BaseEdge {
  from: string; // id of the source node
  to: string;   // id of the target node
  type: EdgeType;
  metadata?: Record<string, any>;
}

export interface RouteEdge extends BaseEdge {
  type: 'routes_to';
  condition?: string; // Logic for when to route (e.g., intent matching)
  priority: number;
}

export interface DependencyEdge extends BaseEdge {
  type: 'depends_on';
  requirement: string;
}

// Graph Container
export interface AgentGraph {
  version: string;
  nodes: (AgentNode | TeamNode)[];
  edges: (BaseEdge | RouteEdge | DependencyEdge)[];
}
