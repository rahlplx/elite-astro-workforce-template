/**
 * System Integrity Validator
 * 
 * Verifies bi-directional connections between:
 * - agents.graph.json <-> skills/ folders
 * - workflows/ steps <-> scripts/
 * - rules/ <-> executor.ts injection
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..');
const AGENT_DIR = join(ROOT, '.agent');

function checkIntegrity() {
    console.log('🛡️  [System Integrity] Starting validation...');
    let errors = 0;

    // 1. Graph <-> Skills Validation
    const graphPath = join(AGENT_DIR, 'graph', 'agents.graph.json');
    const skillsDir = join(AGENT_DIR, 'skills');
    
    if (existsSync(graphPath)) {
        const graph = JSON.parse(readFileSync(graphPath, 'utf8'));
        const skillFolders = readdirSync(skillsDir);

        graph.nodes.forEach((node: any) => {
            if (node.id !== node.id.toLowerCase()) {
              // Ignore team IDs if they are mixed case, but graph usually has lowercase IDs
            }
            
            if (node.skillPath) {
                const absoluteSkillPath = join(ROOT, node.skillPath);
                if (!existsSync(absoluteSkillPath)) {
                    console.error(`❌ GRAPH ERROR: Node '${node.id}' references missing skillPath: ${node.skillPath}`);
                    errors++;
                }
            }
        });

        // Check for orphaned skill folders (not in graph)
        const nodeSkillPaths = new Set(graph.nodes.map((n: any) => n.skillPath).filter(Boolean));
        skillFolders.forEach(folder => {
            const relativePath = `.agent/skills/${folder}`;
            if (!nodeSkillPaths.has(relativePath)) {
                console.warn(`⚠️  ORPHAN SKILL: Folder '${folder}' is not referenced in agents.graph.json.`);
            }
        });
    }

    // 2. Protocols <-> Executor Validation
    const executorPath = join(AGENT_DIR, 'orchestration', 'executor.ts');
    if (existsSync(executorPath)) {
        const executor = readFileSync(executorPath, 'utf8');
        const requiredRefs = ['LEARNED_RULES.md', 'ELITE_SAFE_WORKFLOW.md'];
        requiredRefs.forEach(ref => {
            if (!executor.includes(ref)) {
                console.error(`❌ EXECUTOR ERROR: Missing mandatory protocol injection for ${ref}`);
                errors++;
            }
        });
    }

    // 3. Workflows <-> Files Validation
    const workflowsDir = join(AGENT_DIR, 'workflows');
    const workflows = readdirSync(workflowsDir).filter(f => f.endsWith('.md'));
    
    workflows.forEach(file => {
        const content = readFileSync(join(workflowsDir, file), 'utf8');
        // Match common script patterns in workflows
        const scriptMatches = content.matchAll(/run `([^`]+)\.ts`/g);
        for (const match of scriptMatches) {
            const scriptPath = join(AGENT_DIR, 'scripts', `${match[1]}.ts`);
            // Check if it's a relative path to .agent/scripts
            if (!existsSync(scriptPath)) {
                // Try absolute or other variations
                console.warn(`⚠️  WORKFLOW WARNING: '${file}' references script '${match[1]}.ts' which might be missing or wrongly pathed.`);
            }
        }
    });

    console.log(`\n📊 Integrity Check Complete: ${errors} errors found.`);
    if (errors === 0) {
        console.log('✅ PASS: All core system connections are validated.');
        process.exit(0);
    } else {
        process.exit(1);
    }
}

checkIntegrity();
