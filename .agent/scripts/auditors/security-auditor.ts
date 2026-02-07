/**
 * Elite Workforce - Security Auditor
 *
 * Security audit including:
 * - Exposed secrets/API keys
 * - Hardcoded credentials
 * - Vulnerable dependencies
 * - Unsafe patterns (eval, innerHTML)
 * - HTTPS enforcement
 * - CSP headers
 *
 * @module scripts/auditors/security-auditor
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

// ========================================
// TYPES & INTERFACES
// ========================================

export interface SecurityAuditResult {
    score: number;
    category: 'Security';
    issues: SecurityIssue[];
    warnings: SecurityIssue[];
    suggestions: SecurityIssue[];
    metrics: SecurityMetrics;
}

export interface SecurityIssue {
    id: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    category: 'secrets' | 'injection' | 'dependencies' | 'headers' | 'config' | 'auth';
    message: string;
    file?: string;
    line?: number;
    code?: string;
    fix?: string;
}

export interface SecurityMetrics {
    filesScanned: number;
    secretsFound: number;
    unsafePatternsFound: number;
    hasEnvExample: boolean;
    hasGitignoreEnv: boolean;
    vulnerableDependencies: number;
}

// ========================================
// SECRET PATTERNS
// ========================================

const SECRET_PATTERNS = [
    // API Keys
    { pattern: /api[_-]?key\s*[=:]\s*["'][a-zA-Z0-9_-]{20,}["']/gi, name: 'API Key' },
    { pattern: /apikey\s*[=:]\s*["'][a-zA-Z0-9_-]{20,}["']/gi, name: 'API Key' },

    // AWS
    { pattern: /AKIA[0-9A-Z]{16}/g, name: 'AWS Access Key' },
    { pattern: /aws[_-]?secret[_-]?access[_-]?key\s*[=:]\s*["'][^"']+["']/gi, name: 'AWS Secret' },

    // Database
    { pattern: /mongodb(\+srv)?:\/\/[^:]+:[^@]+@/gi, name: 'MongoDB Connection String' },
    { pattern: /postgres(ql)?:\/\/[^:]+:[^@]+@/gi, name: 'PostgreSQL Connection String' },
    { pattern: /mysql:\/\/[^:]+:[^@]+@/gi, name: 'MySQL Connection String' },

    // Auth tokens
    { pattern: /bearer\s+[a-zA-Z0-9_-]{20,}/gi, name: 'Bearer Token' },
    { pattern: /jwt[_-]?secret\s*[=:]\s*["'][^"']+["']/gi, name: 'JWT Secret' },
    { pattern: /auth[_-]?token\s*[=:]\s*["'][a-zA-Z0-9_-]{20,}["']/gi, name: 'Auth Token' },

    // Private keys
    { pattern: /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/g, name: 'Private Key' },
    { pattern: /-----BEGIN\s+OPENSSH\s+PRIVATE\s+KEY-----/g, name: 'SSH Private Key' },

    // Common services
    { pattern: /sk_live_[a-zA-Z0-9]{24,}/g, name: 'Stripe Secret Key' },
    { pattern: /pk_live_[a-zA-Z0-9]{24,}/g, name: 'Stripe Publishable Key (Live)' },
    { pattern: /ghp_[a-zA-Z0-9]{36}/g, name: 'GitHub Personal Access Token' },
    { pattern: /gho_[a-zA-Z0-9]{36}/g, name: 'GitHub OAuth Token' },
    { pattern: /xox[baprs]-[a-zA-Z0-9-]+/g, name: 'Slack Token' },
    { pattern: /sk-[a-zA-Z0-9]{48}/g, name: 'OpenAI API Key' },

    // Generic secrets
    { pattern: /password\s*[=:]\s*["'][^"']{8,}["']/gi, name: 'Hardcoded Password' },
    { pattern: /secret\s*[=:]\s*["'][^"']{8,}["']/gi, name: 'Hardcoded Secret' },
    { pattern: /private[_-]?key\s*[=:]\s*["'][^"']+["']/gi, name: 'Private Key Value' },
];

// ========================================
// UNSAFE PATTERNS
// ========================================

const UNSAFE_PATTERNS = [
    // XSS vulnerabilities
    { pattern: /\.innerHTML\s*=/g, name: 'innerHTML assignment', severity: 'high' as const, category: 'injection' as const },
    { pattern: /dangerouslySetInnerHTML/g, name: 'dangerouslySetInnerHTML', severity: 'medium' as const, category: 'injection' as const },
    { pattern: /v-html\s*=/g, name: 'Vue v-html directive', severity: 'medium' as const, category: 'injection' as const },
    { pattern: /\{@html/g, name: 'Svelte @html', severity: 'medium' as const, category: 'injection' as const },
    { pattern: /set:html\s*=/g, name: 'Astro set:html', severity: 'medium' as const, category: 'injection' as const },

    // Code execution
    { pattern: /\beval\s*\(/g, name: 'eval()', severity: 'critical' as const, category: 'injection' as const },
    { pattern: /new\s+Function\s*\(/g, name: 'new Function()', severity: 'high' as const, category: 'injection' as const },
    { pattern: /setTimeout\s*\(\s*["'`]/g, name: 'setTimeout with string', severity: 'high' as const, category: 'injection' as const },
    { pattern: /setInterval\s*\(\s*["'`]/g, name: 'setInterval with string', severity: 'high' as const, category: 'injection' as const },

    // SQL injection
    { pattern: /\$\{.*\}.*SELECT|SELECT.*\$\{/gi, name: 'Potential SQL injection', severity: 'critical' as const, category: 'injection' as const },
    { pattern: /\+.*["'].*SELECT|SELECT.*["'].*\+/gi, name: 'String concatenation in SQL', severity: 'high' as const, category: 'injection' as const },

    // Command injection
    { pattern: /exec\s*\(\s*["'`].*\$\{/g, name: 'Potential command injection', severity: 'critical' as const, category: 'injection' as const },
    { pattern: /spawn\s*\(\s*["'`].*\$\{/g, name: 'Potential command injection', severity: 'critical' as const, category: 'injection' as const },

    // Insecure HTTP
    { pattern: /http:\/\/(?!localhost|127\.0\.0\.1)/g, name: 'Insecure HTTP URL', severity: 'medium' as const, category: 'config' as const },
];

// ========================================
// SECURITY AUDITOR CLASS
// ========================================

export class SecurityAuditor {
    private projectPath: string;
    private issues: SecurityIssue[] = [];
    private warnings: SecurityIssue[] = [];
    private suggestions: SecurityIssue[] = [];
    private metrics: SecurityMetrics = {
        filesScanned: 0,
        secretsFound: 0,
        unsafePatternsFound: 0,
        hasEnvExample: false,
        hasGitignoreEnv: false,
        vulnerableDependencies: 0,
    };

    constructor(projectPath: string) {
        this.projectPath = projectPath;
    }

    /**
     * Run full security audit
     */
    async audit(): Promise<SecurityAuditResult> {
        console.log('🔒 Running Security Audit...\n');

        // Check environment setup
        this.checkEnvSetup();

        // Check gitignore
        this.checkGitignore();

        // Scan source files
        const srcPath = join(this.projectPath, 'src');
        if (existsSync(srcPath)) {
            await this.scanDirectory(srcPath);
        }

        // Scan root config files
        await this.scanConfigFiles();

        // Check dependencies
        await this.checkDependencies();

        // Calculate score
        const score = this.calculateScore();

        console.log(`   📁 Files Scanned: ${this.metrics.filesScanned}`);
        console.log(`   🔑 Secrets Found: ${this.metrics.secretsFound}`);
        console.log(`   ⚠️  Unsafe Patterns: ${this.metrics.unsafePatternsFound}`);
        console.log(`   📋 .env.example: ${this.metrics.hasEnvExample ? '✅' : '❌'}`);
        console.log(`   🙈 .gitignore .env: ${this.metrics.hasGitignoreEnv ? '✅' : '❌'}`);

        return {
            score,
            category: 'Security',
            issues: this.issues,
            warnings: this.warnings,
            suggestions: this.suggestions,
            metrics: this.metrics,
        };
    }

    /**
     * Check environment file setup
     */
    private checkEnvSetup(): void {
        // Check for .env file (should not be committed)
        const envPath = join(this.projectPath, '.env');
        if (existsSync(envPath)) {
            this.warnings.push({
                id: 'env-file-exists',
                severity: 'medium',
                category: 'secrets',
                message: '.env file exists - ensure it is in .gitignore',
                file: '.env',
            });
        }

        // Check for .env.example
        const envExamplePath = join(this.projectPath, '.env.example');
        if (existsSync(envExamplePath)) {
            this.metrics.hasEnvExample = true;

            // Verify .env.example doesn't contain real secrets
            const content = readFileSync(envExamplePath, 'utf-8');
            for (const { pattern, name } of SECRET_PATTERNS) {
                if (pattern.test(content)) {
                    this.issues.push({
                        id: `secret-in-example-${name}`,
                        severity: 'high',
                        category: 'secrets',
                        message: `${name} found in .env.example - this should only contain placeholders`,
                        file: '.env.example',
                    });
                }
                pattern.lastIndex = 0; // Reset regex
            }
        } else {
            this.suggestions.push({
                id: 'no-env-example',
                severity: 'low',
                category: 'config',
                message: 'Consider adding .env.example to document required environment variables',
                fix: 'Create .env.example with placeholder values',
            });
        }
    }

    /**
     * Check gitignore for sensitive files
     */
    private checkGitignore(): void {
        const gitignorePath = join(this.projectPath, '.gitignore');

        if (existsSync(gitignorePath)) {
            const content = readFileSync(gitignorePath, 'utf-8');

            // Check for .env
            if (/^\.env$/m.test(content) || /^\.env\.\*$/m.test(content) || /^\.env\.local$/m.test(content)) {
                this.metrics.hasGitignoreEnv = true;
            } else {
                this.issues.push({
                    id: 'gitignore-no-env',
                    severity: 'high',
                    category: 'secrets',
                    message: '.gitignore should include .env files',
                    file: '.gitignore',
                    fix: 'Add ".env" and ".env.*" to .gitignore',
                });
            }

            // Check for other sensitive patterns
            const shouldIgnore = [
                { pattern: /\.pem$/m, name: 'PEM files' },
                { pattern: /\.key$/m, name: 'Key files' },
                { pattern: /credentials/m, name: 'Credentials files' },
            ];

            for (const { pattern, name } of shouldIgnore) {
                if (!pattern.test(content)) {
                    this.suggestions.push({
                        id: `gitignore-missing-${name}`,
                        severity: 'low',
                        category: 'config',
                        message: `Consider adding ${name} pattern to .gitignore`,
                    });
                }
            }
        } else {
            this.issues.push({
                id: 'no-gitignore',
                severity: 'high',
                category: 'config',
                message: 'No .gitignore file found',
                fix: 'Create .gitignore with standard ignores',
            });
        }
    }

    /**
     * Scan directory for security issues
     */
    private async scanDirectory(dir: string): Promise<void> {
        try {
            const items = readdirSync(dir);

            for (const item of items) {
                // Skip node_modules and hidden directories
                if (item === 'node_modules' || item.startsWith('.')) continue;

                const fullPath = join(dir, item);
                const stat = statSync(fullPath);

                if (stat.isDirectory()) {
                    await this.scanDirectory(fullPath);
                } else {
                    const ext = extname(item).toLowerCase();
                    if (['.ts', '.tsx', '.js', '.jsx', '.astro', '.vue', '.svelte', '.mjs', '.cjs'].includes(ext)) {
                        await this.scanFile(fullPath);
                    }
                }
            }
        } catch (e) {
            // Skip inaccessible directories
        }
    }

    /**
     * Scan a single file
     */
    private async scanFile(filePath: string): Promise<void> {
        try {
            const content = readFileSync(filePath, 'utf-8');
            const relativePath = filePath.replace(this.projectPath, '');
            this.metrics.filesScanned++;

            // Check for secrets
            for (const { pattern, name } of SECRET_PATTERNS) {
                const matches = content.match(pattern);
                if (matches) {
                    this.metrics.secretsFound += matches.length;
                    this.issues.push({
                        id: `secret-${name}-${relativePath}`,
                        severity: 'critical',
                        category: 'secrets',
                        message: `Potential ${name} found in source code`,
                        file: relativePath,
                        code: matches[0].substring(0, 50) + '...',
                        fix: 'Move to environment variable',
                    });
                }
                pattern.lastIndex = 0; // Reset regex
            }

            // Check for unsafe patterns
            for (const { pattern, name, severity, category } of UNSAFE_PATTERNS) {
                const matches = content.match(pattern);
                if (matches) {
                    this.metrics.unsafePatternsFound += matches.length;

                    const issue: SecurityIssue = {
                        id: `unsafe-${name}-${relativePath}`,
                        severity,
                        category,
                        message: `Unsafe pattern: ${name}`,
                        file: relativePath,
                    };

                    if (severity === 'critical' || severity === 'high') {
                        this.issues.push(issue);
                    } else {
                        this.warnings.push(issue);
                    }
                }
                pattern.lastIndex = 0; // Reset regex
            }

        } catch (e) {
            // Skip unreadable files
        }
    }

    /**
     * Scan config files
     */
    private async scanConfigFiles(): Promise<void> {
        const configFiles = [
            'astro.config.mjs',
            'astro.config.ts',
            'next.config.js',
            'vite.config.ts',
            'vercel.json',
            'netlify.toml',
        ];

        for (const configFile of configFiles) {
            const configPath = join(this.projectPath, configFile);
            if (existsSync(configPath)) {
                await this.scanFile(configPath);
            }
        }
    }

    /**
     * Check dependencies for known vulnerabilities
     */
    private async checkDependencies(): Promise<void> {
        const packageJsonPath = join(this.projectPath, 'package.json');

        if (!existsSync(packageJsonPath)) return;

        try {
            const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
            const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

            // Known vulnerable patterns (simplified check)
            const vulnerablePatterns = [
                { name: 'lodash', version: '<4.17.21', issue: 'Prototype pollution' },
                { name: 'axios', version: '<0.21.1', issue: 'SSRF vulnerability' },
                { name: 'minimist', version: '<1.2.6', issue: 'Prototype pollution' },
                { name: 'node-fetch', version: '<2.6.7', issue: 'Bypass vulnerability' },
            ];

            for (const { name, version, issue } of vulnerablePatterns) {
                if (allDeps[name]) {
                    // Simplified version check (would need semver for proper check)
                    this.suggestions.push({
                        id: `dep-check-${name}`,
                        severity: 'low',
                        category: 'dependencies',
                        message: `Check if ${name} is up to date (${issue} in ${version})`,
                        fix: `npm update ${name}`,
                    });
                }
            }

            // Suggest running npm audit
            this.suggestions.push({
                id: 'run-npm-audit',
                severity: 'low',
                category: 'dependencies',
                message: 'Run "npm audit" to check for vulnerable dependencies',
                fix: 'npm audit --fix',
            });

        } catch (e) {
            // Skip if package.json is invalid
        }
    }

    /**
     * Calculate security score
     */
    private calculateScore(): number {
        let score = 100;

        // Heavy deductions for critical issues
        for (const issue of this.issues) {
            if (issue.severity === 'critical') score -= 25;
            else if (issue.severity === 'high') score -= 15;
            else if (issue.severity === 'medium') score -= 10;
            else score -= 5;
        }

        // Moderate deductions for warnings
        score -= this.warnings.length * 3;

        // Small deductions for suggestions
        score -= this.suggestions.length * 1;

        // Bonus for good practices
        if (this.metrics.hasEnvExample) score += 5;
        if (this.metrics.hasGitignoreEnv) score += 10;
        if (this.metrics.secretsFound === 0) score += 10;

        return Math.max(0, Math.min(100, Math.round(score)));
    }
}

// ========================================
// EXPORT FUNCTION
// ========================================

export async function runSecurityAudit(projectPath: string): Promise<SecurityAuditResult> {
    const auditor = new SecurityAuditor(projectPath);
    return auditor.audit();
}
