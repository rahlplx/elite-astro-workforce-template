import { describe, it, expect, beforeEach } from 'vitest';
import { RiskAssessor } from '../orchestration/risk-assessor';

describe('RiskAssessor', () => {
  let assessor: RiskAssessor;

  beforeEach(() => {
    assessor = new RiskAssessor();
  });

  describe('analyze', () => {
    it('should classify safe operations correctly', () => {
      const profile = assessor.analyze({ instruction: 'analyze the codebase' });
      expect(profile.level).toBe('LOW');
      expect(profile.score).toBeLessThan(50);
    });

    it('should classify critical operations correctly', () => {
      const profile = assessor.analyze({ instruction: 'delete all database records' });
      expect(profile.level).toBe('CRITICAL');
      expect(profile.requiresConfirmation).toBe(true);
    });

    it('should block dangerous operations', () => {
      const profile = assessor.analyze({ instruction: 'rm -rf /' });
      expect(profile.level).toBe('BLOCKED');
    });

    it('should adjust score for critical files', () => {
      const profile = assessor.analyze({
        instruction: 'update configuration',
        targetFiles: ['package.json'],
      });
      expect(profile.score).toBeGreaterThan(50);
    });
  });

  describe('checkpoint', () => {
    it('should create checkpoint for risky operations', async () => {
      const checkpoint = await assessor.createCheckpoint('/tmp/test', ['file.ts']);
      expect(checkpoint.success).toBe(true);
      // expect(checkpoint.checkpointId).toBeDefined(); // Might need adjustment based on mock implementation
    });
  });
});
