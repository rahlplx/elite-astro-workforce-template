/**
 * Smile Savers Flow - CLI Interface
 * 
 * Command-line interface for orchestration system
 * 
 * @module orchestration/cli
 */

import { orchestrate, getMemoryStats } from './index.js';
import { memory } from './memory.js';

/**
 * CLI Commands
 */
export const commands = {
    /**
     * Start orchestration flow
     */
    async start(userRequest: string) {
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║           Smile Savers Flow - Orchestration CLI           ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');

        const result = await orchestrate(userRequest);

        console.log('\n✅ Orchestration Complete\n');
        console.log(`Mode: ${result.mode}`);
        console.log(`Agents: ${result.agents.join(', ')}`);
        console.log(`\n${result.message}\n`);

        return result;
    },

    /**
     * Validate tech stack configuration
     */
    async 'validate-stack'() {
        const { validator } = await import('./validators.js');
        console.log('🔍 Smile Savers Flow - Stack Validation\n');

        const result = await validator.validateAll();

        result.checks.forEach(check => {
            const icon = check.passed ? '✅' : '❌';
            console.log(`${icon} ${check.name}: ${check.message}`);
        });

        console.log(`\nOverall Status: ${result.passed ? 'PASSED' : 'FAILED'}\n`);
        return result;
    },

    /**
     * Show memory statistics
     */
    status() {
        console.log('📊 Smile Savers Flow - Status\n');

        const stats = getMemoryStats();

        console.log(`Session ID: ${stats.sessionId}`);
        console.log(`Messages: ${stats.messageCount}`);
        console.log(`Completed Tasks: ${stats.completedTasks}`);
        console.log(`Most Used Agent: ${stats.mostUsedAgent}`);
        console.log(`Task Success Rate: ${stats.successRate}`);
        console.log(`Total Outcomes: ${stats.totalTaskOutcomes}\n`);

        return stats;
    },

    /**
     * Show memory context
     */
    memory() {
        console.log('🧠 Smile Savers Flow - Memory\n');

        const context = memory.getContext();
        const prefs = memory.getPreferences();

        console.log('Recent Messages:');
        context.messages.slice(-5).forEach(msg => {
            const prefix = msg.role === 'user' ? '👤' : '🤖';
            const agent = msg.agent ? ` [${msg.agent}]` : '';
            console.log(`${prefix}${agent}: ${msg.content.substring(0, 60)}...`);
        });

        console.log('\nPreferences:');
        console.log(`  Code Style: ${prefs.codeStyle.indentation}, ${prefs.codeStyle.quoteStyle} quotes`);
        console.log(`  Auto Approve: ${prefs.workflowPreferences.autoApprove}`);
        console.log(`  Verbose Logging: ${prefs.workflowPreferences.verboseLogging}\n`);

        return { context, prefs };
    },

    /**
     * Show learning data
     */
    learn() {
        console.log('📚 Smile Savers Flow - Learning Data\n');

        const learning = memory.getLearningData();

        console.log(`Total Task Outcomes: ${learning.taskOutcomes.length}`);

        if (learning.taskOutcomes.length > 0) {
            const recent = learning.taskOutcomes.slice(-5);
            console.log('\nRecent Outcomes:');
            recent.forEach(outcome => {
                const status = outcome.success ? '✅' : '❌';
                console.log(`${status} ${outcome.task} (${outcome.agent}) - ${outcome.duration}ms`);
            });
        }

        console.log('\nError Patterns:');
        Object.entries(learning.errorPatterns)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .forEach(([error, count]) => {
                console.log(`  ${error}: ${count} occurrences`);
            });

        console.log('');
        return learning;
    },

    /**
     * Clear memory
     */
    clear() {
        console.log('🗑️  Clearing memory...\n');
        memory.clear();
        console.log('✅ Memory cleared\n');
    },

    /**
     * Show help
     */
    help() {
        console.log('╔════════════════════════════════════════════════════════════╗');
        console.log('║           Smile Savers Flow - CLI Commands                ║');
        console.log('╚════════════════════════════════════════════════════════════╝\n');

        console.log('Usage: npx tsx .agent/orchestration/cli.ts <command> [args]\n');

        console.log('Commands:');
        console.log('  start <request>    Start orchestration with user request');
        console.log('  validate-stack     Verify Astro/Tailwind/DaisyUI config');
        console.log('  status             Show memory statistics');
        console.log('  memory             Show conversation context');
        console.log('  learn              Show learning data');
        console.log('  clear              Clear all memory');
        console.log('  help               Show this help message\n');

        console.log('Examples:');
        console.log('  npx tsx .agent/orchestration/cli.ts start "Create a hero section"');
        console.log('  npx tsx .agent/orchestration/cli.ts validate-stack');
        console.log('  npx tsx .agent/orchestration/cli.ts status\n');
    },
};

/**
 * Main CLI entry point
 */
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    const commandArgs = args.slice(1);

    if (!command || command === 'help') {
        commands.help();
        return;
    }

    if (command === 'start') {
        if (commandArgs.length === 0) {
            console.error('❌ Error: Please provide a request\n');
            console.log('Usage: npx tsx .agent/orchestration/cli.ts start "your request"\n');
            process.exit(1);
        }
        await commands.start(commandArgs.join(' '));
    } else if (command === 'validate-stack') {
        await commands['validate-stack']();
    } else if (command in commands) {
        await (commands as any)[command]();
    } else {
        console.error(`❌ Unknown command: ${command}\n`);
        commands.help();
        process.exit(1);
    }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(console.error);
}
