import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '..', '..');

async function runHealthCheck() {
    console.log('🛡️  Agentic System Health Check...');
    let errors = 0;

    // 1. Check Core Rules
    const coreRules = [
        'AGENTS.md',
        'rules/CONSTITUTION.md',
        'rules/CODE_STANDARDS.md',
        'rules/AUDIT_POLICIES.md',
        'rules/PHI_PROTOCOL.md',
        'TOOLS.md'
    ];

    for (const rule of coreRules) {
        if (existsSync(join(ROOT_DIR, '.agent', rule))) {
            console.log(`✅ Rule Found: ${rule}`);
        } else {
            console.error(`❌ Missing Rule: ${rule}`);
            errors++;
        }
    }

    // 2. Validate Graph Integrity
    const graphPath = join(ROOT_DIR, '.agent', 'graph', 'agents.graph.json');
    if (existsSync(graphPath)) {
        try {
            const graph = JSON.parse(readFileSync(graphPath, 'utf8'));
            console.log(`✅ Graph Valid (v${graph.version})`);
            
            // Link check skills
            for (const node of graph.nodes) {
                if (node.skillPath) {
                    const skillPath = join(ROOT_DIR, node.skillPath, 'SKILL.md');
                    if (!existsSync(skillPath)) {
                        console.error(`❌ Dead Link in Graph: agent ${node.id} missing skill at ${node.skillPath}`);
                        errors++;
                    }
                }
            }
        } catch (e: any) {
            console.error(`❌ Graph JSON Corrupt: ${e.message}`);
            errors++;
        }
    }


    // 3. Stack Check
    const criticalFiles = [
        'astro.config.mjs',
        'package.json',
        'tsconfig.json',
        'tailwind.config.mjs'
    ];

    for (const file of criticalFiles) {
        if (existsSync(join(ROOT_DIR, file))) {
            console.log(`✅ Stack Config Found: ${file}`);
        } else {
            console.warn(`⚠️  Missing Stack Config: ${file}`);
            // Non-fatal, as some might be implicit or named differently
        }
    }

    // 4. Workflow Directory Check
    if (existsSync(join(ROOT_DIR, '.agent', 'workflows'))) {
        console.log('✅ Workflows Directory Found');
    } else {
        console.error('❌ Workflows Directory Missing');
        errors++;
    }

    if (errors === 0) {
        console.log('\n✨ SYSTEM BATTLE-TESTED & READY.');
    } else {
        console.error(`\n⚠️ SYSTEM COMPROMISED: ${errors} errors found.`);
        process.exit(1);
    }
}

runHealthCheck();
