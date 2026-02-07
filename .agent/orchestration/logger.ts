/**
 * Structured Logger
 * Observability layer for agent decisions and actions (2026 Best Practice)
 */

import { writeFileSync, existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LOGS_DIR = join(__dirname, '..', 'logs');

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: 'decision' | 'action' | 'outcome' | 'system';
  agent?: string;
  message: string;
  metadata?: Record<string, unknown>;
  sessionId?: string;
}

export class StructuredLogger {
  private sessionId: string;
  private logFile: string;

  constructor() {
    if (!existsSync(LOGS_DIR)) {
      mkdirSync(LOGS_DIR, { recursive: true });
    }

    this.sessionId = `session-${Date.now()}`;
    this.logFile = join(LOGS_DIR, `${new Date().toISOString().split('T')[0]}.jsonl`);
  }

  private write(entry: LogEntry): void {
    const line = JSON.stringify({ ...entry, sessionId: this.sessionId }) + '\n';
    appendFileSync(this.logFile, line);
    
    // Also console log for visibility
    const prefix = `[${entry.level.toUpperCase()}][${entry.category}]`;
    if (entry.level === 'error' || entry.level === 'critical') {
      console.error(`${prefix} ${entry.message}`);
    } else if (entry.level === 'warn') {
      console.warn(`${prefix} ${entry.message}`);
    } else {
      console.log(`${prefix} ${entry.message}`);
    }
  }

  decision(agent: string, message: string, metadata?: Record<string, unknown>): void {
    this.write({
      timestamp: new Date().toISOString(),
      level: 'info',
      category: 'decision',
      agent,
      message,
      metadata
    });
  }

  action(agent: string, message: string, metadata?: Record<string, unknown>): void {
    this.write({
      timestamp: new Date().toISOString(),
      level: 'info',
      category: 'action',
      agent,
      message,
      metadata
    });
  }

  outcome(agent: string, success: boolean, message: string, metadata?: Record<string, unknown>): void {
    this.write({
      timestamp: new Date().toISOString(),
      level: success ? 'info' : 'warn',
      category: 'outcome',
      agent,
      message,
      metadata: { ...metadata, success }
    });
  }

  error(message: string, error?: Error, metadata?: Record<string, unknown>): void {
    this.write({
      timestamp: new Date().toISOString(),
      level: 'error',
      category: 'system',
      message,
      metadata: { ...metadata, errorName: error?.name, errorMessage: error?.message }
    });
  }

  system(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
    this.write({
      timestamp: new Date().toISOString(),
      level,
      category: 'system',
      message,
      metadata
    });
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.system('warn', message, metadata);
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.system('info', message, metadata);
  }

  getSessionId(): string {
    return this.sessionId;
  }
}

export const logger = new StructuredLogger();
