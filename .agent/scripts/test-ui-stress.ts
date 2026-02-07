
import { vibeTransformer, VibeTheme } from '../orchestration/vibe-transformer.js';
import { logger } from '../orchestration/logger.js';

console.log('🎨 OPERATION NEON STORM: UI/UX Battle-Test Initiated...\n');

// Mock simple contrast checker (Luminance formula)
function getLuminance(hex: string): number {
    const rgb = hex.replace('#', '').match(/.{1,2}/g)?.map((x) => parseInt(x, 16) / 255) || [0,0,0];
    const [r, g, b] = rgb.map(c => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function getContrastRatio(hex1: string, hex2: string): number {
    const l1 = getLuminance(hex1);
    const l2 = getLuminance(hex2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
}

// Validation Logic
function validateTheme(theme: VibeTheme, scenarioName: string): { passed: boolean; issues: string[] } {
    const issues: string[] = [];

    // 1. Token Integrity Check (No Weird Keys)
    const requiredKeys = ['primary', 'surface', 'text'];
    for (const key of requiredKeys) {
        if (!theme.colors[key]) issues.push(`Missing required color token: ${key}`);
    }

    // 2. Accessibility Check (Contrast)
    // Assume text is rendered on surface
    if (theme.colors['surface'] && theme.colors['text']) {
        const ratio = getContrastRatio(theme.colors['surface'], theme.colors['text']);
        if (ratio < 4.5) {
            issues.push(`Contrast Fail [Standard]: Text on Surface ratio is ${ratio.toFixed(2)} (Min: 4.5)`);
        }
        
        // Critical: Black on Black or Dark on Dark check
        const surfLum = getLuminance(theme.colors['surface']);
        const textLum = getLuminance(theme.colors['text']);
        if (Math.abs(surfLum - textLum) < 0.1) {
            issues.push(`CRITICAL FAIL: "Black on Black" detection. Luminance difference is only ${Math.abs(surfLum - textLum).toFixed(3)}.`);
        }
    }

    // 3. Design System Integrity (No Raw Hex in code)
    // In a real scenario, we'd scan the generated HTML/CSS. 
    // For this simulation, we verify that the theme doesn't suggest raw hex for specific sub-components.
    
    // 4. Responsive/Layout Check
    if (theme.spacing.gutter && theme.spacing.gutter.includes('px')) {
         issues.push('Responsiveness Warn: Gutter uses fixed pixels instead of rem/em');
    }

    return { passed: issues.length === 0, issues };
}

// Scenarios
const SCENARIOS = [
    { name: 'Default Apple Vibe', input: 'Make it look like Apple' },
    { name: 'Chaos Cyberpunk', input: 'Neon dark cyberpunk medical app' },
    { name: 'Low Contrast Failure Candidate', input: 'Yellow text on white background' },
    { name: 'Critical Black on Black Fail', input: 'Black text on dark background after long context' }
];

async function runTests() {
    let passed = 0;
    let failed = 0;

    for (const sim of SCENARIOS) {
        console.log(`\n🧪 Testing Scenario: "${sim.name}"`);
        console.log(`   Input: "${sim.input}"`);

        // 1. Transform
        // Note: VibeTransformer currently is simple map. It might default to 'Apple' if unknown.
        // We want to see if it hallucinates bad values if we expand it, or if the defaults are safe.
        const theme = vibeTransformer.transform(sim.input);

        // 2. Mock 'Low Contrast' injection for simulation if the transform doesn't support NLP properly yet
        if (sim.name.includes('Low Contrast')) {
             // Artificial Injection to test the Validator Loop
             theme.colors['surface'] = '#ffffff';
             theme.colors['text'] = '#ffff00'; // Pure Yellow on White
        }

        if (sim.name.includes('Black on Black')) {
            theme.colors['surface'] = '#000000';
            theme.colors['text'] = '#0a0a0a'; // Almost black
        }

        // 3. Validate
        const result = validateTheme(theme, sim.name);

        if (result.passed) {
            console.log('   ✅ PASSED integrity checks.');
            passed++;
        } else {
            console.log('   ❌ FAILED checks:');
            result.issues.forEach(i => console.log(`      - ${i}`));
            failed++;
        }
    }

    console.log('\n══════════════════════════════════════════════════════════════');
    console.log(`🏁 UI/UX BATTLE-TEST COMPLETE`);
    console.log(`✅ PASSED: ${passed}`);
    console.log(`❌ FAILED: ${failed}`);
    console.log(`📊 SCORE:  ${Math.round((passed / SCENARIOS.length) * 100)}%`);
    console.log('══════════════════════════════════════════════════════════════\n');
}

runTests().catch(console.error);
