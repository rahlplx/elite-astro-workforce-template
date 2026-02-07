/**
 * Tailwind v4 Migration Auditor
 * 
 * Scans the project for legacy @astrojs/tailwind usage and suggests migration to Tailwind v4/Vite.
 */

import { readFileSync, existsSync, readdirSync, lstatSync } from 'node:fs';
import { join } from 'node:path';

const PROJECT_ROOT = process.cwd();

function audit() {
    console.log('🔍 [Tailwind v4 Auditor] Scanning project for legacy patterns...');
    let violations = 0;

    // 1. Check astro.config.mjs
    const astroConfigPath = join(PROJECT_ROOT, 'astro.config.mjs');
    if (existsSync(astroConfigPath)) {
        const config = readFileSync(astroConfigPath, 'utf8');
        if (config.includes('@astrojs/tailwind')) {
            console.log('❌ VIOLATION: astro.config.mjs uses legacy @astrojs/tailwind integration.');
            console.log('👉 RECOMMENDATION: Remove @astrojs/tailwind and use @tailwindcss/vite in your vite plugins.');
            violations++;
        }
    }

    // 2. Check package.json
    const packageJsonPath = join(PROJECT_ROOT, 'package.json');
    if (existsSync(packageJsonPath)) {
        const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
        const deps = { ...pkg.dependencies, ...pkg.devDependencies };
        if (deps['@astrojs/tailwind']) {
            console.log('❌ VIOLATION: package.json contains legacy @astrojs/tailwind dependency.');
            violations++;
        }
        if (!deps['@tailwindcss/vite'] && !deps['tailwindcss']) {
            console.log('⚠️  WARNING: Project missing Tailwind v4 / Vite dependencies.');
            violations++;
        }
    }

    // 3. Check for legacy tailwind.config.js/cjs
    const legacyConfigs = ['tailwind.config.js', 'tailwind.config.cjs', 'tailwind.config.mjs'];
    legacyConfigs.forEach(file => {
        if (existsSync(join(PROJECT_ROOT, file))) {
            console.log(`⚠️  WARNING: Found legacy ${file}. Tailwind v4 prefers CSS-first configuration.`);
            violations++;
        }
    });

    console.log(`\n📊 Audit Complete: Found ${violations} issues.`);
    if (violations === 0) {
        console.log('✅ PASS: Project follows modern Tailwind v4 standards.');
    }
}

audit();
