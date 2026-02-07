import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const THEMES_CONFIG = join(__dirname, '..', 'config', 'vibe-themes.json');

export interface VibeTheme {
    colors: Record<string, string>;
    fonts: Record<string, string>;
    spacing: Record<string, string>;
    radius: string;
    shadows: Record<string, string>;
}

export class VibeTransformer {
    private vibeMap: Record<string, VibeTheme> = {};

    constructor() {
        this.loadThemes();
    }

    /**
     * Load themes from external config for portability
     */
    private loadThemes() {
        // Default Core Themes (Agnostic)
        this.vibeMap = {
            'clean': {
                colors: { primary: '#0D9488', surface: '#FFFFFF', text: '#111827' },
                fonts: { sans: 'Inter, system-ui' },
                spacing: { gutter: '2rem' },
                radius: '12px',
                shadows: { subtle: '0 4px 12px rgba(0,0,0,0.05)' }
            },
            'dark': {
                colors: { primary: '#2DD4BF', surface: '#020617', text: '#F8FAFC' },
                fonts: { sans: 'Inter, system-ui' },
                spacing: { gutter: '2rem' },
                radius: '12px',
                shadows: { neon: '0 0 10px rgba(45, 212, 191, 0.3)' }
            }
        };

        // Attempt to load project-specific overrides
        if (existsSync(THEMES_CONFIG)) {
            try {
                const config = JSON.parse(readFileSync(THEMES_CONFIG, 'utf-8'));
                this.vibeMap = { ...this.vibeMap, ...config };
            } catch (e) {
                console.warn('⚠️ Failed to load vibe-themes.json, using defaults.');
            }
        }
    }

    /**
     * Transform a vibe description into a technical theme
     */
    transform(description: string): VibeTheme {
        const query = description.toLowerCase();
        
        // Dynamic matching based on keys in vibeMap
        for (const [key, theme] of Object.entries(this.vibeMap)) {
            if (query.includes(key)) return theme;
        }

        // Generic catch-alls
        if (query.includes('apple') || query.includes('sleek')) return this.vibeMap['clean'];
        if (query.includes('cyberpunk') || query.includes('neon')) return this.vibeMap['dark'];

        return this.vibeMap['clean'];
    }

    /**
     * Generate Tailwind v4 @theme CSS block
     */
    generateCSS(theme: VibeTheme): string {
        const lines: string[] = ['@theme {'];
        
        Object.entries(theme.colors).forEach(([name, value]) => {
            lines.push(`  --color-${name}: ${value};`);
        });

        Object.entries(theme.fonts).forEach(([name, value]) => {
            lines.push(`  --font-${name}: ${value};`);
        });

        lines.push(`  --radius: ${theme.radius};`);
        
        lines.push('}');
        return lines.join('\n');
    }
}

export const vibeTransformer = new VibeTransformer();
