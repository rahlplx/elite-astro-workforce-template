/**
 * Elite Workforce - System Installer & Scaffolding Tool
 * 
 * Tool to "install" the AI Workforce into a new project directory.
 * 
 * Usage: npx tsx .agent/scripts/scaffold-workforce.ts --target /path/to/new-project
 */

import { existsSync, mkdirSync, copyFileSync, readdirSync, lstatSync, readFileSync, writeFileSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const CORE_DIR = join(__dirname, '..');

async function scaffold() {
    const targetArg = process.argv.find(a => a.startsWith('--target='));
    const targetDir = targetArg ? targetArg.split('=')[1].replace(/^["']|["']$/g, '') : process.cwd();

    console.log('--- 🛡️  Elite AI Workforce Installer ---');
    console.log(`🚀 Installing into: ${targetDir}\n`);

    const agentDir = join(targetDir, '.agent');
    if (!existsSync(agentDir)) {
        mkdirSync(agentDir, { recursive: true });
    }

    // 1. Core Folders to Copy
    const foldersToCopy = [
        'orchestration',
        'config',
        'graph',
        'rules',
        'skills',
        'scripts/auditors',
        'workflows'
    ];

    for (const folder of foldersToCopy) {
        const source = join(CORE_DIR, folder);
        const dest = join(agentDir, folder);
        if (existsSync(source)) {
            copyRecursiveSync(source, dest);
        }
    }

    // 2. Copy Root Protocol & Config Files
    const rootFiles = ['AGENTS.md', 'TOOLS.md', 'MANIFEST.md', 'package.json'];
    for (const file of rootFiles) {
        const source = join(CORE_DIR, file);
        const dest = join(agentDir, file);
        if (existsSync(source)) {
            copyFileSync(source, dest);
            console.log(`✅ Copied: ${file}`);
        }
    }

    // 3. Dependency Advice
    console.log('\n📦 REQUIRED DEPENDENCIES:');
    console.log('Please ensure the following are in your project\'s package.json:');
    console.log('  "tsx": "latest",');
    console.log('  "typescript": "latest",');
    console.log('  "node-fetch": "latest",');
    console.log('  "playwright": "latest" (for Browser-Eye)');

    // 4. Create .env.example if missing
    const envExamplePath = join(targetDir, '.env.example');
    if (!existsSync(envExamplePath)) {
        const envContent = `# Elite AI Workforce Configuration\nGITHUB_TOKEN=your_token_here\nGOOGLE_PROJECT_ID=your_project_id\nOPENAI_API_KEY=your_key\n`;
        writeFileSync(envExamplePath, envContent);
        console.log('✅ Created .env.example');
    }

    console.log('\n✨ Workforce successfully initialized!');
    console.log('👉 Tip: Run `npx tsx .agent/scripts/production-audit.ts` to verify the installation.');
}

function copyRecursiveSync(src: string, dest: string) {
    const exists = existsSync(src);
    const stats = exists && lstatSync(src);
    const isDirectory = exists && stats && stats.isDirectory();

    // Skip logs and tasks data
    const skipItems = ['logs', 'tasks', 'node_modules', '.git'];
    if (skipItems.includes(basename(src))) return;

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
    console.error('❌ Installation failed:', err);
    process.exit(1);
});
