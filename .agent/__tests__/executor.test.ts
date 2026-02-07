import { describe, it, expect } from 'vitest';
import { executor } from '../orchestration/executor';
import { config } from '../config/index';

describe('Executor Module', () => {
  it('should export a singleton instance', () => {
    expect(executor).toBeDefined();
  });

  it('should have access to config', () => {
    expect(config.retryPolicy.maxAttempts).toBe(3);
  });
  
  it('should have execute method', () => {
      expect(typeof executor.execute).toBe('function');
  });
});
