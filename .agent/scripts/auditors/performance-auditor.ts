/**
 * Elite Workforce - Performance Auditor
 *
 * Static analysis for performance best practices:
 * - Image optimization (format, lazy loading, sizing)
 * - JavaScript bundle analysis
 * - CSS optimization
 * - Core Web Vitals indicators
 * - Resource hints (preload, prefetch)
 * - Font loading optimization
 * - Compression indicators
 *
 * @module scripts/auditors/performance-auditor
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, basename } from 'node:path';

// ========================================
// TYPES & INTERFACES
// ========================================

export interface PerformanceAuditResult {
    score: number;
    category: 'Performance';
    issues: PerformanceIssue[];
    warnings: PerformanceIssue[];
    suggestions: PerformanceIssue[];
    metrics: PerformanceMetrics;
    coreWebVitals: CoreWebVitalsEstimate;
}

export interface PerformanceIssue {
    id: string;
    severity: 'error' | 'warning' | 'suggestion';
    category: 'images' | 'scripts' | 'styles' | 'fonts' | 'resources' | 'caching' | 'compression';
    message: string;
    file?: string;
    impact: 'high' | 'medium' | 'low';
    fix?: string;
}

export interface PerformanceMetrics {
    totalImages: number;
    imagesWithLazyLoad: number;
    imagesWithDimensions: number;
    modernImageFormats: number;
    totalScripts: number;
    asyncScripts: number;
    deferredScripts: number;
    inlineScripts: number;
    totalStylesheets: number;
    criticalCSS: boolean;
    fontDisplaySwap: number;
    totalFonts: number;
    hasResourceHints: boolean;
    hasServiceWorker: boolean;
    hasCompression: boolean;
}

export interface CoreWebVitalsEstimate {
    lcp: 'good' | 'needs-improvement' | 'poor' | 'unknown';
    fid: 'good' | 'needs-improvement' | 'poor' | 'unknown';
    cls: 'good' | 'needs-improvement' | 'poor' | 'unknown';
    lcpFactors: string[];
    fidFactors: string[];
    clsFactors: string[];
}

// ========================================
// PERFORMANCE AUDITOR CLASS
// ========================================

export class PerformanceAuditor {
    private projectPath: string;
    private issues: PerformanceIssue[] = [];
    private warnings: PerformanceIssue[] = [];
    private suggestions: PerformanceIssue[] = [];
    private metrics: PerformanceMetrics = {
        totalImages: 0,
        imagesWithLazyLoad: 0,
        imagesWithDimensions: 0,
        modernImageFormats: 0,
        totalScripts: 0,
        asyncScripts: 0,
        deferredScripts: 0,
        inlineScripts: 0,
        totalStylesheets: 0,
        criticalCSS: false,
        fontDisplaySwap: 0,
        totalFonts: 0,
        hasResourceHints: false,
        hasServiceWorker: false,
        hasCompression: false,
    };
    private coreWebVitals: CoreWebVitalsEstimate = {
        lcp: 'unknown',
        fid: 'unknown',
        cls: 'unknown',
        lcpFactors: [],
        fidFactors: [],
        clsFactors: [],
    };

    constructor(projectPath: string) {
        this.projectPath = projectPath;
    }

    /**
     * Run full performance audit
     */
    async audit(): Promise<PerformanceAuditResult> {
        console.log('⚡ Running Performance Audit...\n');

        // Check build configuration
        this.checkBuildConfig();

        // Check for service worker
        this.checkServiceWorker();

        // Scan source files
        const srcPath = join(this.projectPath, 'src');
        if (existsSync(srcPath)) {
            await this.scanDirectory(srcPath);
        }

        // Check public assets
        const publicPath = join(this.projectPath, 'public');
        if (existsSync(publicPath)) {
            await this.scanPublicAssets(publicPath);
        }

        // Estimate Core Web Vitals
        this.estimateCoreWebVitals();

        // Calculate score
        const score = this.calculateScore();

        console.log(`   🖼️  Images: ${this.metrics.imagesWithLazyLoad}/${this.metrics.totalImages} lazy loaded`);
        console.log(`   📜 Scripts: ${this.metrics.asyncScripts + this.metrics.deferredScripts}/${this.metrics.totalScripts} async/defer`);
        console.log(`   🎨 Fonts: ${this.metrics.fontDisplaySwap}/${this.metrics.totalFonts} with font-display`);
        console.log(`   ⚙️  Service Worker: ${this.metrics.hasServiceWorker ? '✅' : '❌'}`);

        return {
            score,
            category: 'Performance',
            issues: this.issues,
            warnings: this.warnings,
            suggestions: this.suggestions,
            metrics: this.metrics,
            coreWebVitals: this.coreWebVitals,
        };
    }

    /**
     * Check build configuration for performance optimizations
     */
    private checkBuildConfig(): void {
        // Check Astro config
        const astroConfigPaths = [
            join(this.projectPath, 'astro.config.mjs'),
            join(this.projectPath, 'astro.config.ts'),
            join(this.projectPath, 'astro.config.js'),
        ];

        for (const configPath of astroConfigPaths) {
            if (existsSync(configPath)) {
                const content = readFileSync(configPath, 'utf-8');

                // Check for image optimization
                if (content.includes('@astrojs/image') || content.includes('astro:assets')) {
                    this.suggestions.push({
                        id: 'astro-image-enabled',
                        severity: 'suggestion',
                        category: 'images',
                        message: 'Astro image optimization detected - good!',
                        impact: 'high',
                    });
                } else {
                    this.warnings.push({
                        id: 'no-image-optimization',
                        severity: 'warning',
                        category: 'images',
                        message: 'Consider using Astro image optimization',
                        impact: 'high',
                        fix: 'Use <Image> component from astro:assets',
                    });
                }

                // Check for compression
                if (content.includes('compressHTML') || content.includes('compress')) {
                    this.metrics.hasCompression = true;
                }

                // Check for prefetch
                if (content.includes('prefetch')) {
                    this.metrics.hasResourceHints = true;
                }

                break;
            }
        }

        // Check for Vite config optimizations
        const viteConfigPath = join(this.projectPath, 'vite.config.ts');
        if (existsSync(viteConfigPath)) {
            const content = readFileSync(viteConfigPath, 'utf-8');

            if (content.includes('splitVendorChunkPlugin') || content.includes('manualChunks')) {
                this.suggestions.push({
                    id: 'code-splitting-enabled',
                    severity: 'suggestion',
                    category: 'scripts',
                    message: 'Code splitting configured - good!',
                    impact: 'high',
                });
            }
        }
    }

    /**
     * Check for service worker
     */
    private checkServiceWorker(): void {
        const swPaths = [
            join(this.projectPath, 'public', 'sw.js'),
            join(this.projectPath, 'public', 'service-worker.js'),
            join(this.projectPath, 'src', 'sw.ts'),
        ];

        for (const swPath of swPaths) {
            if (existsSync(swPath)) {
                this.metrics.hasServiceWorker = true;
                return;
            }
        }

        // Check for workbox or PWA integration
        const pkgPath = join(this.projectPath, 'package.json');
        if (existsSync(pkgPath)) {
            const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
            const deps = { ...pkg.dependencies, ...pkg.devDependencies };

            if (deps['@vite-pwa/astro'] || deps['workbox-webpack-plugin']) {
                this.metrics.hasServiceWorker = true;
                return;
            }
        }

        this.suggestions.push({
            id: 'no-service-worker',
            severity: 'suggestion',
            category: 'caching',
            message: 'Consider adding a service worker for offline caching',
            impact: 'medium',
            fix: 'Add @vite-pwa/astro for automatic PWA support',
        });
    }

    /**
     * Scan directory for performance issues
     */
    private async scanDirectory(dir: string): Promise<void> {
        try {
            const items = readdirSync(dir);

            for (const item of items) {
                const fullPath = join(dir, item);
                const stat = statSync(fullPath);

                if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
                    await this.scanDirectory(fullPath);
                } else if (stat.isFile()) {
                    const ext = extname(item).toLowerCase();
                    if (['.astro', '.tsx', '.jsx', '.html', '.vue', '.svelte'].includes(ext)) {
                        await this.auditFile(fullPath);
                    } else if (['.css', '.scss', '.sass'].includes(ext)) {
                        await this.auditStylesheet(fullPath);
                    }
                }
            }
        } catch (e) {
            // Skip inaccessible directories
        }
    }

    /**
     * Audit a single file for performance issues
     */
    private async auditFile(filePath: string): Promise<void> {
        try {
            const content = readFileSync(filePath, 'utf-8');
            const relativePath = filePath.replace(this.projectPath, '');

            // ===== IMAGE ANALYSIS =====
            const imgTags = content.match(/<img[^>]*>/gi) || [];
            const pictureTags = content.match(/<picture[^>]*>[\s\S]*?<\/picture>/gi) || [];
            const astroImages = content.match(/<Image[^>]*>/gi) || [];

            this.metrics.totalImages += imgTags.length + astroImages.length;

            for (const img of imgTags) {
                // Check lazy loading
                if (/loading\s*=\s*["']lazy["']/i.test(img)) {
                    this.metrics.imagesWithLazyLoad++;
                } else if (!/loading\s*=/i.test(img)) {
                    // Only warn for images that might be below the fold
                    this.warnings.push({
                        id: `img-no-lazy-${relativePath}`,
                        severity: 'warning',
                        category: 'images',
                        message: 'Image missing loading="lazy" attribute',
                        file: relativePath,
                        impact: 'medium',
                        fix: 'Add loading="lazy" for below-the-fold images',
                    });
                }

                // Check dimensions
                if (/width\s*=/.test(img) && /height\s*=/.test(img)) {
                    this.metrics.imagesWithDimensions++;
                } else {
                    this.warnings.push({
                        id: `img-no-dimensions-${relativePath}`,
                        severity: 'warning',
                        category: 'images',
                        message: 'Image missing width/height (causes CLS)',
                        file: relativePath,
                        impact: 'high',
                        fix: 'Add explicit width and height attributes',
                    });
                    this.coreWebVitals.clsFactors.push('Images without dimensions');
                }

                // Check for modern formats
                if (/\.(webp|avif)/i.test(img)) {
                    this.metrics.modernImageFormats++;
                } else if (/\.(jpg|jpeg|png)/i.test(img)) {
                    this.suggestions.push({
                        id: `img-format-${relativePath}`,
                        severity: 'suggestion',
                        category: 'images',
                        message: 'Consider using WebP/AVIF format for better compression',
                        file: relativePath,
                        impact: 'medium',
                    });
                }
            }

            // Astro <Image> components get full credit
            this.metrics.imagesWithLazyLoad += astroImages.length;
            this.metrics.imagesWithDimensions += astroImages.length;
            this.metrics.modernImageFormats += astroImages.length;

            // ===== SCRIPT ANALYSIS =====
            const scriptTags = content.match(/<script[^>]*>[\s\S]*?<\/script>/gi) || [];

            for (const script of scriptTags) {
                this.metrics.totalScripts++;

                if (/\sasync[\s>]/i.test(script)) {
                    this.metrics.asyncScripts++;
                } else if (/\sdefer[\s>]/i.test(script)) {
                    this.metrics.deferredScripts++;
                } else if (/<script[^>]*>[\s\S]+<\/script>/i.test(script)) {
                    // Has inline content
                    this.metrics.inlineScripts++;

                    // Check inline script size
                    const scriptContent = script.replace(/<\/?script[^>]*>/gi, '');
                    if (scriptContent.length > 5000) {
                        this.warnings.push({
                            id: `large-inline-script-${relativePath}`,
                            severity: 'warning',
                            category: 'scripts',
                            message: 'Large inline script detected (>5KB)',
                            file: relativePath,
                            impact: 'medium',
                            fix: 'Move to external file for better caching',
                        });
                    }
                }
            }

            // ===== FONT ANALYSIS =====
            const fontFaceRules = content.match(/@font-face\s*\{[^}]*\}/gi) || [];
            const googleFonts = content.match(/fonts\.googleapis\.com/gi) || [];

            this.metrics.totalFonts += fontFaceRules.length + googleFonts.length;

            for (const fontFace of fontFaceRules) {
                if (/font-display\s*:\s*(swap|optional|fallback)/i.test(fontFace)) {
                    this.metrics.fontDisplaySwap++;
                } else {
                    this.warnings.push({
                        id: `font-no-display-${relativePath}`,
                        severity: 'warning',
                        category: 'fonts',
                        message: '@font-face missing font-display property',
                        file: relativePath,
                        impact: 'medium',
                        fix: 'Add font-display: swap for better perceived performance',
                    });
                    this.coreWebVitals.lcpFactors.push('Fonts without font-display');
                }
            }

            // Check Google Fonts usage
            if (googleFonts.length > 0) {
                if (!/display=swap/i.test(content)) {
                    this.warnings.push({
                        id: `google-fonts-no-swap-${relativePath}`,
                        severity: 'warning',
                        category: 'fonts',
                        message: 'Google Fonts missing display=swap parameter',
                        file: relativePath,
                        impact: 'medium',
                        fix: 'Add &display=swap to Google Fonts URL',
                    });
                }

                // Suggest preconnect
                if (!/preconnect.*fonts\.gstatic\.com/i.test(content)) {
                    this.suggestions.push({
                        id: `google-fonts-preconnect-${relativePath}`,
                        severity: 'suggestion',
                        category: 'fonts',
                        message: 'Add preconnect for Google Fonts',
                        file: relativePath,
                        impact: 'low',
                        fix: '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
                    });
                }
            }

            // ===== RESOURCE HINTS =====
            if (/<link[^>]*rel\s*=\s*["'](preload|prefetch|preconnect)["'][^>]*>/i.test(content)) {
                this.metrics.hasResourceHints = true;
            }

            // ===== THIRD-PARTY SCRIPTS =====
            const thirdPartyScripts = content.match(/src\s*=\s*["']https?:\/\/(?!.*localhost)[^"']+["']/gi) || [];
            if (thirdPartyScripts.length > 5) {
                this.warnings.push({
                    id: `too-many-third-party-${relativePath}`,
                    severity: 'warning',
                    category: 'scripts',
                    message: `Many third-party scripts detected (${thirdPartyScripts.length})`,
                    file: relativePath,
                    impact: 'high',
                    fix: 'Audit third-party scripts and remove unnecessary ones',
                });
                this.coreWebVitals.fidFactors.push('Multiple third-party scripts');
            }

        } catch (e) {
            // Skip unreadable files
        }
    }

    /**
     * Audit stylesheet for performance
     */
    private async auditStylesheet(filePath: string): Promise<void> {
        try {
            const content = readFileSync(filePath, 'utf-8');
            const relativePath = filePath.replace(this.projectPath, '');
            this.metrics.totalStylesheets++;

            // Check for @import (render-blocking)
            const imports = content.match(/@import\s+/gi) || [];
            if (imports.length > 0) {
                this.warnings.push({
                    id: `css-import-${relativePath}`,
                    severity: 'warning',
                    category: 'styles',
                    message: `CSS @import detected (${imports.length} times) - render blocking`,
                    file: relativePath,
                    impact: 'medium',
                    fix: 'Use bundler to combine CSS files instead of @import',
                });
            }

            // Check file size
            const sizeKB = content.length / 1024;
            if (sizeKB > 100) {
                this.warnings.push({
                    id: `large-css-${relativePath}`,
                    severity: 'warning',
                    category: 'styles',
                    message: `Large CSS file (${Math.round(sizeKB)}KB)`,
                    file: relativePath,
                    impact: 'medium',
                    fix: 'Consider splitting or purging unused CSS',
                });
            }

            // Check for animations
            const animations = content.match(/@keyframes|animation:/gi) || [];
            if (animations.length > 20) {
                this.suggestions.push({
                    id: `many-animations-${relativePath}`,
                    severity: 'suggestion',
                    category: 'styles',
                    message: `Many CSS animations (${animations.length}) - may affect performance`,
                    file: relativePath,
                    impact: 'low',
                });
            }

        } catch (e) {
            // Skip
        }
    }

    /**
     * Scan public assets
     */
    private async scanPublicAssets(dir: string): Promise<void> {
        try {
            const items = readdirSync(dir);

            for (const item of items) {
                const fullPath = join(dir, item);
                const stat = statSync(fullPath);

                if (stat.isDirectory()) {
                    await this.scanPublicAssets(fullPath);
                } else if (stat.isFile()) {
                    const ext = extname(item).toLowerCase();
                    const sizeKB = stat.size / 1024;

                    // Check large unoptimized images
                    if (['.jpg', '.jpeg', '.png', '.gif'].includes(ext)) {
                        if (sizeKB > 500) {
                            this.issues.push({
                                id: `large-image-${item}`,
                                severity: 'error',
                                category: 'images',
                                message: `Large image: ${item} (${Math.round(sizeKB)}KB)`,
                                file: fullPath.replace(this.projectPath, ''),
                                impact: 'high',
                                fix: 'Compress and convert to WebP/AVIF',
                            });
                            this.coreWebVitals.lcpFactors.push(`Large image: ${item}`);
                        } else if (sizeKB > 200) {
                            this.warnings.push({
                                id: `medium-image-${item}`,
                                severity: 'warning',
                                category: 'images',
                                message: `Consider optimizing: ${item} (${Math.round(sizeKB)}KB)`,
                                file: fullPath.replace(this.projectPath, ''),
                                impact: 'medium',
                            });
                        }
                    }

                    // Check large JavaScript files
                    if (ext === '.js' && sizeKB > 250) {
                        this.warnings.push({
                            id: `large-js-${item}`,
                            severity: 'warning',
                            category: 'scripts',
                            message: `Large JS file: ${item} (${Math.round(sizeKB)}KB)`,
                            file: fullPath.replace(this.projectPath, ''),
                            impact: 'high',
                            fix: 'Consider code splitting or tree shaking',
                        });
                        this.coreWebVitals.fidFactors.push(`Large JS: ${item}`);
                    }
                }
            }
        } catch (e) {
            // Skip
        }
    }

    /**
     * Estimate Core Web Vitals based on static analysis
     */
    private estimateCoreWebVitals(): void {
        // LCP (Largest Contentful Paint)
        const lcpIssues = this.coreWebVitals.lcpFactors.length;
        const hasLargeImages = this.issues.some(i => i.id.startsWith('large-image'));
        const hasFontIssues = this.warnings.some(i => i.category === 'fonts');

        if (lcpIssues === 0 && !hasLargeImages && !hasFontIssues) {
            this.coreWebVitals.lcp = 'good';
        } else if (lcpIssues <= 2 && !hasLargeImages) {
            this.coreWebVitals.lcp = 'needs-improvement';
        } else {
            this.coreWebVitals.lcp = 'poor';
        }

        // FID (First Input Delay) - now INP
        const fidIssues = this.coreWebVitals.fidFactors.length;
        const blockingScripts = this.metrics.totalScripts - this.metrics.asyncScripts - this.metrics.deferredScripts;

        if (fidIssues === 0 && blockingScripts <= 1) {
            this.coreWebVitals.fid = 'good';
        } else if (fidIssues <= 2 && blockingScripts <= 3) {
            this.coreWebVitals.fid = 'needs-improvement';
        } else {
            this.coreWebVitals.fid = 'poor';
        }

        // CLS (Cumulative Layout Shift)
        const clsIssues = this.coreWebVitals.clsFactors.length;
        const imagesWithoutDimensions = this.metrics.totalImages - this.metrics.imagesWithDimensions;

        if (clsIssues === 0 && imagesWithoutDimensions === 0) {
            this.coreWebVitals.cls = 'good';
        } else if (clsIssues <= 2 && imagesWithoutDimensions <= 2) {
            this.coreWebVitals.cls = 'needs-improvement';
        } else {
            this.coreWebVitals.cls = 'poor';
        }
    }

    /**
     * Calculate final score
     */
    private calculateScore(): number {
        let score = 100;

        // Deduct for issues
        score -= this.issues.filter(i => i.impact === 'high').length * 15;
        score -= this.issues.filter(i => i.impact === 'medium').length * 10;
        score -= this.issues.filter(i => i.impact === 'low').length * 5;

        score -= this.warnings.filter(i => i.impact === 'high').length * 8;
        score -= this.warnings.filter(i => i.impact === 'medium').length * 4;
        score -= this.warnings.filter(i => i.impact === 'low').length * 2;

        score -= this.suggestions.length * 1;

        // Bonus for good practices
        if (this.metrics.hasServiceWorker) score += 5;
        if (this.metrics.hasResourceHints) score += 3;
        if (this.metrics.hasCompression) score += 3;

        // Image optimization coverage
        if (this.metrics.totalImages > 0) {
            const lazyCoverage = this.metrics.imagesWithLazyLoad / this.metrics.totalImages;
            const dimCoverage = this.metrics.imagesWithDimensions / this.metrics.totalImages;
            score += Math.round(lazyCoverage * 5);
            score += Math.round(dimCoverage * 5);
        }

        // Script optimization
        if (this.metrics.totalScripts > 0) {
            const asyncDeferCoverage = (this.metrics.asyncScripts + this.metrics.deferredScripts) / this.metrics.totalScripts;
            score += Math.round(asyncDeferCoverage * 5);
        }

        // Core Web Vitals bonus
        if (this.coreWebVitals.lcp === 'good') score += 5;
        if (this.coreWebVitals.fid === 'good') score += 5;
        if (this.coreWebVitals.cls === 'good') score += 5;

        return Math.max(0, Math.min(100, Math.round(score)));
    }
}

// ========================================
// EXPORT FUNCTION
// ========================================

export async function runPerformanceAudit(projectPath: string): Promise<PerformanceAuditResult> {
    const auditor = new PerformanceAuditor(projectPath);
    return auditor.audit();
}
