import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AGENT_ROOT = join(__dirname, '..');
const SKILLS_DIR = join(AGENT_ROOT, 'skills');
const GRAPH_PATH = join(AGENT_ROOT, 'graph', 'agents.graph.json');

function verifyCoverage() {
    console.log('🔍 Verifying Skill Coverage...');

    // 1. Get all skill buckets
    const skillFolders = readdirSync(SKILLS_DIR).filter(f => !f.startsWith('.'));
    console.log(`📂 Found ${skillFolders.length} skill folders.`);

    // 2. Load Graph
    const graph = JSON.parse(readFileSync(GRAPH_PATH, 'utf8'));
    const graphNodes = new Set(graph.nodes.map((n: any) => n.id));
    
    // 3. Find Orphans
    const orphans: string[] = [];
    for (const skill of skillFolders) {
        // Normalize skill folder name to agent ID logic if needed
        // Assuming agent ID matches folder name or matches closely
        if (!graphNodes.has(skill)) {
            orphans.push(skill);
        }
    }

    if (orphans.length > 0) {
        console.warn(`⚠️ The following ${orphans.length} skills are NOT in the graph:`);
        orphans.forEach(o => console.warn(`   - ${o}`));
    } else {
        console.log('✅ All skills are mapped in the graph!');
    }
}

verifyCoverage();
