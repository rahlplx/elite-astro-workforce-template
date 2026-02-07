/**
 * Agent Handoff Protocol
 * Agent-to-Agent communication for multi-agent orchestration (2026 Best Practice)
 */

import { AgentNode } from '../graph/schema.js';
import { logger } from './logger.js';

export interface HandoffMessage {
  id: string;
  fromAgent: string;
  toAgent: string;
  type: 'task' | 'result' | 'query' | 'error';
  payload: unknown;
  timestamp: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  replyTo?: string;
}

export interface HandoffResult {
  success: boolean;
  messageId: string;
  response?: unknown;
  error?: string;
}

export class HandoffProtocol {
  private pendingMessages: Map<string, HandoffMessage> = new Map();
  private messageHistory: HandoffMessage[] = [];

  /**
   * Create a handoff message between agents
   */
  createHandoff(
    fromAgent: string,
    toAgent: string,
    type: HandoffMessage['type'],
    payload: unknown,
    priority: HandoffMessage['priority'] = 'normal',
    replyTo?: string
  ): HandoffMessage {
    const message: HandoffMessage = {
      id: `handoff-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      fromAgent,
      toAgent,
      type,
      payload,
      timestamp: new Date().toISOString(),
      priority,
      replyTo
    };

    this.pendingMessages.set(message.id, message);
    this.messageHistory.push(message);

    logger.action(fromAgent, `Handoff created to ${toAgent}`, {
      messageId: message.id,
      type,
      priority
    });

    return message;
  }

  /**
   * Process and complete a handoff
   */
  completeHandoff(messageId: string, response?: unknown, error?: string): HandoffResult {
    const message = this.pendingMessages.get(messageId);
    
    if (!message) {
      return {
        success: false,
        messageId,
        error: 'Message not found'
      };
    }

    this.pendingMessages.delete(messageId);

    logger.outcome(message.toAgent, !error, `Handoff ${messageId} completed`, {
      fromAgent: message.fromAgent,
      hasError: !!error
    });

    return {
      success: !error,
      messageId,
      response,
      error
    };
  }

  /**
   * Get pending messages for an agent
   */
  getPendingForAgent(agentId: string): HandoffMessage[] {
    return Array.from(this.pendingMessages.values())
      .filter(m => m.toAgent === agentId)
      .sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });
  }

  /**
   * Get message history between agents
   */
  getHistory(agentA: string, agentB: string): HandoffMessage[] {
    return this.messageHistory.filter(
      m => (m.fromAgent === agentA && m.toAgent === agentB) ||
           (m.fromAgent === agentB && m.toAgent === agentA)
    );
  }
}

export const handoff = new HandoffProtocol();
