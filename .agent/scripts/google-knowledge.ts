import { GoogleKnowledgeService, googleKnowledge } from '../services/google-knowledge.js';
import { logger } from '../orchestration/logger.js';

// Simple argument parsing
const args = process.argv.slice(2);
const command = args[0]; // search or get
const query = args.slice(1).join(' ');

async function main() {
    try {
        if (command === 'search') {
            if (!query) {
                console.error('Usage: search <query>');
                process.exit(1);
            }
            logger.info(`Searching Google Knowledge for "${query}"`);
            const results = await googleKnowledge.search(query);
            
            console.log('--- Google Knowledge Results ---\n');
            if (!results.results || results.results.length === 0) {
                console.log('No results found.');
            } else {
                results.results.forEach((item, index) => {
                    console.log(`${index + 1}. [${item.document.title}](${item.document.url})`);
                    console.log(`> ${item.snippets[0]}\n`);
                });
            }
        } else if (command === 'get') {
             // Implementation for retrieving full document content
             // For now just search is primary use case requested
             logger.info('Get document not fully implemented in CLI script yet.');
        } else {
            console.error('Unknown command. Use "search <query>"');
            process.exit(1);
        }
    } catch (error: any) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

main();
