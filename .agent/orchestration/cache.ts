/**
 * Elite Workforce - Intelligent Caching System
 *
 * Reduces AI token usage by caching:
 * - Skill resolutions (which skill handles what)
 * - File content hashes (avoid re-reading unchanged files)
 * - Audit results (reuse within TTL)
 * - Routing decisions (same request = same route)
 *
 * @module orchestration/cache
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = join(__dirname, 'cache');

// Cache TTL constants (in milliseconds)
const TTL = {
    ROUTING: 1000 * 60 * 60,        // 1 hour - routing decisions
    SKILL: 1000 * 60 * 60 * 24,     // 24 hours - skill resolutions
    FILE_HASH: 1000 * 60 * 5,       // 5 minutes - file content
    AUDIT: 1000 * 60 * 30,          // 30 minutes - audit results
    MCP_DOCS: 1000 * 60 * 60 * 6,   // 6 hours - MCP documentation
    PATTERN: 1000 * 60 * 60 * 24 * 7, // 7 days - learned patterns
} as const;

// Cache entry interface
interface CacheEntry<T> {
    data: T;
    timestamp: number;
    hits: number;
    hash?: string;
}

// Cache statistics for monitoring
interface CacheStats {
    hits: number;
    misses: number;
    evictions: number;
    savedTokens: number;
    lastCleanup: string;
}

/**
 * Multi-tier caching system for token optimization
 */
export class CacheManager {
    private memoryCache: Map<string, CacheEntry<unknown>> = new Map();
    private diskCachePath: string;
    private statsPath: string;
    private maxMemoryEntries = 500;
    private stats: CacheStats;

    constructor() {
        if (!existsSync(CACHE_DIR)) {
            mkdirSync(CACHE_DIR, { recursive: true });
        }

        this.diskCachePath = join(CACHE_DIR, 'disk-cache.json');
        this.statsPath = join(CACHE_DIR, 'cache-stats.json');
        this.stats = this.loadStats();

        // Load disk cache into memory on startup
        this.loadDiskCache();

        // Schedule periodic cleanup
        this.scheduleCleanup();
    }

    // ========================================
    // ROUTING CACHE - Avoid re-analyzing same requests
    // ========================================

    /**
     * Cache a routing decision
     */
    cacheRouting(request: string, decision: unknown): void {
        const key = this.routingKey(request);
        this.set(key, decision, TTL.ROUTING, this.estimateTokens(request));
    }

    /**
     * Get cached routing decision
     */
    getRouting(request: string): unknown | null {
        const key = this.routingKey(request);
        return this.get(key);
    }

    private routingKey(request: string): string {
        // Normalize request for better cache hits
        const normalized = request.toLowerCase().trim().replace(/\s+/g, ' ');
        return `routing:${this.hash(normalized)}`;
    }

    // ========================================
    // SKILL CACHE - Remember skill resolutions
    // ========================================

    /**
     * Cache which skill handles a task type
     */
    cacheSkillResolution(taskType: string, skillName: string): void {
        const key = `skill:${taskType.toLowerCase()}`;
        this.set(key, skillName, TTL.SKILL, 50); // ~50 tokens saved per resolution
    }

    /**
     * Get cached skill for task type
     */
    getSkillResolution(taskType: string): string | null {
        const key = `skill:${taskType.toLowerCase()}`;
        return this.get(key) as string | null;
    }

    // ========================================
    // FILE HASH CACHE - Skip unchanged files
    // ========================================

    /**
     * Check if file has changed since last read
     */
    hasFileChanged(filePath: string): boolean {
        const key = `file:${filePath}`;
        const cached = this.get(key) as { mtime: number; size: number } | null;

        if (!cached) return true;

        try {
            const stats = statSync(filePath);
            return stats.mtimeMs !== cached.mtime || stats.size !== cached.size;
        } catch {
            return true;
        }
    }

    /**
     * Cache file metadata after reading
     */
    cacheFileMetadata(filePath: string): void {
        try {
            const stats = statSync(filePath);
            const key = `file:${filePath}`;
            this.set(key, { mtime: stats.mtimeMs, size: stats.size }, TTL.FILE_HASH, 0);
        } catch {
            // File doesn't exist, skip
        }
    }

    /**
     * Cache file content hash for content-based comparison
     */
    cacheFileContent(filePath: string, content: string): void {
        const key = `content:${filePath}`;
        const contentHash = this.hash(content);
        this.set(key, contentHash, TTL.FILE_HASH, this.estimateTokens(content));
    }

    /**
     * Check if content matches cached hash
     */
    isContentCached(filePath: string, content: string): boolean {
        const key = `content:${filePath}`;
        const cached = this.get(key) as string | null;
        if (!cached) return false;
        return cached === this.hash(content);
    }

    // ========================================
    // AUDIT CACHE - Reuse recent audit results
    // ========================================

    /**
     * Cache audit results for a project
     */
    cacheAuditResult(projectPath: string, auditType: string, result: unknown): void {
        const key = `audit:${auditType}:${this.hash(projectPath)}`;
        this.set(key, result, TTL.AUDIT, 500); // Audits typically save ~500 tokens
    }

    /**
     * Get cached audit result
     */
    getAuditResult(projectPath: string, auditType: string): unknown | null {
        const key = `audit:${auditType}:${this.hash(projectPath)}`;
        return this.get(key);
    }

    /**
     * Invalidate audit cache (e.g., after file changes)
     */
    invalidateAudit(projectPath: string): void {
        const prefix = `audit:`;
        const hashSuffix = this.hash(projectPath);

        for (const key of this.memoryCache.keys()) {
            if (key.startsWith(prefix) && key.endsWith(hashSuffix)) {
                this.memoryCache.delete(key);
            }
        }
    }

    // ========================================
    // MCP DOCS CACHE - Avoid refetching docs
    // ========================================

    /**
     * Cache MCP documentation response
     */
    cacheMcpDocs(query: string, docs: unknown): void {
        const key = `mcp:${this.hash(query)}`;
        this.set(key, docs, TTL.MCP_DOCS, this.estimateTokens(JSON.stringify(docs)));
    }

    /**
     * Get cached MCP docs
     */
    getMcpDocs(query: string): unknown | null {
        const key = `mcp:${this.hash(query)}`;
        return this.get(key);
    }

    // ========================================
    // PATTERN CACHE - Long-term learned patterns
    // ========================================

    /**
     * Cache a learned pattern
     */
    cachePattern(patternType: string, pattern: unknown): void {
        const key = `pattern:${patternType}`;
        this.set(key, pattern, TTL.PATTERN, 100);
    }

    /**
     * Get cached pattern
     */
    getPattern(patternType: string): unknown | null {
        const key = `pattern:${patternType}`;
        return this.get(key);
    }

    // ========================================
    // CORE CACHE OPERATIONS
    // ========================================

    /**
     * Set a cache entry
     */
    private set(key: string, data: unknown, ttl: number, tokensSaved: number): void {
        // Check memory limit
        if (this.memoryCache.size >= this.maxMemoryEntries) {
            this.evictLRU();
        }

        const entry: CacheEntry<unknown> = {
            data,
            timestamp: Date.now(),
            hits: 0,
            hash: this.hash(JSON.stringify(data)),
        };

        this.memoryCache.set(key, entry);
        this.stats.savedTokens += tokensSaved;
    }

    /**
     * Get a cache entry
     */
    private get(key: string): unknown | null {
        const entry = this.memoryCache.get(key);

        if (!entry) {
            this.stats.misses++;
            return null;
        }

        // Check TTL based on key prefix
        const ttl = this.getTTLForKey(key);
        if (Date.now() - entry.timestamp > ttl) {
            this.memoryCache.delete(key);
            this.stats.misses++;
            return null;
        }

        entry.hits++;
        this.stats.hits++;
        return entry.data;
    }

    /**
     * Get TTL for a cache key based on its prefix
     */
    private getTTLForKey(key: string): number {
        if (key.startsWith('routing:')) return TTL.ROUTING;
        if (key.startsWith('skill:')) return TTL.SKILL;
        if (key.startsWith('file:') || key.startsWith('content:')) return TTL.FILE_HASH;
        if (key.startsWith('audit:')) return TTL.AUDIT;
        if (key.startsWith('mcp:')) return TTL.MCP_DOCS;
        if (key.startsWith('pattern:')) return TTL.PATTERN;
        return TTL.ROUTING; // Default
    }

    /**
     * Evict least recently used entries
     */
    private evictLRU(): void {
        const entries = Array.from(this.memoryCache.entries());

        // Sort by hits (ascending) and timestamp (ascending)
        entries.sort((a, b) => {
            const hitDiff = a[1].hits - b[1].hits;
            if (hitDiff !== 0) return hitDiff;
            return a[1].timestamp - b[1].timestamp;
        });

        // Remove bottom 20%
        const toRemove = Math.floor(entries.length * 0.2);
        for (let i = 0; i < toRemove; i++) {
            this.memoryCache.delete(entries[i][0]);
            this.stats.evictions++;
        }
    }

    /**
     * Hash a string for cache keys
     */
    private hash(str: string): string {
        return createHash('md5').update(str).digest('hex').substring(0, 12);
    }

    /**
     * Estimate token count for a string
     */
    private estimateTokens(str: string): number {
        // Rough estimate: ~4 chars per token
        return Math.ceil(str.length / 4);
    }

    // ========================================
    // PERSISTENCE
    // ========================================

    /**
     * Load cache from disk
     */
    private loadDiskCache(): void {
        if (!existsSync(this.diskCachePath)) return;

        try {
            const data = JSON.parse(readFileSync(this.diskCachePath, 'utf-8'));
            const now = Date.now();

            // Only load non-expired entries
            for (const [key, entry] of Object.entries(data)) {
                const e = entry as CacheEntry<unknown>;
                const ttl = this.getTTLForKey(key);
                if (now - e.timestamp < ttl) {
                    this.memoryCache.set(key, e);
                }
            }
        } catch {
            // Corrupted cache, start fresh
        }
    }

    /**
     * Save cache to disk
     */
    saveToDisk(): void {
        const data: Record<string, CacheEntry<unknown>> = {};

        for (const [key, entry] of this.memoryCache.entries()) {
            // Only persist long-lived entries
            if (key.startsWith('skill:') || key.startsWith('pattern:')) {
                data[key] = entry;
            }
        }

        writeFileSync(this.diskCachePath, JSON.stringify(data, null, 2));
        this.saveStats();
    }

    /**
     * Load stats from disk
     */
    private loadStats(): CacheStats {
        if (!existsSync(this.statsPath)) {
            return {
                hits: 0,
                misses: 0,
                evictions: 0,
                savedTokens: 0,
                lastCleanup: new Date().toISOString(),
            };
        }

        try {
            return JSON.parse(readFileSync(this.statsPath, 'utf-8'));
        } catch {
            return {
                hits: 0,
                misses: 0,
                evictions: 0,
                savedTokens: 0,
                lastCleanup: new Date().toISOString(),
            };
        }
    }

    /**
     * Save stats to disk
     */
    private saveStats(): void {
        writeFileSync(this.statsPath, JSON.stringify(this.stats, null, 2));
    }

    /**
     * Schedule periodic cleanup
     */
    private scheduleCleanup(): void {
        // Clean up every 15 minutes
        setInterval(() => {
            this.cleanup();
        }, 1000 * 60 * 15);
    }

    /**
     * Clean up expired entries
     */
    cleanup(): void {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, entry] of this.memoryCache.entries()) {
            const ttl = this.getTTLForKey(key);
            if (now - entry.timestamp > ttl) {
                this.memoryCache.delete(key);
                cleaned++;
            }
        }

        this.stats.lastCleanup = new Date().toISOString();

        // Persist important caches
        this.saveToDisk();

        if (cleaned > 0) {
            console.log(`🧹 Cache cleanup: removed ${cleaned} expired entries`);
        }
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats & { size: number; hitRate: string } {
        const total = this.stats.hits + this.stats.misses;
        const hitRate = total > 0 ? `${Math.round((this.stats.hits / total) * 100)}%` : '0%';

        return {
            ...this.stats,
            size: this.memoryCache.size,
            hitRate,
        };
    }

    /**
     * Clear all cache
     */
    clear(): void {
        this.memoryCache.clear();
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            savedTokens: 0,
            lastCleanup: new Date().toISOString(),
        };
        this.saveToDisk();
    }
}

// Export singleton instance
export const cache = new CacheManager();

// ========================================
// DECORATOR HELPERS FOR EASY CACHING
// ========================================

/**
 * Create a cached version of any async function
 */
export function withCache<T>(
    fn: (...args: unknown[]) => Promise<T>,
    keyGenerator: (...args: unknown[]) => string,
    ttlType: keyof typeof TTL = 'ROUTING'
): (...args: unknown[]) => Promise<T> {
    return async (...args: unknown[]): Promise<T> => {
        const key = keyGenerator(...args);

        // Check cache first
        const cached = cache.getRouting(key);
        if (cached !== null) {
            return cached as T;
        }

        // Execute and cache
        const result = await fn(...args);
        cache.cacheRouting(key, result);
        return result;
    };
}

/**
 * Check if we should skip processing based on cache
 */
export function shouldSkipFile(filePath: string): boolean {
    return !cache.hasFileChanged(filePath);
}

/**
 * Mark file as processed
 */
export function markFileProcessed(filePath: string): void {
    cache.cacheFileMetadata(filePath);
}
