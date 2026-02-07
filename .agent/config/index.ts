import { z } from 'zod';

const retryPolicySchema = z.object({
  maxAttempts: z.number().default(3),
  backoffMs: z.number().default(1000),
});

const orchestrationSchema = z.object({
  maxAgents: z.number().default(4),
});

const googleSchema = z.object({
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  projectId: z.string().optional(),
  redirectUri: z.string().default('http://localhost'),
});

const configSchema = z.object({
  retryPolicy: retryPolicySchema,
  orchestration: orchestrationSchema,
  google: googleSchema,
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});

export type AppConfig = z.infer<typeof configSchema>;

// Load from process.env or defaults
const defaultConfig: AppConfig = {
  retryPolicy: {
    maxAttempts: Number(process.env.RETRY_MAX_ATTEMPTS) || 3,
    backoffMs: Number(process.env.RETRY_BACKOFF_MS) || 1000,
  },
  orchestration: {
    maxAgents: Number(process.env.ORCHESTRATION_MAX_AGENTS) || 4,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    projectId: process.env.GOOGLE_PROJECT_ID,
    redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost',
  },
  logLevel: (process.env.LOG_LEVEL as any) || 'info',
};

export const config = defaultConfig;
