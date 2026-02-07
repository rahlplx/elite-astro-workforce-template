/**
 * Elite Workforce - SEO Auditor
 *
 * Comprehensive SEO audit including:
 * - Meta tags (title, description)
 * - Open Graph tags
 * - Twitter cards
 * - Schema.org structured data
 * - Sitemap.xml
 * - Robots.txt
 * - Canonical URLs
 * - Heading hierarchy
 *
 * @module scripts/auditors/seo-auditor
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

// ========================================
// TYPES & INTERFACES
// ========================================

export interface SEOAuditResult {
    score: number;
    category: 'SEO';
    issues: SEOIssue[];
    warnings: SEOIssue[];
    suggestions: SEOIssue[];
    metrics: SEOMetrics;
    pageReports: PageSEOReport[];
}

export interface SEOIssue {
    id: string;
    severity: 'error' | 'warning' | 'suggestion';
    category: 'meta' | 'og' | 'twitter' | 'schema' | 'sitemap' | 'robots' | 'canonical' | 'headings' | 'content';
    message: string;
    file?: string;
    fix?: string;
}

export interface SEOMetrics {
    totalPages: number;
    pagesWithTitle: number;
    pagesWithDescription: number;
    pagesWithOG: number;
    pagesWithTwitter: number;
    pagesWithSchema: number;
    pagesWithCanonical: number;
    hasSitemap: boolean;
    hasRobots: boolean;
}

export interface PageSEOReport {
    page: string;
    title: string | null;
    titleLength: number;
    description: string | null;
    descriptionLength: number;
    hasOG: boolean;
    hasTwitter: boolean;
    hasSchema: boolean;
    hasCanonical: boolean;
    h1Count: number;
    issues: string[];
}

// ========================================
// SEO AUDITOR CLASS
// ========================================

export class SEOAuditor {
    private projectPath: string;
    private issues: SEOIssue[] = [];
    private warnings: SEOIssue[] = [];
    private suggestions: SEOIssue[] = [];
    private pageReports: PageSEOReport[] = [];
    private metrics: SEOMetrics = {
        totalPages: 0,
        pagesWithTitle: 0,
        pagesWithDescription: 0,
        pagesWithOG: 0,
        pagesWithTwitter: 0,
        pagesWithSchema: 0,
        pagesWithCanonical: 0,
        hasSitemap: false,
        hasRobots: false,
    };

    constructor(projectPath: string) {
        this.projectPath = projectPath;
    }

    /**
     * Run full SEO audit
     */
    async audit(): Promise<SEOAuditResult> {
        console.log('🔍 Running SEO Audit...\n');

        // Check sitemap and robots
        this.checkSitemap();
        this.checkRobots();

        // Scan all pages
        const pagesPath = join(this.projectPath, 'src', 'pages');
        if (existsSync(pagesPath)) {
            await this.scanPages(pagesPath);
        }

        // Check layouts for common SEO elements
        const layoutsPath = join(this.projectPath, 'src', 'layouts');
        if (existsSync(layoutsPath)) {
            await this.scanLayouts(layoutsPath);
        }

        // Calculate score
        const score = this.calculateScore();

        console.log(`   📄 Pages: ${this.metrics.totalPages}`);
        console.log(`   📝 With Title: ${this.metrics.pagesWithTitle}/${this.metrics.totalPages}`);
        console.log(`   📋 With Description: ${this.metrics.pagesWithDescription}/${this.metrics.totalPages}`);
        console.log(`   🌐 With OG Tags: ${this.metrics.pagesWithOG}/${this.metrics.totalPages}`);
        console.log(`   🗺️  Sitemap: ${this.metrics.hasSitemap ? '✅' : '❌'}`);
        console.log(`   🤖 Robots.txt: ${this.metrics.hasRobots ? '✅' : '❌'}`);

        return {
            score,
            category: 'SEO',
            issues: this.issues,
            warnings: this.warnings,
            suggestions: this.suggestions,
            metrics: this.metrics,
            pageReports: this.pageReports,
        };
    }

    /**
     * Check for sitemap.xml
     */
    private checkSitemap(): void {
        const sitemapPath = join(this.projectPath, 'public', 'sitemap.xml');
        const sitemapIndexPath = join(this.projectPath, 'public', 'sitemap-index.xml');

        if (existsSync(sitemapPath) || existsSync(sitemapIndexPath)) {
            this.metrics.hasSitemap = true;
        } else {
            // Check if Astro sitemap integration is configured
            const astroConfigPath = join(this.projectPath, 'astro.config.mjs');
            const astroConfigTsPath = join(this.projectPath, 'astro.config.ts');

            let hasAstroSitemap = false;
            if (existsSync(astroConfigPath)) {
                const config = readFileSync(astroConfigPath, 'utf-8');
                hasAstroSitemap = config.includes('@astrojs/sitemap') || config.includes('sitemap()');
            } else if (existsSync(astroConfigTsPath)) {
                const config = readFileSync(astroConfigTsPath, 'utf-8');
                hasAstroSitemap = config.includes('@astrojs/sitemap') || config.includes('sitemap()');
            }

            if (hasAstroSitemap) {
                this.metrics.hasSitemap = true;
            } else {
                this.warnings.push({
                    id: 'no-sitemap',
                    severity: 'warning',
                    category: 'sitemap',
                    message: 'No sitemap found. Add @astrojs/sitemap integration.',
                    fix: 'npx astro add sitemap',
                });
            }
        }
    }

    /**
     * Check for robots.txt
     */
    private checkRobots(): void {
        const robotsPath = join(this.projectPath, 'public', 'robots.txt');

        if (existsSync(robotsPath)) {
            this.metrics.hasRobots = true;

            // Check robots.txt content
            const content = readFileSync(robotsPath, 'utf-8');

            if (!content.includes('Sitemap:')) {
                this.suggestions.push({
                    id: 'robots-no-sitemap',
                    severity: 'suggestion',
                    category: 'robots',
                    message: 'robots.txt should reference sitemap URL',
                    fix: 'Add "Sitemap: https://yoursite.com/sitemap.xml"',
                });
            }

            if (content.includes('Disallow: /')) {
                this.warnings.push({
                    id: 'robots-disallow-all',
                    severity: 'warning',
                    category: 'robots',
                    message: 'robots.txt blocks all crawlers. Is this intentional?',
                });
            }
        } else {
            this.warnings.push({
                id: 'no-robots',
                severity: 'warning',
                category: 'robots',
                message: 'No robots.txt found',
                fix: 'Create public/robots.txt',
            });
        }
    }

    /**
     * Scan pages directory
     */
    private async scanPages(dir: string, basePath: string = ''): Promise<void> {
        try {
            const items = readdirSync(dir);

            for (const item of items) {
                const fullPath = join(dir, item);
                const stat = statSync(fullPath);

                if (stat.isDirectory()) {
                    await this.scanPages(fullPath, `${basePath}/${item}`);
                } else {
                    const ext = extname(item).toLowerCase();
                    if (['.astro', '.tsx', '.jsx', '.md', '.mdx'].includes(ext)) {
                        await this.auditPage(fullPath, `${basePath}/${item}`);
                    }
                }
            }
        } catch (e) {
            // Skip inaccessible directories
        }
    }

    /**
     * Audit a single page
     */
    private async auditPage(filePath: string, pagePath: string): Promise<void> {
        try {
            const content = readFileSync(filePath, 'utf-8');
            this.metrics.totalPages++;

            const report: PageSEOReport = {
                page: pagePath,
                title: null,
                titleLength: 0,
                description: null,
                descriptionLength: 0,
                hasOG: false,
                hasTwitter: false,
                hasSchema: false,
                hasCanonical: false,
                h1Count: 0,
                issues: [],
            };

            // Check title
            const titleMatch = content.match(/<title[^>]*>([^<]*)<\/title>/i) ||
                content.match(/title\s*[=:]\s*["']([^"']+)["']/);
            if (titleMatch) {
                report.title = titleMatch[1].trim();
                report.titleLength = report.title.length;
                this.metrics.pagesWithTitle++;

                if (report.titleLength < 30) {
                    this.warnings.push({
                        id: `title-short-${pagePath}`,
                        severity: 'warning',
                        category: 'meta',
                        message: `Title too short (${report.titleLength} chars). Aim for 50-60.`,
                        file: pagePath,
                    });
                    report.issues.push('Title too short');
                } else if (report.titleLength > 60) {
                    this.warnings.push({
                        id: `title-long-${pagePath}`,
                        severity: 'warning',
                        category: 'meta',
                        message: `Title too long (${report.titleLength} chars). May be truncated.`,
                        file: pagePath,
                    });
                    report.issues.push('Title too long');
                }
            } else {
                this.issues.push({
                    id: `no-title-${pagePath}`,
                    severity: 'error',
                    category: 'meta',
                    message: 'Page missing title tag',
                    file: pagePath,
                    fix: 'Add <title>Your Page Title</title>',
                });
                report.issues.push('Missing title');
            }

            // Check meta description
            const descMatch = content.match(/<meta[^>]*name\s*=\s*["']description["'][^>]*content\s*=\s*["']([^"']+)["']/i) ||
                content.match(/description\s*[=:]\s*["']([^"']+)["']/);
            if (descMatch) {
                report.description = descMatch[1].trim();
                report.descriptionLength = report.description.length;
                this.metrics.pagesWithDescription++;

                if (report.descriptionLength < 120) {
                    this.suggestions.push({
                        id: `desc-short-${pagePath}`,
                        severity: 'suggestion',
                        category: 'meta',
                        message: `Description short (${report.descriptionLength} chars). Aim for 150-160.`,
                        file: pagePath,
                    });
                } else if (report.descriptionLength > 160) {
                    this.warnings.push({
                        id: `desc-long-${pagePath}`,
                        severity: 'warning',
                        category: 'meta',
                        message: `Description too long (${report.descriptionLength} chars). May be truncated.`,
                        file: pagePath,
                    });
                }
            } else {
                this.warnings.push({
                    id: `no-desc-${pagePath}`,
                    severity: 'warning',
                    category: 'meta',
                    message: 'Page missing meta description',
                    file: pagePath,
                    fix: 'Add <meta name="description" content="...">',
                });
                report.issues.push('Missing description');
            }

            // Check Open Graph
            const hasOG = /og:title|og:description|og:image/i.test(content);
            if (hasOG) {
                report.hasOG = true;
                this.metrics.pagesWithOG++;

                // Check for required OG tags
                if (!/og:title/i.test(content)) {
                    this.suggestions.push({
                        id: `og-no-title-${pagePath}`,
                        severity: 'suggestion',
                        category: 'og',
                        message: 'Missing og:title',
                        file: pagePath,
                    });
                }
                if (!/og:image/i.test(content)) {
                    this.suggestions.push({
                        id: `og-no-image-${pagePath}`,
                        severity: 'suggestion',
                        category: 'og',
                        message: 'Missing og:image (important for social sharing)',
                        file: pagePath,
                    });
                }
            } else {
                this.suggestions.push({
                    id: `no-og-${pagePath}`,
                    severity: 'suggestion',
                    category: 'og',
                    message: 'No Open Graph tags. Add for better social sharing.',
                    file: pagePath,
                });
            }

            // Check Twitter cards
            const hasTwitter = /twitter:card|twitter:title/i.test(content);
            if (hasTwitter) {
                report.hasTwitter = true;
                this.metrics.pagesWithTwitter++;
            }

            // Check Schema.org
            const hasSchema = /application\/ld\+json|itemscope|itemtype/i.test(content);
            if (hasSchema) {
                report.hasSchema = true;
                this.metrics.pagesWithSchema++;
            }

            // Check canonical
            const hasCanonical = /rel\s*=\s*["']canonical["']/i.test(content);
            if (hasCanonical) {
                report.hasCanonical = true;
                this.metrics.pagesWithCanonical++;
            } else {
                this.suggestions.push({
                    id: `no-canonical-${pagePath}`,
                    severity: 'suggestion',
                    category: 'canonical',
                    message: 'Consider adding canonical URL',
                    file: pagePath,
                });
            }

            // Check H1
            const h1Matches = content.match(/<h1[^>]*>/gi) || [];
            report.h1Count = h1Matches.length;

            if (report.h1Count === 0) {
                this.warnings.push({
                    id: `no-h1-${pagePath}`,
                    severity: 'warning',
                    category: 'headings',
                    message: 'Page missing H1 heading',
                    file: pagePath,
                });
                report.issues.push('Missing H1');
            } else if (report.h1Count > 1) {
                this.suggestions.push({
                    id: `multiple-h1-${pagePath}`,
                    severity: 'suggestion',
                    category: 'headings',
                    message: `Multiple H1 tags (${report.h1Count}). Consider using only one.`,
                    file: pagePath,
                });
            }

            this.pageReports.push(report);

        } catch (e) {
            // Skip unreadable files
        }
    }

    /**
     * Scan layouts for SEO components
     */
    private async scanLayouts(dir: string): Promise<void> {
        try {
            const items = readdirSync(dir);
            let hasBaseSEO = false;

            for (const item of items) {
                const fullPath = join(dir, item);
                if (statSync(fullPath).isFile()) {
                    const content = readFileSync(fullPath, 'utf-8');

                    // Check if layout has SEO setup
                    if (/<title|meta.*description|og:|twitter:/i.test(content)) {
                        hasBaseSEO = true;
                    }
                }
            }

            if (hasBaseSEO) {
                this.suggestions.push({
                    id: 'layout-seo-good',
                    severity: 'suggestion',
                    category: 'meta',
                    message: 'SEO tags found in layouts - good practice!',
                });
            }

        } catch (e) {
            // Skip
        }
    }

    /**
     * Calculate final score
     */
    private calculateScore(): number {
        let score = 100;

        // Deduct for issues
        score -= this.issues.length * 10;
        score -= this.warnings.length * 3;
        score -= this.suggestions.length * 1;

        // Bonus for good practices
        if (this.metrics.hasSitemap) score += 5;
        if (this.metrics.hasRobots) score += 5;

        // Calculate coverage
        if (this.metrics.totalPages > 0) {
            const titleCoverage = this.metrics.pagesWithTitle / this.metrics.totalPages;
            const descCoverage = this.metrics.pagesWithDescription / this.metrics.totalPages;

            if (titleCoverage < 1) score -= (1 - titleCoverage) * 20;
            if (descCoverage < 1) score -= (1 - descCoverage) * 15;
        }

        return Math.max(0, Math.min(100, Math.round(score)));
    }
}

// ========================================
// EXPORT FUNCTION
// ========================================

export async function runSEOAudit(projectPath: string): Promise<SEOAuditResult> {
    const auditor = new SEOAuditor(projectPath);
    return auditor.audit();
}
