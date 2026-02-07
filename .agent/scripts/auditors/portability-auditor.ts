/**
 * Agentic System - Portability Auditor
 * 
 * Audits the AI Workforce for "Vibe Ready" portability.
 * Ensures no brand-specific references, no hardcoded paths, and template completeness.
 * 
 * @module auditors/portability-auditor
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, isAbsolute, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AGENT_ROOT = join(__dirname, '..', '..');
const PROJECT_ROOT = join(AGENT_ROOT, '..');

interface PortabilityAuditResult {
    check: string;
    passed: boolean;
    issues: string[];
}

export async function auditPortability(): Promise<PortabilityAuditResult[]> {
    console.log('📦 Auditing System Portability...');
    
    const results: PortabilityAuditResult[] = [];
    const agentRoot = AGENT_ROOT;
    
    // 1. Brand Neutrality Check
    const brandIssues: string[] = [];
    const files = getAllFiles(agentRoot);
    
    for (const file of files) {
        try {
            const content = readFileSync(file, 'utf8');
            if (content.includes('Smile Savers')) {
                // Ignore self-references in auditors and checks
                if (!file.includes('auditor.ts') && !file.includes('validate-')) {
                    const relPath = file.replace(PROJECT_ROOT, '');
                    brandIssues.push(`❌ Found "Smile Savers" in: ${relPath}`);
                }
            }
            if (content.includes('smilesavers')) {
                 if (!file.includes('auditor.ts') && !file.includes('validate-')) {
                     const relPath = file.replace(PROJECT_ROOT, '');
                     brandIssues.push(`❌ Found "smilesavers" in: ${relPath}`);
                 }
            }
        } catch {}
    }
    results.push({ check: 'Brand Neutrality', passed: brandIssues.length === 0, issues: brandIssues });

    // 2. Hardcoded Path Check
    const pathIssues: string[] = [];
    for (const file of files) {
        try {
            const content = readFileSync(file, 'utf8');
            // Check for Windows/Mac absolute paths
            if (content.match(/[A-Z]:\\[^\n]*Users\\/i) || content.match(/\/Users\/[^\n]*\//)) {
                // Ignore self-references in this script and test files
                if (!file.includes('portability-auditor.ts') && !file.includes('.log')) {
                    const relPath = file.replace(PROJECT_ROOT, '');
                    pathIssues.push(`⚠️ Potential absolute path in: ${relPath}`);
                }
            }
        } catch {}
    }
    results.push({ check: 'No Hardcoded Paths', passed: pathIssues.length === 0, issues: pathIssues });

    // 3. Template Readiness (Manifests)
    const neededFiles = ['MANIFEST.md', 'TOOLS.md', 'rules/ELITE_PROTOCOL.md'];
    const missingFiles = neededFiles.filter(f => !existsSync(join(agentRoot, f)));
    
    results.push({ 
        check: 'Template Manifests', 
        passed: missingFiles.length === 0, 
        issues: missingFiles.map(f => `❌ Missing template file: ${f}`)
    });

    // 4. Package Configuration
    const pkgPath = join(PROJECT_ROOT, 'package.json');
    const pkgIssues: string[] = [];
    if (existsSync(pkgPath)) {
        const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
        if (pkg.name.includes('smile-savers')) {
            pkgIssues.push('❌ Package name contains brand: ' + pkg.name);
        }
    }
    results.push({ check: 'Package Config', passed: pkgIssues.length === 0, issues: pkgIssues });

    return results;
}

function getAllFiles(dir: string): string[] {
    let results: string[] = [];
    const list = readdirSync(dir);
    
    list.forEach(file => {
        const fullPath = join(dir, file);
        const stat = statSync(fullPath);
        if (stat && stat.isDirectory()) { 
            // Skip node_modules and .git
            if (file !== 'node_modules' && file !== '.git') {
                results = results.concat(getAllFiles(fullPath));
            }
        } else { 
            // Only check text files
            if (/\.(ts|js|json|md|txt)$/.test(file)) {
                results.push(fullPath);
            }
        }
    });
    return results;
}

// Self-execution
if (import.meta.url === `file://${process.argv[1]}`) {
    auditPortability().then(results => {
        const failed = results.filter(r => !r.passed);
        console.log('\n🌍 Portability Audit Results:');
        
        results.forEach(r => {
            console.log(`${r.passed ? '✅' : '❌'} ${r.check}`);
            r.issues.forEach(i => console.log(`    ${i}`));
        });

        if (failed.length > 0) process.exit(1);
    });
}
