/**
 * Brainstorming Reasoning Engine
 *
 * Implements multi-domain search with BM25 ranking from UI UX Pro Max patterns.
 * Performs parallel domain analysis for comprehensive requirement understanding.
 *
 * @module skills/brainstorming/reasoning-engine
 */

export interface DomainMatch {
    domain: string;
    score: number;
    keywords: string[];
    suggestedAgents: string[];
    antiPatterns: string[];
}

export interface BrainstormContext {
    type: 'greenfield' | 'feature' | 'refactor' | 'debug' | 'research';
    domains: DomainMatch[];
    complexity: 'simple' | 'moderate' | 'complex';
    priority: 'P0' | 'P1' | 'P2' | 'P3';
    blockers: string[];
    deferrable: string[];
}

/**
 * Domain definitions with keywords, agents, and anti-patterns
 */
const DOMAIN_REGISTRY: Record<string, {
    keywords: string[];
    agents: string[];
    antiPatterns: string[];
    weight: number;
}> = {
    'authentication': {
        keywords: ['login', 'signup', 'auth', 'password', 'oauth', 'jwt', '2fa', 'session', 'token'],
        agents: ['security-auditor', 'backend-specialist'],
        antiPatterns: ['storing passwords in plain text', 'using MD5 for hashing', 'no rate limiting'],
        weight: 1.5
    },
    'ui-components': {
        keywords: ['button', 'card', 'form', 'modal', 'layout', 'component', 'style', 'tailwind', 'css'],
        agents: ['frontend-specialist', 'design-expert'],
        antiPatterns: ['inline styles everywhere', 'no accessibility', 'inconsistent spacing'],
        weight: 1.0
    },
    'api-design': {
        keywords: ['endpoint', 'api', 'rest', 'graphql', 'route', 'post', 'get', 'crud'],
        agents: ['backend-specialist', 'api-architect'],
        antiPatterns: ['no versioning', 'inconsistent error formats', 'no rate limiting'],
        weight: 1.2
    },
    'database': {
        keywords: ['schema', 'migration', 'query', 'table', 'prisma', 'sql', 'mongodb', 'index'],
        agents: ['database-architect', 'backend-specialist'],
        antiPatterns: ['N+1 queries', 'no indexes', 'missing migrations', 'no foreign keys'],
        weight: 1.3
    },
    'performance': {
        keywords: ['slow', 'optimize', 'cache', 'performance', 'bundle', 'lazy', 'speed'],
        agents: ['performance-optimizer', 'frontend-specialist'],
        antiPatterns: ['no code splitting', 'unoptimized images', 'blocking renders'],
        weight: 1.1
    },
    'testing': {
        keywords: ['test', 'unit', 'e2e', 'coverage', 'jest', 'playwright', 'vitest'],
        agents: ['test-engineer', 'qa-specialist'],
        antiPatterns: ['no tests', 'testing implementation details', 'flaky tests'],
        weight: 1.0
    },
    'deployment': {
        keywords: ['deploy', 'ci/cd', 'docker', 'kubernetes', 'vercel', 'production'],
        agents: ['devops-engineer', 'cicd-automation'],
        antiPatterns: ['no staging environment', 'manual deployments', 'no rollback plan'],
        weight: 1.2
    },
    'security': {
        keywords: ['security', 'vulnerability', 'xss', 'csrf', 'injection', 'exploit'],
        agents: ['security-auditor', 'sentinel-auditor'],
        antiPatterns: ['eval usage', 'no input validation', 'exposed secrets'],
        weight: 1.5
    },
    'realtime': {
        keywords: ['websocket', 'realtime', 'socket', 'live', 'notification', 'push'],
        agents: ['backend-specialist', 'architecture'],
        antiPatterns: ['no reconnection logic', 'missing heartbeat', 'memory leaks'],
        weight: 1.3
    },
    'content': {
        keywords: ['cms', 'blog', 'content', 'markdown', 'editor', 'rich-text'],
        agents: ['content-crafter', 'frontend-specialist'],
        antiPatterns: ['no sanitization', 'XSS in rich text', 'no draft workflow'],
        weight: 1.0
    },
    'seo': {
        keywords: ['seo', 'meta', 'sitemap', 'robots', 'og', 'structured-data'],
        agents: ['seo-fundamentals', 'programmatic-seo'],
        antiPatterns: ['missing meta tags', 'no canonical urls', 'broken links'],
        weight: 1.0
    },
    'mobile': {
        keywords: ['mobile', 'responsive', 'touch', 'gesture', 'ios', 'android', 'react-native'],
        agents: ['mobile-developer', 'frontend-specialist'],
        antiPatterns: ['no touch targets', 'fixed widths', 'no offline support'],
        weight: 1.1
    }
};

/**
 * BM25 Scoring Implementation
 * Adapted from UI UX Pro Max ranking system
 */
export function calculateBM25Score(
    query: string,
    document: string[],
    k1: number = 1.2,
    b: number = 0.75,
    avgDocLength: number = 10
): number {
    const queryTerms = query.toLowerCase().split(/\s+/);
    const docTerms = document.map(d => d.toLowerCase());
    const docLength = docTerms.length;

    let score = 0;

    for (const term of queryTerms) {
        const termFreq = docTerms.filter(t => t.includes(term) || term.includes(t)).length;
        if (termFreq > 0) {
            const idf = Math.log((12 - docTerms.length + 0.5) / (docTerms.length + 0.5) + 1);
            const numerator = termFreq * (k1 + 1);
            const denominator = termFreq + k1 * (1 - b + b * (docLength / avgDocLength));
            score += idf * (numerator / denominator);
        }
    }

    return score;
}

/**
 * Multi-Domain Search (5 parallel searches like UI UX Pro Max)
 */
export function performMultiDomainSearch(userRequest: string): DomainMatch[] {
    const results: DomainMatch[] = [];

    for (const [domain, config] of Object.entries(DOMAIN_REGISTRY)) {
        const score = calculateBM25Score(userRequest, config.keywords) * config.weight;

        if (score > 0) {
            const matchedKeywords = config.keywords.filter(kw =>
                userRequest.toLowerCase().includes(kw.toLowerCase())
            );

            results.push({
                domain,
                score,
                keywords: matchedKeywords,
                suggestedAgents: config.agents,
                antiPatterns: config.antiPatterns
            });
        }
    }

    // Sort by score (BM25 ranking)
    return results.sort((a, b) => b.score - a.score);
}

/**
 * Determine request context (from Gist workflow patterns)
 */
export function determineContext(userRequest: string): BrainstormContext['type'] {
    const request = userRequest.toLowerCase();

    if (/new project|from scratch|greenfield|create new|start fresh/i.test(request)) {
        return 'greenfield';
    }
    if (/add feature|implement|build|create|new functionality/i.test(request)) {
        return 'feature';
    }
    if (/refactor|restructure|reorganize|clean up|improve/i.test(request)) {
        return 'refactor';
    }
    if (/bug|error|not working|broken|fix|debug/i.test(request)) {
        return 'debug';
    }

    return 'research';
}

/**
 * Assess complexity (from Antigravity Kit patterns)
 */
export function assessComplexity(domains: DomainMatch[]): BrainstormContext['complexity'] {
    if (domains.length >= 3) return 'complex';
    if (domains.length === 2) return 'moderate';
    return 'simple';
}

/**
 * Generate priority-ranked decision points
 */
export function generateDecisionPoints(
    userRequest: string,
    domains: DomainMatch[]
): { blockers: string[]; deferrable: string[] } {
    const blockers: string[] = [];
    const deferrable: string[] = [];

    // P0 - Blocking decisions based on domain
    if (domains.some(d => d.domain === 'authentication')) {
        blockers.push('Authentication method (OAuth vs Email/Password vs Magic Link)');
        blockers.push('Session storage strategy (JWT vs Session cookies)');
    }

    if (domains.some(d => d.domain === 'database')) {
        blockers.push('Database selection (SQL vs NoSQL)');
        blockers.push('ORM/Query layer (Prisma, Drizzle, raw SQL)');
    }

    if (domains.some(d => d.domain === 'deployment')) {
        blockers.push('Hosting platform (Vercel, AWS, self-hosted)');
    }

    // P2/P3 - Deferrable decisions
    if (domains.some(d => d.domain === 'performance')) {
        deferrable.push('Caching strategy (can optimize later)');
    }

    if (domains.some(d => d.domain === 'testing')) {
        deferrable.push('Test coverage targets (can increase iteratively)');
    }

    if (domains.some(d => d.domain === 'seo')) {
        deferrable.push('Advanced SEO (structured data, analytics)');
    }

    return { blockers, deferrable };
}

/**
 * Full brainstorm analysis - combines all learnings
 */
export function analyzeBrainstormRequest(userRequest: string): BrainstormContext {
    const domains = performMultiDomainSearch(userRequest);
    const type = determineContext(userRequest);
    const complexity = assessComplexity(domains);
    const { blockers, deferrable } = generateDecisionPoints(userRequest, domains);

    // Determine priority based on request urgency
    let priority: BrainstormContext['priority'] = 'P2';
    if (/urgent|critical|asap|blocking/i.test(userRequest)) {
        priority = 'P0';
    } else if (/important|needed|must/i.test(userRequest)) {
        priority = 'P1';
    } else if (/nice to have|optional|later/i.test(userRequest)) {
        priority = 'P3';
    }

    return {
        type,
        domains,
        complexity,
        priority,
        blockers,
        deferrable
    };
}

/**
 * Format brainstorm analysis for display
 */
export function formatBrainstormAnalysis(context: BrainstormContext): string {
    const domainList = context.domains
        .slice(0, 5)
        .map(d => `  - **${d.domain}** (score: ${d.score.toFixed(2)}) → ${d.suggestedAgents.join(', ')}`)
        .join('\n');

    const antiPatterns = context.domains
        .slice(0, 3)
        .flatMap(d => d.antiPatterns.slice(0, 2))
        .map(ap => `  ⚠️ ${ap}`)
        .join('\n');

    return `
## 🧠 Brainstorm Analysis

**Context Type**: ${context.type}
**Complexity**: ${context.complexity}
**Priority**: ${context.priority}

### Detected Domains (BM25 Ranked)
${domainList}

### 🔴 Blocking Decisions (Must Answer Before Implementation)
${context.blockers.map(b => `- ${b}`).join('\n') || '- None detected'}

### 🟢 Deferrable Decisions (Can Decide Later)
${context.deferrable.map(d => `- ${d}`).join('\n') || '- None detected'}

### ⚠️ Anti-Patterns to Avoid
${antiPatterns || '  None detected'}
`.trim();
}

export default {
    analyzeBrainstormRequest,
    formatBrainstormAnalysis,
    performMultiDomainSearch,
    calculateBM25Score
};
