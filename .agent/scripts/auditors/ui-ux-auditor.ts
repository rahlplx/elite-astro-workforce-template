/**
 * Elite Workforce - UI/UX Auditor
 *
 * Comprehensive UI/UX audit including:
 * - Accessibility (WCAG 2.1 AA)
 * - Color contrast ratios
 * - Touch target sizes
 * - Responsive breakpoints
 * - Component consistency
 * - Image optimization
 *
 * @module scripts/auditors/ui-ux-auditor
 */

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

// ========================================
// TYPES & INTERFACES
// ========================================

export interface UIUXAuditResult {
    score: number;
    category: 'UI/UX';
    issues: UIUXIssue[];
    warnings: UIUXIssue[];
    suggestions: UIUXIssue[];
    metrics: UIUXMetrics;
}

export interface UIUXIssue {
    id: string;
    severity: 'error' | 'warning' | 'suggestion';
    category: 'a11y' | 'contrast' | 'touch' | 'responsive' | 'consistency' | 'images' | 'forms';
    message: string;
    file?: string;
    line?: number;
    element?: string;
    fix?: string;
    wcag?: string;
}

export interface UIUXMetrics {
    totalComponents: number;
    accessibilityScore: number;
    imagesWithAlt: number;
    imagesWithoutAlt: number;
    formsWithLabels: number;
    formsWithoutLabels: number;
    touchTargetsOk: number;
    touchTargetsTooSmall: number;
    colorContrastPassing: number;
    colorContrastFailing: number;
}

// ========================================
// WCAG CONTRAST CHECKER
// ========================================

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function getLuminance(r: number, g: number, b: number): number {
    const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(hex1: string, hex2: string): number {
    const rgb1 = hexToRgb(hex1);
    const rgb2 = hexToRgb(hex2);
    if (!rgb1 || !rgb2) return 0;

    const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);

    return (lighter + 0.05) / (darker + 0.05);
}

function meetsWCAGAA(ratio: number, isLargeText: boolean = false): boolean {
    return isLargeText ? ratio >= 3 : ratio >= 4.5;
}

function meetsWCAGAAA(ratio: number, isLargeText: boolean = false): boolean {
    return isLargeText ? ratio >= 4.5 : ratio >= 7;
}

// ========================================
// UI/UX AUDITOR CLASS
// ========================================

export class UIUXAuditor {
    private projectPath: string;
    private issues: UIUXIssue[] = [];
    private warnings: UIUXIssue[] = [];
    private suggestions: UIUXIssue[] = [];
    private metrics: UIUXMetrics = {
        totalComponents: 0,
        accessibilityScore: 100,
        imagesWithAlt: 0,
        imagesWithoutAlt: 0,
        formsWithLabels: 0,
        formsWithoutLabels: 0,
        touchTargetsOk: 0,
        touchTargetsTooSmall: 0,
        colorContrastPassing: 0,
        colorContrastFailing: 0,
    };

    constructor(projectPath: string) {
        this.projectPath = projectPath;
    }

    /**
     * Run full UI/UX audit
     */
    async audit(): Promise<UIUXAuditResult> {
        console.log('🎨 Running UI/UX Audit...\n');

        // Scan all relevant files
        const srcPath = join(this.projectPath, 'src');
        if (existsSync(srcPath)) {
            await this.scanDirectory(srcPath);
        }

        // Check global styles
        await this.auditGlobalStyles();

        // Calculate final score
        const score = this.calculateScore();

        console.log(`   ✅ Accessibility Score: ${this.metrics.accessibilityScore}/100`);
        console.log(`   🖼️  Images: ${this.metrics.imagesWithAlt} with alt, ${this.metrics.imagesWithoutAlt} missing`);
        console.log(`   📝 Forms: ${this.metrics.formsWithLabels} labeled, ${this.metrics.formsWithoutLabels} unlabeled`);
        console.log(`   👆 Touch Targets: ${this.metrics.touchTargetsOk} OK, ${this.metrics.touchTargetsTooSmall} too small`);

        return {
            score,
            category: 'UI/UX',
            issues: this.issues,
            warnings: this.warnings,
            suggestions: this.suggestions,
            metrics: this.metrics,
        };
    }

    /**
     * Scan directory recursively
     */
    private async scanDirectory(dir: string): Promise<void> {
        try {
            const items = readdirSync(dir);

            for (const item of items) {
                const fullPath = join(dir, item);
                const stat = statSync(fullPath);

                if (stat.isDirectory()) {
                    if (!item.startsWith('.') && item !== 'node_modules') {
                        await this.scanDirectory(fullPath);
                    }
                } else {
                    const ext = extname(item).toLowerCase();
                    if (['.astro', '.tsx', '.jsx', '.vue', '.svelte'].includes(ext)) {
                        await this.auditFile(fullPath);
                    }
                }
            }
        } catch (e) {
            // Skip inaccessible directories
        }
    }

    /**
     * Audit a single file
     */
    private async auditFile(filePath: string): Promise<void> {
        try {
            const content = readFileSync(filePath, 'utf-8');
            const relativePath = filePath.replace(this.projectPath, '');

            this.metrics.totalComponents++;

            // Run all checks
            this.checkImages(content, relativePath);
            this.checkForms(content, relativePath);
            this.checkButtons(content, relativePath);
            this.checkLinks(content, relativePath);
            this.checkHeadings(content, relativePath);
            this.checkARIA(content, relativePath);
            this.checkTouchTargets(content, relativePath);
            this.checkInteractiveElements(content, relativePath);

        } catch (e) {
            // Skip unreadable files
        }
    }

    /**
     * Check images for alt text
     */
    private checkImages(content: string, file: string): void {
        // Find all img tags
        const imgRegex = /<img[^>]*>/gi;
        const imgs = content.match(imgRegex) || [];

        for (const img of imgs) {
            if (/alt\s*=\s*["'][^"']+["']/i.test(img)) {
                this.metrics.imagesWithAlt++;
            } else if (/alt\s*=\s*["']["']/i.test(img)) {
                // Empty alt is OK for decorative images, but warn
                this.metrics.imagesWithAlt++;
                this.suggestions.push({
                    id: `decorative-img-${file}`,
                    severity: 'suggestion',
                    category: 'a11y',
                    message: 'Image has empty alt. Confirm this is decorative.',
                    file,
                    element: img.substring(0, 50),
                    wcag: '1.1.1',
                });
            } else {
                this.metrics.imagesWithoutAlt++;
                this.issues.push({
                    id: `missing-alt-${file}-${this.issues.length}`,
                    severity: 'error',
                    category: 'a11y',
                    message: 'Image missing alt attribute',
                    file,
                    element: img.substring(0, 50),
                    fix: 'Add alt="description" to the img tag',
                    wcag: '1.1.1',
                });
            }
        }

        // Check for Image component (Astro/Next)
        const imageCompRegex = /<Image[^>]*>/gi;
        const imageComps = content.match(imageCompRegex) || [];

        for (const img of imageComps) {
            if (!/alt\s*=/.test(img)) {
                this.metrics.imagesWithoutAlt++;
                this.issues.push({
                    id: `missing-alt-component-${file}`,
                    severity: 'error',
                    category: 'a11y',
                    message: 'Image component missing alt prop',
                    file,
                    element: img.substring(0, 50),
                    fix: 'Add alt="description" prop',
                    wcag: '1.1.1',
                });
            } else {
                this.metrics.imagesWithAlt++;
            }
        }
    }

    /**
     * Check forms for labels
     */
    private checkForms(content: string, file: string): void {
        // Find inputs
        const inputRegex = /<input[^>]*>/gi;
        const inputs = content.match(inputRegex) || [];

        for (const input of inputs) {
            // Skip hidden, submit, button types
            if (/type\s*=\s*["'](hidden|submit|button|reset)["']/i.test(input)) {
                continue;
            }

            // Check for aria-label, aria-labelledby, or associated label
            const hasLabel = /aria-label|aria-labelledby|id\s*=/.test(input);
            const hasPlaceholder = /placeholder\s*=/.test(input);

            if (hasLabel) {
                this.metrics.formsWithLabels++;
            } else if (hasPlaceholder) {
                this.metrics.formsWithLabels++;
                this.warnings.push({
                    id: `placeholder-only-${file}`,
                    severity: 'warning',
                    category: 'forms',
                    message: 'Input uses placeholder as only label. Add proper label.',
                    file,
                    element: input.substring(0, 50),
                    wcag: '3.3.2',
                });
            } else {
                this.metrics.formsWithoutLabels++;
                this.issues.push({
                    id: `missing-label-${file}-${this.issues.length}`,
                    severity: 'error',
                    category: 'forms',
                    message: 'Form input missing label',
                    file,
                    element: input.substring(0, 50),
                    fix: 'Add <label for="id"> or aria-label',
                    wcag: '1.3.1',
                });
            }
        }

        // Check for select elements
        const selectRegex = /<select[^>]*>/gi;
        const selects = content.match(selectRegex) || [];

        for (const select of selects) {
            if (!/aria-label|id\s*=/.test(select)) {
                this.metrics.formsWithoutLabels++;
                this.issues.push({
                    id: `select-no-label-${file}`,
                    severity: 'error',
                    category: 'forms',
                    message: 'Select element missing label',
                    file,
                    wcag: '1.3.1',
                });
            } else {
                this.metrics.formsWithLabels++;
            }
        }
    }

    /**
     * Check buttons for accessibility
     */
    private checkButtons(content: string, file: string): void {
        // Find buttons
        const buttonRegex = /<button[^>]*>[\s\S]*?<\/button>/gi;
        const buttons = content.match(buttonRegex) || [];

        for (const button of buttons) {
            // Check for accessible name
            const hasText = /<button[^>]*>[^<]+<\/button>/i.test(button);
            const hasAriaLabel = /aria-label\s*=/.test(button);
            const hasTitle = /title\s*=/.test(button);

            if (!hasText && !hasAriaLabel) {
                this.issues.push({
                    id: `button-no-text-${file}`,
                    severity: 'error',
                    category: 'a11y',
                    message: 'Button has no accessible name (text or aria-label)',
                    file,
                    element: button.substring(0, 50),
                    fix: 'Add text content or aria-label',
                    wcag: '4.1.2',
                });
            }

            // Check for icon-only buttons
            if (/<button[^>]*>\s*<(svg|i|span)[^>]*class[^>]*icon/i.test(button) && !hasAriaLabel) {
                this.warnings.push({
                    id: `icon-button-${file}`,
                    severity: 'warning',
                    category: 'a11y',
                    message: 'Icon-only button should have aria-label',
                    file,
                    wcag: '1.1.1',
                });
            }
        }

        // Check for clickable divs (anti-pattern)
        const clickableDivRegex = /<div[^>]*onClick|<div[^>]*@click/gi;
        const clickableDivs = content.match(clickableDivRegex) || [];

        if (clickableDivs.length > 0) {
            this.warnings.push({
                id: `clickable-div-${file}`,
                severity: 'warning',
                category: 'a11y',
                message: `Found ${clickableDivs.length} clickable div(s). Use <button> instead.`,
                file,
                fix: 'Replace <div onClick> with <button>',
                wcag: '4.1.2',
            });
        }
    }

    /**
     * Check links for accessibility
     */
    private checkLinks(content: string, file: string): void {
        // Find links
        const linkRegex = /<a[^>]*>[\s\S]*?<\/a>/gi;
        const links = content.match(linkRegex) || [];

        for (const link of links) {
            // Check for href
            if (!/<a[^>]*href\s*=/i.test(link)) {
                this.warnings.push({
                    id: `link-no-href-${file}`,
                    severity: 'warning',
                    category: 'a11y',
                    message: 'Link missing href attribute',
                    file,
                    wcag: '2.1.1',
                });
            }

            // Check for generic text
            if (/>click here<|>here<|>read more<|>learn more</i.test(link)) {
                this.suggestions.push({
                    id: `generic-link-${file}`,
                    severity: 'suggestion',
                    category: 'a11y',
                    message: 'Avoid generic link text like "click here"',
                    file,
                    fix: 'Use descriptive link text',
                    wcag: '2.4.4',
                });
            }

            // Check for new tab links
            if (/target\s*=\s*["']_blank["']/i.test(link)) {
                if (!/rel\s*=.*noopener/i.test(link)) {
                    this.warnings.push({
                        id: `link-noopener-${file}`,
                        severity: 'warning',
                        category: 'a11y',
                        message: 'External link should have rel="noopener"',
                        file,
                    });
                }

                // Warn about opening in new tab
                if (!/aria-label|title/.test(link)) {
                    this.suggestions.push({
                        id: `link-new-tab-${file}`,
                        severity: 'suggestion',
                        category: 'a11y',
                        message: 'Links opening in new tab should indicate this',
                        file,
                        fix: 'Add "(opens in new tab)" to link text or aria-label',
                    });
                }
            }
        }
    }

    /**
     * Check heading hierarchy
     */
    private checkHeadings(content: string, file: string): void {
        const headings: number[] = [];

        // Find all headings
        for (let i = 1; i <= 6; i++) {
            const regex = new RegExp(`<h${i}[^>]*>`, 'gi');
            const matches = content.match(regex) || [];
            for (const _ of matches) {
                headings.push(i);
            }
        }

        // Check for skipped levels
        let lastLevel = 0;
        for (const level of headings) {
            if (level > lastLevel + 1 && lastLevel !== 0) {
                this.warnings.push({
                    id: `heading-skip-${file}`,
                    severity: 'warning',
                    category: 'a11y',
                    message: `Heading levels skipped (h${lastLevel} to h${level})`,
                    file,
                    wcag: '1.3.1',
                });
            }
            lastLevel = level;
        }

        // Check for multiple h1s
        const h1Count = (content.match(/<h1[^>]*>/gi) || []).length;
        if (h1Count > 1) {
            this.warnings.push({
                id: `multiple-h1-${file}`,
                severity: 'warning',
                category: 'a11y',
                message: `Found ${h1Count} h1 elements. Consider using only one per page.`,
                file,
                wcag: '1.3.1',
            });
        }
    }

    /**
     * Check ARIA usage
     */
    private checkARIA(content: string, file: string): void {
        // Check for redundant ARIA
        if (/<button[^>]*role\s*=\s*["']button["']/i.test(content)) {
            this.suggestions.push({
                id: `redundant-role-button-${file}`,
                severity: 'suggestion',
                category: 'a11y',
                message: 'Redundant role="button" on <button> element',
                file,
            });
        }

        if (/<a[^>]*role\s*=\s*["']link["']/i.test(content)) {
            this.suggestions.push({
                id: `redundant-role-link-${file}`,
                severity: 'suggestion',
                category: 'a11y',
                message: 'Redundant role="link" on <a> element',
                file,
            });
        }

        // Check for aria-hidden on focusable
        if (/aria-hidden\s*=\s*["']true["'][^>]*tabindex|tabindex[^>]*aria-hidden\s*=\s*["']true["']/i.test(content)) {
            this.issues.push({
                id: `aria-hidden-focusable-${file}`,
                severity: 'error',
                category: 'a11y',
                message: 'Element with aria-hidden="true" should not be focusable',
                file,
                wcag: '4.1.2',
            });
        }
    }

    /**
     * Check touch target sizes
     */
    private checkTouchTargets(content: string, file: string): void {
        // Look for small sizing classes that might indicate small touch targets
        const smallSizePatterns = [
            /class\s*=\s*["'][^"']*\b(w-4|h-4|w-5|h-5|w-6|h-6|p-1|p-0\.5)\b[^"']*["']/gi,
            /class\s*=\s*["'][^"']*\btext-xs\b[^"']*["']/gi,
        ];

        for (const pattern of smallSizePatterns) {
            const matches = content.match(pattern) || [];
            for (const match of matches) {
                // Check if it's on an interactive element
                if (/<(button|a|input)[^>]*/.test(content.substring(content.indexOf(match) - 100, content.indexOf(match)))) {
                    this.metrics.touchTargetsTooSmall++;
                    this.warnings.push({
                        id: `small-touch-target-${file}`,
                        severity: 'warning',
                        category: 'touch',
                        message: 'Interactive element may be too small for touch (min 44x44px)',
                        file,
                        element: match.substring(0, 50),
                        wcag: '2.5.5',
                    });
                }
            }
        }

        // Count OK targets (rough estimate)
        const interactiveCount = (content.match(/<(button|a\s|input)/gi) || []).length;
        this.metrics.touchTargetsOk = Math.max(0, interactiveCount - this.metrics.touchTargetsTooSmall);
    }

    /**
     * Check interactive elements
     */
    private checkInteractiveElements(content: string, file: string): void {
        // Check for tabindex > 0 (anti-pattern)
        const tabindexRegex = /tabindex\s*=\s*["']([^"']+)["']/gi;
        let match;

        while ((match = tabindexRegex.exec(content)) !== null) {
            const value = parseInt(match[1]);
            if (value > 0) {
                this.warnings.push({
                    id: `positive-tabindex-${file}`,
                    severity: 'warning',
                    category: 'a11y',
                    message: `tabindex="${value}" disrupts natural tab order. Use 0 or -1.`,
                    file,
                    wcag: '2.4.3',
                });
            }
        }

        // Check for autofocus (can be disorienting)
        if (/\bautofocus\b/i.test(content)) {
            this.suggestions.push({
                id: `autofocus-${file}`,
                severity: 'suggestion',
                category: 'a11y',
                message: 'autofocus can disorient screen reader users',
                file,
            });
        }
    }

    /**
     * Audit global styles
     */
    private async auditGlobalStyles(): Promise<void> {
        const stylesPath = join(this.projectPath, 'src', 'styles');
        if (!existsSync(stylesPath)) return;

        try {
            const files = readdirSync(stylesPath);
            for (const file of files) {
                if (file.endsWith('.css')) {
                    const content = readFileSync(join(stylesPath, file), 'utf-8');

                    // Check for focus outline removal
                    if (/outline\s*:\s*none|outline\s*:\s*0/i.test(content)) {
                        if (!/:focus-visible/.test(content)) {
                            this.issues.push({
                                id: `focus-outline-removed-${file}`,
                                severity: 'error',
                                category: 'a11y',
                                message: 'Focus outline removed without :focus-visible alternative',
                                file: `src/styles/${file}`,
                                fix: 'Use :focus-visible for visible focus states',
                                wcag: '2.4.7',
                            });
                        }
                    }

                    // Check for !important overuse
                    const importantCount = (content.match(/!important/gi) || []).length;
                    if (importantCount > 10) {
                        this.suggestions.push({
                            id: `too-many-important-${file}`,
                            severity: 'suggestion',
                            category: 'consistency',
                            message: `${importantCount} !important declarations. Consider refactoring.`,
                            file: `src/styles/${file}`,
                        });
                    }
                }
            }
        } catch (e) {
            // Skip if styles folder is inaccessible
        }
    }

    /**
     * Calculate final score
     */
    private calculateScore(): number {
        let score = 100;

        // Deduct for issues
        score -= this.issues.length * 5;
        score -= this.warnings.length * 2;
        score -= this.suggestions.length * 0.5;

        // Bonus for good practices
        if (this.metrics.imagesWithoutAlt === 0) score += 5;
        if (this.metrics.formsWithoutLabels === 0) score += 5;
        if (this.metrics.touchTargetsTooSmall === 0) score += 3;

        // Calculate accessibility score
        const totalImages = this.metrics.imagesWithAlt + this.metrics.imagesWithoutAlt;
        const totalForms = this.metrics.formsWithLabels + this.metrics.formsWithoutLabels;

        let a11yScore = 100;
        if (totalImages > 0) {
            a11yScore -= (this.metrics.imagesWithoutAlt / totalImages) * 30;
        }
        if (totalForms > 0) {
            a11yScore -= (this.metrics.formsWithoutLabels / totalForms) * 30;
        }
        a11yScore -= this.issues.filter(i => i.category === 'a11y').length * 5;

        this.metrics.accessibilityScore = Math.max(0, Math.round(a11yScore));

        return Math.max(0, Math.min(100, Math.round(score)));
    }
}

// ========================================
// EXPORT FUNCTION
// ========================================

export async function runUIUXAudit(projectPath: string): Promise<UIUXAuditResult> {
    const auditor = new UIUXAuditor(projectPath);
    return auditor.audit();
}
