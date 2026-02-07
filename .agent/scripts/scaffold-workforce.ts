/**
 * Elite Workforce - Scaffolding Tool
 * 
 * Tool to "install" the AI Workforce into a new Astro project directory.
 * 
 * Usage: npx tsx .agent/scripts/scaffold-workforce.ts --target /path/to/new-project
 */

import { existsSync, mkdirSync, copyFileSync, readdirSync, lstatSync } from 'node:fs';
import { join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const CORE_DIR = join(__dirname, '..');

async function scaffold() {
    const targetArg = process.argv.find(a => a.startsWith('--target='));
    const targetDir = targetArg ? targetArg.split('=')[1] : process.cwd();

    console.log(`🚀 Scaffolding Elite Workforce into: ${targetDir}`);

    const agentDir = join(targetDir, '.agent');
    if (!existsSync(agentDir)) {
        mkdirSync(agentDir, { recursive: true });
    }

    // Core Folders to Copy
    const coreFolders = ['orchestration', 'config', 'graph', 'scripts/auditors'];

    for (const folder of coreFolders) {
        const source = join(CORE_DIR, folder);
        const dest = join(agentDir, folder);
        copyRecursiveSync(source, dest);
    }

    // Copy Root Protocol Files
    const protocolFiles = ['AGENTS.md', 'TOOLS.md', 'AGENT_PROTOCOL.md'];
    for (const file of protocolFiles) {
        const source = join(CORE_DIR, file);
        const dest = join(agentDir, file);
        if (existsSync(source)) {
            copyFileSync(source, dest);
            console.log(`✅ Copied protocol: ${file}`);
        }
    }

    console.log('\n✨ Workforce successfully initialized!');
    console.log('Next steps:');
    console.log('1. Run `npm install` in your project');
    console.log('2. Copy relevant skills to `.agent/skills`');
}

function copyRecursiveSync(src: string, dest: string) {
    const exists = existsSync(src);
    const stats = exists && lstatSync(src);
    const isDirectory = exists && stats && stats.isDirectory();

    if (isDirectory) {
        if (!existsSync(dest)) mkdirSync(dest, { recursive: true });
        readdirSync(src).forEach(childItemName => {
            copyRecursiveSync(join(src, childItemName), join(dest, childItemName));
        });
    } else {
        copyFileSync(src, dest);
        console.log(`✅ Copied: ${basename(dest)}`);
    }
}

scaffold().catch(err => {
    console.error('❌ Scaffolding failed:', err);
    process.exit(1);
});
