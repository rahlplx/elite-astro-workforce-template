/**
 * Elite Workforce - Brand Discovery Questionnaire
 *
 * Interactive interview system that asks users about their brand and
 * automatically generates ATLAS_TOKENS.md with design tokens.
 *
 * Features:
 * - Progressive questioning (adapts based on answers)
 * - Color palette generation from vibes
 * - Typography recommendations by industry
 * - Auto-generates Tailwind CSS variables
 *
 * @module scripts/brand-interview
 */

import { existsSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

// ========================================
// TYPES & INTERFACES
// ========================================

export interface BrandProfile {
    identity: {
        name: string;
        tagline?: string;
        industry: string;
        targetAudience: string;
        personality: string[];
    };
    colors: {
        primary: string;
        secondary: string;
        accent: string;
        background: string;
        surface: string;
        text: string;
        textMuted: string;
        success: string;
        warning: string;
        error: string;
    };
    typography: {
        headingFont: string;
        bodyFont: string;
        monoFont: string;
        baseSize: string;
        scale: string;
    };
    spacing: {
        unit: string;
        scale: number[];
    };
    borders: {
        radius: string;
        style: 'sharp' | 'rounded' | 'pill';
    };
    shadows: {
        style: 'none' | 'subtle' | 'medium' | 'dramatic';
    };
    motion: {
        style: 'none' | 'subtle' | 'playful' | 'dramatic';
        duration: string;
    };
}

export interface InterviewQuestion {
    id: string;
    category: 'identity' | 'colors' | 'typography' | 'style';
    question: string;
    type: 'text' | 'select' | 'multiselect' | 'color';
    options?: string[];
    required: boolean;
    dependsOn?: { questionId: string; value: string };
}

export interface InterviewAnswers {
    [questionId: string]: string | string[];
}

// ========================================
// INTERVIEW QUESTIONS
// ========================================

const INTERVIEW_QUESTIONS: InterviewQuestion[] = [
    // Identity
    {
        id: 'brand_name',
        category: 'identity',
        question: 'What is your brand/project name?',
        type: 'text',
        required: true,
    },
    {
        id: 'tagline',
        category: 'identity',
        question: 'Do you have a tagline or slogan? (optional)',
        type: 'text',
        required: false,
    },
    {
        id: 'industry',
        category: 'identity',
        question: 'What industry or niche is this for?',
        type: 'select',
        options: [
            'Healthcare / Medical',
            'Technology / SaaS',
            'E-commerce / Retail',
            'Finance / Fintech',
            'Education / Learning',
            'Creative / Agency',
            'Food / Restaurant',
            'Travel / Hospitality',
            'Real Estate',
            'Non-profit / Charity',
            'Personal / Portfolio',
            'Other',
        ],
        required: true,
    },
    {
        id: 'target_audience',
        category: 'identity',
        question: 'Who is your primary target audience?',
        type: 'select',
        options: [
            'General consumers (B2C)',
            'Business professionals (B2B)',
            'Young adults (18-35)',
            'Families',
            'Seniors (55+)',
            'Tech-savvy users',
            'Luxury/Premium market',
            'Budget-conscious',
        ],
        required: true,
    },
    {
        id: 'personality',
        category: 'identity',
        question: 'Select 2-3 words that describe your brand personality:',
        type: 'multiselect',
        options: [
            'Professional',
            'Friendly',
            'Innovative',
            'Trustworthy',
            'Playful',
            'Elegant',
            'Bold',
            'Minimalist',
            'Warm',
            'Modern',
            'Traditional',
            'Energetic',
        ],
        required: true,
    },

    // Colors
    {
        id: 'has_colors',
        category: 'colors',
        question: 'Do you already have brand colors?',
        type: 'select',
        options: ['Yes, I have specific colors', 'No, suggest colors for me'],
        required: true,
    },
    {
        id: 'primary_color',
        category: 'colors',
        question: 'Enter your primary brand color (hex code):',
        type: 'color',
        required: false,
        dependsOn: { questionId: 'has_colors', value: 'Yes, I have specific colors' },
    },
    {
        id: 'secondary_color',
        category: 'colors',
        question: 'Enter your secondary color (hex code, optional):',
        type: 'color',
        required: false,
        dependsOn: { questionId: 'has_colors', value: 'Yes, I have specific colors' },
    },
    {
        id: 'color_vibe',
        category: 'colors',
        question: 'What vibe should your colors convey?',
        type: 'select',
        options: [
            'Professional & Trustworthy (Blues, Grays)',
            'Fresh & Natural (Greens, Earth tones)',
            'Energetic & Bold (Reds, Oranges)',
            'Creative & Playful (Purples, Pinks)',
            'Luxurious & Elegant (Gold, Deep colors)',
            'Clean & Minimal (Neutrals, White space)',
            'Tech & Modern (Cyans, Neons)',
            'Warm & Welcoming (Warm neutrals, Soft colors)',
        ],
        required: false,
        dependsOn: { questionId: 'has_colors', value: 'No, suggest colors for me' },
    },

    // Typography
    {
        id: 'typography_style',
        category: 'typography',
        question: 'What typography style fits your brand?',
        type: 'select',
        options: [
            'Modern Sans-serif (Clean, minimal)',
            'Classic Serif (Traditional, trustworthy)',
            'Geometric (Tech, innovative)',
            'Humanist (Friendly, approachable)',
            'Display/Creative (Bold, unique)',
        ],
        required: true,
    },

    // Style
    {
        id: 'corner_style',
        category: 'style',
        question: 'What corner style do you prefer?',
        type: 'select',
        options: [
            'Sharp corners (Professional, modern)',
            'Slightly rounded (Balanced, friendly)',
            'Very rounded/Pill (Playful, soft)',
        ],
        required: true,
    },
    {
        id: 'shadow_style',
        category: 'style',
        question: 'How much depth/shadow do you want?',
        type: 'select',
        options: [
            'Flat (No shadows)',
            'Subtle (Light depth)',
            'Medium (Noticeable depth)',
            'Dramatic (Strong shadows)',
        ],
        required: true,
    },
    {
        id: 'animation_style',
        category: 'style',
        question: 'How much animation/motion?',
        type: 'select',
        options: [
            'None (Static, fast loading)',
            'Subtle (Micro-interactions only)',
            'Moderate (Smooth transitions)',
            'Playful (Engaging animations)',
        ],
        required: true,
    },
    {
        id: 'dark_mode',
        category: 'style',
        question: 'Do you need dark mode support?',
        type: 'select',
        options: ['Yes', 'No', 'Maybe later'],
        required: true,
    },
];

// ========================================
// COLOR PALETTES BY VIBE
// ========================================

const COLOR_PALETTES: Record<string, Partial<BrandProfile['colors']>> = {
    'Professional & Trustworthy (Blues, Grays)': {
        primary: '#2563eb',    // Blue 600
        secondary: '#1e40af',  // Blue 800
        accent: '#3b82f6',     // Blue 500
        background: '#f8fafc', // Slate 50
        surface: '#ffffff',
        text: '#1e293b',       // Slate 800
        textMuted: '#64748b',  // Slate 500
    },
    'Fresh & Natural (Greens, Earth tones)': {
        primary: '#16a34a',    // Green 600
        secondary: '#166534',  // Green 800
        accent: '#22c55e',     // Green 500
        background: '#f0fdf4', // Green 50
        surface: '#ffffff',
        text: '#14532d',       // Green 900
        textMuted: '#4ade80',  // Green 400
    },
    'Energetic & Bold (Reds, Oranges)': {
        primary: '#dc2626',    // Red 600
        secondary: '#ea580c',  // Orange 600
        accent: '#f97316',     // Orange 500
        background: '#fff7ed', // Orange 50
        surface: '#ffffff',
        text: '#7c2d12',       // Orange 900
        textMuted: '#9a3412',  // Orange 800
    },
    'Creative & Playful (Purples, Pinks)': {
        primary: '#9333ea',    // Purple 600
        secondary: '#db2777',  // Pink 600
        accent: '#a855f7',     // Purple 500
        background: '#faf5ff', // Purple 50
        surface: '#ffffff',
        text: '#581c87',       // Purple 900
        textMuted: '#7e22ce',  // Purple 700
    },
    'Luxurious & Elegant (Gold, Deep colors)': {
        primary: '#b45309',    // Amber 700
        secondary: '#78350f',  // Amber 900
        accent: '#d97706',     // Amber 600
        background: '#fffbeb', // Amber 50
        surface: '#ffffff',
        text: '#292524',       // Stone 800
        textMuted: '#78716c',  // Stone 500
    },
    'Clean & Minimal (Neutrals, White space)': {
        primary: '#18181b',    // Zinc 900
        secondary: '#3f3f46',  // Zinc 700
        accent: '#71717a',     // Zinc 500
        background: '#fafafa', // Zinc 50
        surface: '#ffffff',
        text: '#18181b',       // Zinc 900
        textMuted: '#a1a1aa',  // Zinc 400
    },
    'Tech & Modern (Cyans, Neons)': {
        primary: '#0891b2',    // Cyan 600
        secondary: '#06b6d4',  // Cyan 500
        accent: '#22d3ee',     // Cyan 400
        background: '#ecfeff', // Cyan 50
        surface: '#ffffff',
        text: '#164e63',       // Cyan 900
        textMuted: '#0e7490',  // Cyan 700
    },
    'Warm & Welcoming (Warm neutrals, Soft colors)': {
        primary: '#d97706',    // Amber 600
        secondary: '#92400e',  // Amber 800
        accent: '#fbbf24',     // Amber 400
        background: '#fefce8', // Yellow 50
        surface: '#ffffff',
        text: '#422006',       // Amber 950
        textMuted: '#a16207',  // Amber 700
    },
};

// ========================================
// TYPOGRAPHY RECOMMENDATIONS
// ========================================

const TYPOGRAPHY_STACKS: Record<string, BrandProfile['typography']> = {
    'Modern Sans-serif (Clean, minimal)': {
        headingFont: 'Inter, system-ui, sans-serif',
        bodyFont: 'Inter, system-ui, sans-serif',
        monoFont: 'JetBrains Mono, monospace',
        baseSize: '16px',
        scale: '1.25',
    },
    'Classic Serif (Traditional, trustworthy)': {
        headingFont: 'Playfair Display, Georgia, serif',
        bodyFont: 'Source Serif Pro, Georgia, serif',
        monoFont: 'IBM Plex Mono, monospace',
        baseSize: '18px',
        scale: '1.333',
    },
    'Geometric (Tech, innovative)': {
        headingFont: 'Space Grotesk, sans-serif',
        bodyFont: 'DM Sans, sans-serif',
        monoFont: 'Fira Code, monospace',
        baseSize: '16px',
        scale: '1.25',
    },
    'Humanist (Friendly, approachable)': {
        headingFont: 'Nunito, sans-serif',
        bodyFont: 'Open Sans, sans-serif',
        monoFont: 'Source Code Pro, monospace',
        baseSize: '16px',
        scale: '1.2',
    },
    'Display/Creative (Bold, unique)': {
        headingFont: 'Clash Display, sans-serif',
        bodyFont: 'Satoshi, sans-serif',
        monoFont: 'JetBrains Mono, monospace',
        baseSize: '16px',
        scale: '1.333',
    },
};

// ========================================
// BRAND PROFILE GENERATOR
// ========================================

export class BrandInterviewer {
    private answers: InterviewAnswers = {};

    /**
     * Get all questions for the interview
     */
    getQuestions(): InterviewQuestion[] {
        return INTERVIEW_QUESTIONS;
    }

    /**
     * Get next unanswered question
     */
    getNextQuestion(): InterviewQuestion | null {
        for (const q of INTERVIEW_QUESTIONS) {
            // Skip if already answered
            if (this.answers[q.id] !== undefined) continue;

            // Check dependencies
            if (q.dependsOn) {
                const dependentAnswer = this.answers[q.dependsOn.questionId];
                if (dependentAnswer !== q.dependsOn.value) continue;
            }

            return q;
        }
        return null;
    }

    /**
     * Record an answer
     */
    answer(questionId: string, value: string | string[]): void {
        this.answers[questionId] = value;
    }

    /**
     * Check if interview is complete
     */
    isComplete(): boolean {
        return this.getNextQuestion() === null;
    }

    /**
     * Generate brand profile from answers
     */
    generateProfile(): BrandProfile {
        const answers = this.answers;

        // Get colors
        let colors: BrandProfile['colors'];
        if (answers.has_colors === 'Yes, I have specific colors') {
            const primary = (answers.primary_color as string) || '#3b82f6';
            colors = {
                primary,
                secondary: (answers.secondary_color as string) || this.darkenColor(primary),
                accent: this.lightenColor(primary),
                background: '#fafafa',
                surface: '#ffffff',
                text: '#18181b',
                textMuted: '#71717a',
                success: '#22c55e',
                warning: '#f59e0b',
                error: '#ef4444',
            };
        } else {
            const vibe = answers.color_vibe as string || 'Clean & Minimal (Neutrals, White space)';
            const palette = COLOR_PALETTES[vibe] || COLOR_PALETTES['Clean & Minimal (Neutrals, White space)'];
            colors = {
                ...palette,
                success: '#22c55e',
                warning: '#f59e0b',
                error: '#ef4444',
            } as BrandProfile['colors'];
        }

        // Get typography
        const typoStyle = answers.typography_style as string || 'Modern Sans-serif (Clean, minimal)';
        const typography = TYPOGRAPHY_STACKS[typoStyle] || TYPOGRAPHY_STACKS['Modern Sans-serif (Clean, minimal)'];

        // Get style preferences
        const cornerMap: Record<string, 'sharp' | 'rounded' | 'pill'> = {
            'Sharp corners (Professional, modern)': 'sharp',
            'Slightly rounded (Balanced, friendly)': 'rounded',
            'Very rounded/Pill (Playful, soft)': 'pill',
        };

        const shadowMap: Record<string, 'none' | 'subtle' | 'medium' | 'dramatic'> = {
            'Flat (No shadows)': 'none',
            'Subtle (Light depth)': 'subtle',
            'Medium (Noticeable depth)': 'medium',
            'Dramatic (Strong shadows)': 'dramatic',
        };

        const motionMap: Record<string, 'none' | 'subtle' | 'playful' | 'dramatic'> = {
            'None (Static, fast loading)': 'none',
            'Subtle (Micro-interactions only)': 'subtle',
            'Moderate (Smooth transitions)': 'subtle',
            'Playful (Engaging animations)': 'playful',
        };

        return {
            identity: {
                name: answers.brand_name as string || 'My Brand',
                tagline: answers.tagline as string,
                industry: answers.industry as string || 'Other',
                targetAudience: answers.target_audience as string || 'General consumers (B2C)',
                personality: (answers.personality as string[]) || ['Professional', 'Modern'],
            },
            colors,
            typography,
            spacing: {
                unit: '4px',
                scale: [0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24, 32, 40, 48, 64],
            },
            borders: {
                radius: cornerMap[answers.corner_style as string] === 'sharp' ? '0' :
                    cornerMap[answers.corner_style as string] === 'rounded' ? '0.5rem' : '9999px',
                style: cornerMap[answers.corner_style as string] || 'rounded',
            },
            shadows: {
                style: shadowMap[answers.shadow_style as string] || 'subtle',
            },
            motion: {
                style: motionMap[answers.animation_style as string] || 'subtle',
                duration: '200ms',
            },
        };
    }

    /**
     * Darken a hex color
     */
    private darkenColor(hex: string): string {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.max(0, (num >> 16) - 40);
        const g = Math.max(0, ((num >> 8) & 0x00FF) - 40);
        const b = Math.max(0, (num & 0x0000FF) - 40);
        return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
    }

    /**
     * Lighten a hex color
     */
    private lightenColor(hex: string): string {
        const num = parseInt(hex.replace('#', ''), 16);
        const r = Math.min(255, (num >> 16) + 40);
        const g = Math.min(255, ((num >> 8) & 0x00FF) + 40);
        const b = Math.min(255, (num & 0x0000FF) + 40);
        return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, '0')}`;
    }
}

// ========================================
// ATLAS_TOKENS.md GENERATOR
// ========================================

export function generateAtlasTokens(profile: BrandProfile): string {
    const { identity, colors, typography, spacing, borders, shadows, motion } = profile;

    return `# ATLAS Design System Tokens
> Auto-generated by Elite Workforce Brand Discovery
> Last updated: ${new Date().toISOString()}

## Brand Identity

| Property | Value |
|----------|-------|
| Name | ${identity.name} |
| Tagline | ${identity.tagline || 'N/A'} |
| Industry | ${identity.industry} |
| Target Audience | ${identity.targetAudience} |
| Personality | ${identity.personality.join(', ')} |

## Color Tokens

### Primary Palette
\`\`\`css
:root {
  --color-primary: ${colors.primary};
  --color-secondary: ${colors.secondary};
  --color-accent: ${colors.accent};
}
\`\`\`

### Background & Surface
\`\`\`css
:root {
  --color-background: ${colors.background};
  --color-surface: ${colors.surface};
}
\`\`\`

### Text Colors
\`\`\`css
:root {
  --color-text: ${colors.text};
  --color-text-muted: ${colors.textMuted};
}
\`\`\`

### Semantic Colors
\`\`\`css
:root {
  --color-success: ${colors.success};
  --color-warning: ${colors.warning};
  --color-error: ${colors.error};
}
\`\`\`

## Typography

### Font Families
\`\`\`css
:root {
  --font-heading: ${typography.headingFont};
  --font-body: ${typography.bodyFont};
  --font-mono: ${typography.monoFont};
}
\`\`\`

### Scale
- Base size: ${typography.baseSize}
- Scale ratio: ${typography.scale}

## Spacing

- Base unit: ${spacing.unit}
- Scale: ${spacing.scale.join(', ')}

## Borders

- Radius: ${borders.radius}
- Style: ${borders.style}

## Shadows

Style: ${shadows.style}

\`\`\`css
:root {
  --shadow-sm: ${shadows.style === 'none' ? 'none' : '0 1px 2px 0 rgb(0 0 0 / 0.05)'};
  --shadow-md: ${shadows.style === 'none' ? 'none' : '0 4px 6px -1px rgb(0 0 0 / 0.1)'};
  --shadow-lg: ${shadows.style === 'none' ? 'none' : '0 10px 15px -3px rgb(0 0 0 / 0.1)'};
}
\`\`\`

## Motion

- Style: ${motion.style}
- Base duration: ${motion.duration}

\`\`\`css
:root {
  --transition-fast: 150ms ease;
  --transition-base: ${motion.duration} ease;
  --transition-slow: 300ms ease;
}
\`\`\`

---

## Tailwind CSS Integration

Add to your \`src/styles/global.css\`:

\`\`\`css
@theme {
  /* Colors */
  --color-primary: ${colors.primary};
  --color-secondary: ${colors.secondary};
  --color-accent: ${colors.accent};
  --color-background: ${colors.background};
  --color-surface: ${colors.surface};

  /* Typography */
  --font-heading: ${typography.headingFont};
  --font-body: ${typography.bodyFont};

  /* Borders */
  --radius-default: ${borders.radius};
}
\`\`\`

## DaisyUI Theme (Optional)

\`\`\`javascript
// tailwind.config.js
daisyui: {
  themes: [{
    "${identity.name.toLowerCase().replace(/\s+/g, '-')}": {
      "primary": "${colors.primary}",
      "secondary": "${colors.secondary}",
      "accent": "${colors.accent}",
      "neutral": "${colors.text}",
      "base-100": "${colors.surface}",
      "info": "#3abff8",
      "success": "${colors.success}",
      "warning": "${colors.warning}",
      "error": "${colors.error}",
    }
  }]
}
\`\`\`

---

*These tokens are meant to be customized. Adjust values as needed for your specific brand.*
`;
}

// ========================================
// EXPORT FUNCTIONS
// ========================================

/**
 * Run the full brand interview
 */
export function createInterviewer(): BrandInterviewer {
    return new BrandInterviewer();
}

/**
 * Generate tokens file from profile
 */
export function saveAtlasTokens(profile: BrandProfile, projectPath: string): string {
    const content = generateAtlasTokens(profile);
    const filePath = join(projectPath, '.agent', 'ATLAS_TOKENS.md');
    writeFileSync(filePath, content);
    return filePath;
}

/**
 * Quick generate with default questions
 */
export async function quickBrandSetup(answers: InterviewAnswers, projectPath: string): Promise<BrandProfile> {
    const interviewer = new BrandInterviewer();

    for (const [id, value] of Object.entries(answers)) {
        interviewer.answer(id, value);
    }

    const profile = interviewer.generateProfile();
    saveAtlasTokens(profile, projectPath);

    return profile;
}
