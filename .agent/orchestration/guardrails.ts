/**
 * Guardrails System
 * Multi-layer validation for agentic safety (2026 Best Practice)
 */

import { RiskProfile } from './risk-assessor.js';

export type GuardrailLevel = 'reasoning' | 'action' | 'system';

export interface GuardrailResult {
  passed: boolean;
  level: GuardrailLevel;
  message: string;
  blockedReason?: string;
}

export interface ActionRequest {
  type: 'file_write' | 'file_delete' | 'command' | 'api_call' | 'browser';
  target: string;
  payload?: unknown;
  riskProfile?: RiskProfile;
}

// Dangerous patterns that should be blocked
const BLOCKED_PATTERNS = [
  /rm\s+-rf\s+\//,          // Root deletion
  /format\s+[a-z]:/i,       // Drive formatting
  /DROP\s+DATABASE/i,       // Database drop
  /DELETE\s+FROM.*WHERE\s+1=1/i, // Mass delete
  /eval\(/,                 // Eval injection
  /process\.env\./,         // Env variable access in output
];

const SENSITIVE_PATHS = [
  '.env',
  '.git/config',
  'id_rsa',
  'private.key',
  'credentials',
  'secrets',
];

export class Guardrails {
  /**
   * Validate at reasoning layer (before planning)
   */
  validateReasoning(instruction: string): GuardrailResult {
    const lower = instruction.toLowerCase();
    
    // 1. Check for Destructive Intent (Root/System)
    const destructivePatterns = [
        /delete.*(root|system|everything|all files)/i,
        /wipe.*(disk|drive|partition)/i,
        /rm\s+-rf\s+[\/\\]/i,
        /format\s+[c-z]:/i,
        /shred\s+/i,
        /truncate.*(table|database)/i,
        /remove.*(important|core|essential).*(file|folder)/i
    ];

    if (destructivePatterns.some(p => p.test(instruction))) {
      return {
        passed: false,
        level: 'reasoning',
        message: 'Blocked: Destructive instruction detected',
        blockedReason: 'Mass deletion or system damage risk'
      };
    }

    // 2. Check for Credential/Secret Dumping
    const secretPatterns = [
        /print.*(env|environment|variable).*(secret|key|token|pat|password)/i,
        /dump.*(database|cred)/i,
        /show.*(keys|secrets)/i,
        /debug.*(env|process\.env)/i
    ];

    if (secretPatterns.some(p => p.test(instruction))) {
        return {
            passed: false,
            level: 'reasoning',
            message: 'Blocked: Potential credential exposure',
            blockedReason: 'Request to dump secrets or environment variables'
        };
    }

    // 3. Check for Jailbreak/Hypothetical Bypass
    const jailbreakPatterns = [
        /ignore.*(rule|guardrail|safety|restriction)/i,
        /hypothetically/i,
        /perform.*demonstration/i,
        /do.*not.*restrict/i,
        /bypass.*security/i,
        /act.*as.*if/i, // Persona-based jailbreak
        /switch.*to.*(unfiltered|unrestricted|god).*mode/i,
        /override.*core.*protocol/i
    ];

    if (jailbreakPatterns.some(p => p.test(instruction))) {
        return {
            passed: false,
            level: 'reasoning',
            message: 'Blocked: Jailbreak attempt detected',
            blockedReason: 'Attempt to bypass safety rules or override core protocols'
        };
    }

    return { passed: true, level: 'reasoning', message: 'Reasoning validated' };
  }

  /**
   * Validate at action layer (before execution)
   */
  validateAction(action: ActionRequest): GuardrailResult {
    // Check blocked patterns
    const payload = String(action.payload || '');
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(payload) || pattern.test(action.target)) {
        return {
          passed: false,
          level: 'action',
          message: 'Blocked: Dangerous pattern detected',
          blockedReason: `Pattern ${pattern.source} matched`
        };
      }
    }

    // Check sensitive paths
    for (const sensitive of SENSITIVE_PATHS) {
      if (action.target.includes(sensitive)) {
        return {
          passed: false,
          level: 'action',
          message: 'Blocked: Sensitive file access',
          blockedReason: `Access to ${sensitive} requires explicit approval`
        };
      }
    }

    // 3. UI/UX Specific Validation (Phase 10 Hardening)
    if (action.type === 'file_write' && (action.target.endsWith('.astro') || action.target.endsWith('.css') || action.target.endsWith('.tsx'))) {
        const uiCheck = this.validateUIPayload(payload);
        if (!uiCheck.passed) return uiCheck;
    }

    // High-risk actions need checkpoint
    if (action.riskProfile?.level === 'CRITICAL') {
      return {
        passed: false,
        level: 'action',
        message: 'Blocked: Critical risk requires human approval',
        blockedReason: 'Critical risk level'
      };
    }

    return { passed: true, level: 'action', message: 'Action validated' };
  }

  /**
   * Validate at system layer (output sanitization)
   */
  validateOutput(output: string): GuardrailResult {
    // Check for leaked secrets patterns
    const secretPatterns = [
      /github_pat_[a-zA-Z0-9]+/,
      /sk-[a-zA-Z0-9]+/,
      /AKIA[A-Z0-9]+/,
      /-----BEGIN.*PRIVATE KEY-----/,
    ];

    for (const pattern of secretPatterns) {
      if (pattern.test(output)) {
        return {
          passed: false,
          level: 'system',
          message: 'Blocked: Secret leak detected in output',
          blockedReason: 'Potential credential exposure'
        };
      }
    }

    return { passed: true, level: 'system', message: 'Output validated' };
  }

  /**
   * Validate UI-specific content for best practices (Mobile-first, Contrast, Tokens)
   */
  private validateUIPayload(content: string): GuardrailResult {
      // 1. Mobile-First Check
      // Block if desktop-only grids are used without a mobile fallback
      if (content.includes('grid-cols-') && !content.includes('grid-cols-1') && !content.includes('grid-cols-2')) {
          if (/grid-cols-[3-9]/.test(content) && !/md:grid-cols-/.test(content)) {
              return {
                  passed: false,
                  level: 'action',
                  message: 'Blocked: Non-Mobile-First layout detected',
                  blockedReason: 'Grid configuration must start with mobile-first (cols-1 or cols-2) before desktop variants.'
              };
          }
      }

      // 2. Raw Hex Detection (Design System Compliance)
      const hexMatch = content.match(/#[a-fA-F0-9]{3,6}/g);
      if (hexMatch && hexMatch.length > 5) { // Allow a few, but block mass hallucination
          return {
              passed: false,
              level: 'action',
              message: 'Blocked: Excessive raw hex codes used',
              blockedReason: 'Use Design System tokens (--color-*) or Tailwind semantic classes instead of raw hex.'
          };
      }

      // 3. Contrast Check (Basic detection for black-on-black in styles)
      if (content.includes('background-color: black') && content.includes('color: black')) {
          return {
              passed: false,
              level: 'action',
              message: 'Blocked: CRITICAL UI BUG - Black on Black detected',
              blockedReason: 'Foreground and background colors are identical or too similar.'
          };
      }

      return { passed: true, level: 'action', message: 'UI validated' };
  }

  /**
   * Run all guardrail layers
   */
  validateAll(instruction: string, action: ActionRequest, output: string): GuardrailResult[] {
    return [
      this.validateReasoning(instruction),
      this.validateAction(action),
      this.validateOutput(output)
    ];
  }
}

export const guardrails = new Guardrails();
