/**
 * Elite Workforce - Project Bootstrap & Auto-Audit
 *
 * Automatically runs when template is added to a project:
 * 1. Detects project type (Astro, framework version, etc.)
 * 2. Scans dependencies and configuration
 * 3. Runs comprehensive audit
 * 4. Generates initial ATLAS_TOKENS.md
 * 5. Prepares project for AI-assisted development
 *
 * @module scripts/bootstrap
 */

import { existsSync, readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, basename } from 'node:path';
import { cache } from '../orchestration/cache.js';

// Import specialized auditors
import { runUIUXAudit, type UIUXAuditResult } from './auditors/ui-ux-auditor.js';
import { runSEOAudit, type SEOAuditResult } from './auditors/seo-auditor.js';
import { runSecurityAudit, type SecurityAuditResult } from './auditors/security-auditor.js';
import { runPerformanceAudit, type PerformanceAuditResult } from './auditors/performance-auditor.js';

// ========================================
// TYPES & INTERFACES
// ========================================

export interface ProjectProfile {
    name: string;
    path: string;
    detected: {
        framework: FrameworkInfo | null;
        styling: StylingInfo | null;
        cms: CMSInfo | null;
        deployment: DeploymentInfo | null;
    };
    stats: ProjectStats;
    health: HealthScore;
    recommendations: string[];
    auditResults: AuditResults;
}

export interface FrameworkInfo {
    name: string;
    version: string;
    isSupported: boolean;
    features: string[];
}

export interface StylingInfo {
    type: 'tailwind' | 'css' | 'scss' | 'styled-components' | 'other';
    version?: string;
    uiLibrary?: string;
    uiLibraryVersion?: string;
}

export interface CMSInfo {
    name: string;
    version?: string;
    contentPath?: string;
}

export interface DeploymentInfo {
    platform: string;
    adapter?: string;
    configured: boolean;
}

export interface ProjectStats {
    totalFiles: number;
    components: number;
    pages: number;
    layouts: number;
    contentCollections: number;
    hasTypeScript: boolean;
    hasTests: boolean;
    hasCICD: boolean;
}

export interface HealthScore {
    overall: number;
    structure: number;
    typescript: number;
    performance: number;
    accessibility: number;
    seo: number;
}

export interface AuditResults {
    issues: AuditIssue[];
    warnings: AuditIssue[];
    suggestions: AuditIssue[];
    autoFixable: AuditIssue[];
    // Detailed auditor results
    uiux?: UIUXAuditResult;
    seo?: SEOAuditResult;
    security?: SecurityAuditResult;
    performance?: PerformanceAuditResult;
}

export interface AuditIssue {
    id: string;
    type: 'error' | 'warning' | 'suggestion';
    category: 
        | 'structure' | 'code' | 'config' | 'style' | 'seo' | 'a11y' | 'perf' | 'security'
        | 'contrast' | 'touch' | 'responsive' | 'consistency' | 'images' | 'forms'
        | 'meta' | 'og' | 'twitter' | 'schema' | 'sitemap' | 'robots' | 'canonical' | 'headings' | 'content'
        | 'secrets' | 'injection' | 'dependencies' | 'headers' | 'auth'
        | 'scripts' | 'styles' | 'fonts' | 'resources' | 'caching' | 'compression';
    message: string;
    file?: string;
    line?: number;
    fix?: string;
    autoFixable: boolean;
}

// ========================================
// PROJECT SCANNER
// ========================================

export class ProjectScanner {
    private projectPath: string;

    constructor(projectPath: string) {
        this.projectPath = projectPath;
    }

    async scan(): Promise<ProjectProfile> {
        console.log('🔍 Scanning project...\n');

        const framework = this.detectFramework();
        const styling = this.detectStyling();
        const cms = this.detectCMS();
        const deployment = this.detectDeployment();

        console.log(`📦 Framework: ${framework?.name || 'Unknown'} ${framework?.version || ''}`);
        console.log(`🎨 Styling: ${styling?.type || 'Unknown'} ${styling?.uiLibrary ? `+ ${styling.uiLibrary}` : ''}`);
        console.log(`📝 CMS: ${cms?.name || 'None detected'}`);
        console.log(`🚀 Deployment: ${deployment?.platform || 'Not configured'}\n`);

        const stats = this.gatherStats();
        console.log(`📊 Stats: ${stats.totalFiles} files, ${stats.components} components, ${stats.pages} pages\n`);

        console.log('🔬 Running audits...');
        const auditResults = await this.runAudits(framework, styling);

        const health = this.calculateHealth(framework, styling, stats, auditResults);
        console.log(`\n💯 Health Score: ${health.overall}/100`);

        const recommendations = this.generateRecommendations(framework, styling, cms, stats, health);

        return {
            name: basename(this.projectPath),
            path: this.projectPath,
            detected: { framework, styling, cms, deployment },
            stats,
            health,
            recommendations,
            auditResults,
        };
    }

    private detectFramework(): FrameworkInfo | null {
        const packageJsonPath = join(this.projectPath, 'package.json');
        if (!existsSync(packageJsonPath)) return null;

        try {
            const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
            const deps = { ...pkg.dependencies, ...pkg.devDependencies };

            if (deps.astro) {
                const version = deps.astro.replace(/[\^~]/g, '');
                const majorVersion = parseInt(version.split('.')[0]);
                return {
                    name: 'Astro',
                    version,
                    isSupported: majorVersion >= 4,
                    features: this.detectAstroFeatures(),
                };
            }

            if (deps.next) return { name: 'Next.js', version: deps.next, isSupported: false, features: [] };
            if (deps.nuxt) return { name: 'Nuxt', version: deps.nuxt, isSupported: false, features: [] };

            return null;
        } catch {
            return null;
        }
    }

    private detectAstroFeatures(): string[] {
        const features: string[] = [];
        const configPath = join(this.projectPath, 'astro.config.mjs');
        const configTsPath = join(this.projectPath, 'astro.config.ts');

        let config = '';
        if (existsSync(configPath)) config = readFileSync(configPath, 'utf-8');
        else if (existsSync(configTsPath)) config = readFileSync(configTsPath, 'utf-8');

        if (config.includes('content:')) features.push('Content Collections');
        if (config.includes('server:')) features.push('Server Mode');
        if (config.includes('prefetch')) features.push('Prefetch');
        if (config.includes('viewTransitions')) features.push('View Transitions');
        if (existsSync(join(this.projectPath, 'src/content'))) features.push('Content Layer');

        return features;
    }

    private detectStyling(): StylingInfo | null {
        const packageJsonPath = join(this.projectPath, 'package.json');
        if (!existsSync(packageJsonPath)) return null;

        try {
            const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
            const deps = { ...pkg.dependencies, ...pkg.devDependencies };

            if (deps.tailwindcss) {
                const info: StylingInfo = {
                    type: 'tailwind',
                    version: deps.tailwindcss.replace(/[\^~]/g, ''),
                };
                if (deps.daisyui) {
                    info.uiLibrary = 'DaisyUI';
                    info.uiLibraryVersion = deps.daisyui.replace(/[\^~]/g, '');
                }
                return info;
            }

            if (deps.sass) return { type: 'scss' };
            return { type: 'css' };
        } catch {
            return null;
        }
    }

    private detectCMS(): CMSInfo | null {
        const packageJsonPath = join(this.projectPath, 'package.json');
        if (!existsSync(packageJsonPath)) return null;

        try {
            const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
            const deps = { ...pkg.dependencies, ...pkg.devDependencies };

            if (deps['@keystatic/core']) {
                return { name: 'Keystatic', version: deps['@keystatic/core'].replace(/[\^~]/g, ''), contentPath: 'src/content' };
            }
            if (deps.sanity) return { name: 'Sanity', version: deps.sanity };
            if (deps.contentful) return { name: 'Contentful', version: deps.contentful };

            return null;
        } catch {
            return null;
        }
    }

    private detectDeployment(): DeploymentInfo | null {
        const packageJsonPath = join(this.projectPath, 'package.json');
        if (!existsSync(packageJsonPath)) return null;

        try {
            const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
            const deps = { ...pkg.dependencies, ...pkg.devDependencies };

            if (deps['@astrojs/vercel'] || existsSync(join(this.projectPath, 'vercel.json'))) {
                return { platform: 'Vercel', adapter: '@astrojs/vercel', configured: existsSync(join(this.projectPath, 'vercel.json')) };
            }
            if (deps['@astrojs/netlify'] || existsSync(join(this.projectPath, 'netlify.toml'))) {
                return { platform: 'Netlify', adapter: '@astrojs/netlify', configured: existsSync(join(this.projectPath, 'netlify.toml')) };
            }

            return null;
        } catch {
            return null;
        }
    }

    private gatherStats(): ProjectStats {
        const stats: ProjectStats = {
            totalFiles: 0, components: 0, pages: 0, layouts: 0, contentCollections: 0,
            hasTypeScript: existsSync(join(this.projectPath, 'tsconfig.json')),
            hasTests: existsSync(join(this.projectPath, 'tests')) || existsSync(join(this.projectPath, 'vitest.config.ts')),
            hasCICD: existsSync(join(this.projectPath, '.github/workflows')),
        };

        const srcPath = join(this.projectPath, 'src');
        if (existsSync(srcPath)) this.countFilesRecursive(srcPath, stats);

        return stats;
    }

    private countFilesRecursive(dir: string, stats: ProjectStats): void {
        try {
            const items = readdirSync(dir);
            for (const item of items) {
                const fullPath = join(dir, item);
                const stat = statSync(fullPath);

                if (stat.isDirectory()) {
                    if (item === 'content' && dir.endsWith('src')) {
                        stats.contentCollections = readdirSync(fullPath).filter(f => statSync(join(fullPath, f)).isDirectory()).length;
                    }
                    this.countFilesRecursive(fullPath, stats);
                } else {
                    stats.totalFiles++;
                    if (item.endsWith('.astro') || item.endsWith('.tsx')) {
                        if (dir.includes('components')) stats.components++;
                        else if (dir.includes('pages')) stats.pages++;
                        else if (dir.includes('layouts')) stats.layouts++;
                    }
                }
            }
        } catch { /* skip */ }
    }

    private async runAudits(framework: FrameworkInfo | null, styling: StylingInfo | null): Promise<AuditResults> {
        const results: AuditResults = { issues: [], warnings: [], suggestions: [], autoFixable: [] };

        // Run basic structural audits
        this.auditStructure(results);
        this.auditConfiguration(results, framework, styling);
        this.auditCode(results);

        // Run specialized auditors in parallel for speed
        console.log('\n   Running specialized auditors...');
        try {
            const [uiuxResult, seoResult, securityResult, performanceResult] = await Promise.all([
                runUIUXAudit(this.projectPath).catch(e => { console.log('   ⚠️  UI/UX audit skipped'); return null; }),
                runSEOAudit(this.projectPath).catch(e => { console.log('   ⚠️  SEO audit skipped'); return null; }),
                runSecurityAudit(this.projectPath).catch(e => { console.log('   ⚠️  Security audit skipped'); return null; }),
                runPerformanceAudit(this.projectPath).catch(e => { console.log('   ⚠️  Performance audit skipped'); return null; }),
            ]);

            // Store detailed results
            if (uiuxResult) {
                results.uiux = uiuxResult;
                results.issues.push(...uiuxResult.issues.map(i => ({ ...i, type: 'error' as const, autoFixable: false })));
                results.warnings.push(...uiuxResult.warnings.map(i => ({ ...i, type: 'warning' as const, autoFixable: false })));
            }

            if (seoResult) {
                results.seo = seoResult;
                results.issues.push(...seoResult.issues.map(i => ({ ...i, type: 'error' as const, autoFixable: false })));
                results.warnings.push(...seoResult.warnings.map(i => ({ ...i, type: 'warning' as const, autoFixable: false })));
            }

            if (securityResult) {
                results.security = securityResult;
                results.issues.push(...securityResult.issues.map(i => ({ ...i, type: 'error' as const, autoFixable: false })));
                results.warnings.push(...securityResult.warnings.map(i => ({ ...i, type: 'warning' as const, autoFixable: !!i.fix })));
            }

            if (performanceResult) {
                results.performance = performanceResult;
                results.issues.push(...performanceResult.issues.map(i => ({ ...i, type: 'error' as const, autoFixable: false })));
                results.warnings.push(...performanceResult.warnings.map(i => ({ ...i, type: 'warning' as const, autoFixable: false })));
            }

            // Display scores
            console.log('\n   📊 Audit Scores:');
            if (uiuxResult) console.log(`      UI/UX: ${uiuxResult.score}/100`);
            if (seoResult) console.log(`      SEO: ${seoResult.score}/100`);
            if (securityResult) console.log(`      Security: ${securityResult.score}/100`);
            if (performanceResult) console.log(`      Performance: ${performanceResult.score}/100`);

        } catch (e) {
            console.log('   ⚠️  Some auditors failed to run');
        }

        results.autoFixable = [...results.issues, ...results.warnings, ...results.suggestions].filter(i => i.autoFixable);

        console.log(`\n   ❌ ${results.issues.length} issues | ⚠️ ${results.warnings.length} warnings | 💡 ${results.suggestions.length} suggestions`);

        return results;
    }

    private auditStructure(results: AuditResults): void {
        const requiredDirs = ['src', 'src/pages', 'src/components'];
        for (const dir of requiredDirs) {
            if (!existsSync(join(this.projectPath, dir))) {
                results.issues.push({ id: `missing-${dir}`, type: 'error', category: 'structure', message: `Missing: ${dir}`, autoFixable: true, fix: `mkdir -p ${dir}` });
            }
        }

        if (!existsSync(join(this.projectPath, '.gitignore'))) {
            results.warnings.push({ id: 'missing-gitignore', type: 'warning', category: 'config', message: 'Missing .gitignore', autoFixable: true });
        }
    }

    private auditConfiguration(results: AuditResults, framework: FrameworkInfo | null, styling: StylingInfo | null): void {
        if (framework?.name === 'Astro' && parseInt(framework.version.split('.')[0]) < 4) {
            results.warnings.push({ id: 'outdated-astro', type: 'warning', category: 'config', message: `Astro ${framework.version} outdated. Upgrade to 5+`, autoFixable: false });
        }

        if (!existsSync(join(this.projectPath, 'tsconfig.json'))) {
            results.suggestions.push({ id: 'no-typescript', type: 'suggestion', category: 'config', message: 'Add TypeScript for type safety', autoFixable: true });
        }
    }

    private auditCode(results: AuditResults): void {
        const pagesDir = join(this.projectPath, 'src/pages');
        if (existsSync(pagesDir)) this.scanDirectoryForIssues(pagesDir, results);
    }

    private scanDirectoryForIssues(dir: string, results: AuditResults): void {
        try {
            for (const item of readdirSync(dir)) {
                const fullPath = join(dir, item);
                if (statSync(fullPath).isDirectory()) {
                    this.scanDirectoryForIssues(fullPath, results);
                } else if (item.endsWith('.astro') || item.endsWith('.tsx')) {
                    this.scanFileForIssues(fullPath, results);
                }
            }
        } catch { /* skip */ }
    }

    private scanFileForIssues(filePath: string, results: AuditResults): void {
        try {
            const content = readFileSync(filePath, 'utf-8');
            const relativePath = filePath.replace(this.projectPath, '');

            if (content.includes('Astro.glob')) {
                results.issues.push({ id: `astro-glob-${relativePath}`, type: 'error', category: 'code', message: 'Uses deprecated Astro.glob()', file: relativePath, autoFixable: false });
            }

            if (content.includes('@ts-ignore')) {
                results.warnings.push({ id: `ts-ignore-${relativePath}`, type: 'warning', category: 'code', message: 'Contains @ts-ignore', file: relativePath, autoFixable: false });
            }

            const imgWithoutAlt = content.match(/<img(?![^>]*alt=)[^>]*>/g);
            if (imgWithoutAlt?.length) {
                results.warnings.push({ id: `missing-alt-${relativePath}`, type: 'warning', category: 'a11y', message: `${imgWithoutAlt.length} images missing alt`, file: relativePath, autoFixable: false });
            }
        } catch { /* skip */ }
    }

    private calculateHealth(framework: FrameworkInfo | null, _styling: StylingInfo | null, stats: ProjectStats, audit: AuditResults): HealthScore {
        let structure = 100 - audit.issues.filter(i => i.category === 'structure').length * 10;
        let typescript = stats.hasTypeScript ? 100 : 50;

        // Use specialized auditor scores if available, otherwise estimate
        let performance = audit.performance?.score ?? 70;
        let accessibility = audit.uiux?.score ?? (80 - audit.warnings.filter(i => i.category === 'a11y').length * 10);
        let seo = audit.seo?.score ?? 70;

        // Security bonus/penalty
        const security = audit.security?.score ?? 80;
        if (security < 50) structure -= 20; // Security issues impact structure score

        if (framework?.isSupported) structure += 10;
        if (stats.hasTests) structure += 5;

        structure = Math.max(0, Math.min(100, structure));
        accessibility = Math.max(0, Math.min(100, accessibility));
        performance = Math.max(0, Math.min(100, performance));
        seo = Math.max(0, Math.min(100, seo));

        const overall = Math.round((structure + typescript + performance + accessibility + seo) / 5);
        return { overall, structure, typescript, performance, accessibility, seo };
    }

    private generateRecommendations(framework: FrameworkInfo | null, styling: StylingInfo | null, cms: CMSInfo | null, stats: ProjectStats, _health: HealthScore): string[] {
        const rec: string[] = [];
        if (!framework?.isSupported) rec.push('Upgrade to Astro 5+ for best performance');
        if (!stats.hasTypeScript) rec.push('Add TypeScript for type safety');
        if (!stats.hasTests) rec.push('Add Vitest for testing');
        if (!stats.hasCICD) rec.push('Set up GitHub Actions for CI/CD');
        if (styling?.type === 'tailwind' && !styling.uiLibrary) rec.push('Consider DaisyUI for components');
        if (!cms && stats.pages > 5) rec.push('Consider Keystatic CMS for content');
        return rec;
    }
}

// ========================================
// MAIN BOOTSTRAP FUNCTION
// ========================================

export async function bootstrapProject(projectPath?: string): Promise<ProjectProfile> {
    const path = projectPath || process.cwd();
    const scanner = new ProjectScanner(path);
    const profile = await scanner.scan();

    cache.cacheAuditResult(path, 'bootstrap', profile);

    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║            PROJECT BOOTSTRAP COMPLETE                     ║');
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log(`║  Project: ${profile.name.padEnd(48)} ║`);
    console.log(`║  Health:  ${(profile.health.overall + '/100').padEnd(48)} ║`);
    console.log('╠═══════════════════════════════════════════════════════════╣');
    console.log('║  Recommendations:                                         ║');
    for (const r of profile.recommendations.slice(0, 4)) {
        console.log(`║  • ${r.substring(0, 54).padEnd(54)} ║`);
    }
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    return profile;
}

// CLI entry
if (process.argv[1]?.includes('bootstrap')) {
    bootstrapProject(process.argv[2]).catch(console.error);
}
