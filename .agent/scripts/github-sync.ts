/**
 * Elite Workforce - GitHub Sync Script
 * 
 * Safely executes git operations using 'gh' CLI.
 */

import { execSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

async function main() {
    const action = process.argv[2] || 'status';
    const message = process.argv[3] || 'chore: update codebase';

    console.log(`🐙 [GitHub Manager] Action: ${action}`);

    try {
        // 1. Check Auth (Zero-Trust)
        if (!checkAuth()) {
            console.error('❌ GitHub CLI not authenticated. Run `gh auth login` first.');
            process.exit(1);
        }

        switch (action) {
            case 'status':
                run('git status');
                break;
            case 'sync':
                console.log('🔄 Syncing with remote...');
                run('git pull --rebase origin main');
                run('git add .');
                
                // Only commit if changes exist
                const status = run('git status --porcelain', true);
                if (status.trim()) {
                    // RED TEAM HARDENING: Use spawnSync for safe argument handling
                    console.log(`> git commit -m "${message}"`);
                    const commitResult = spawnSync('git', ['commit', '-m', message], { encoding: 'utf-8' });
                    if (commitResult.status !== 0) {
                        throw new Error(`Git commit failed: ${commitResult.stderr}`);
                    }
                    console.log(commitResult.stdout);
                    console.log('✅ Committed changes.');
                } else {
                    console.log('ℹ️ No changes to commit.');
                }
                
                run('git push origin main');
                console.log('🚀 Pushed to GitHub.');
                break;
            case 'push':
                run('git push origin main');
                break;
            default:
                console.error(`Unknown action: ${action}`);
        }
    } catch (error: any) {
        console.error(`❌ Error: ${error.message}`);
        process.exit(1);
    }
}

function checkAuth(): boolean {
    try {
        // Returns 0 if logged in, 1 if not
        execSync('gh auth status', { stdio: 'ignore' });
        return true;
    } catch {
        return false;
    }
}

function run(command: string, silent = false): string {
    if (!silent) console.log(`> ${command}`);
    const result = execSync(command, { encoding: 'utf-8' });
    if (!silent) console.log(result);
    return result;
}

main();
