/**
 * MCP Initialization Script
 * Configures the .agent environment for project-specific paths.
 */
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const PROJECT_ROOT = process.cwd();
const MCP_CONFIG_PATH = join(PROJECT_ROOT, '.agent', 'mcp-servers.json');

interface MCPConfig {
  mcpServers: {
    filesystem?: {
      args: string[];
    };
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

console.log('🤖 Initializing Agent Force...');

// 1. Configure MCP Servers
if (existsSync(MCP_CONFIG_PATH)) {
    console.log('🔌 Configuring MCP Servers...');
    const config: MCPConfig = JSON.parse(readFileSync(MCP_CONFIG_PATH, 'utf-8'));
    
    // Update filesystem path to current project root
    if (config.mcpServers.filesystem) {
        config.mcpServers.filesystem.args = [
            "-y",
            "@modelcontextprotocol/server-filesystem",
            PROJECT_ROOT
        ];
        console.log(`   ✅ filesystem: Mapped to ${PROJECT_ROOT}`);
    }

    writeFileSync(MCP_CONFIG_PATH, JSON.stringify(config, null, 2));
} else {
    console.warn('⚠️  .agent/mcp-servers.json not found. Skipping MCP setup.');
}

// 2. Initial Environment Scan
console.log('🔍 Scanning Environment...');
const hasTailwind = existsSync(join(PROJECT_ROOT, 'tailwind.config.mjs')) || 
                    existsSync(join(PROJECT_ROOT, 'src/styles/global.css'));
const hasKeystatic = existsSync(join(PROJECT_ROOT, 'keystatic.config.ts'));
const hasAstro = existsSync(join(PROJECT_ROOT, 'astro.config.mjs'));

console.log(`   - Astro:     ${hasAstro ? '✅ Detected' : '❌ Not Found'}`);
console.log(`   - Tailwind:  ${hasTailwind ? '✅ Detected' : '❌ Not Found'}`);
console.log(`   - Keystatic: ${hasKeystatic ? '✅ Detected' : '❌ Not Found'}`);

console.log('\n✅ Setup Complete! Agentic Workforce is ready.');
