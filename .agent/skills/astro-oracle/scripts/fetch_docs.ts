/**
 * Astro Oracle: Documentation Pre-Fetcher
 * 
 * This script fetches summaries of key Astro documentation pages
 * and caches them locally for offline agent use.
 * 
 * Usage: npx tsx .agent/skills/astro-oracle/scripts/fetch_docs.ts
 * 
 * @requires node >= 22
 * @requires tsx
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const INDEX_PATH = join(__dirname, '..', 'doc_index.json');
const CACHE_PATH = join(__dirname, '..', 'cache');

interface DocPage {
    title: string;
    path: string;
    keywords: string[];
}

interface DocIndex {
    _meta: { version: string; source: string; lastUpdated: string };
    categories: Record<string, { description: string; pages: DocPage[] }>;
}

async function fetchDocSummary(path: string): Promise<string> {
    const url = `https://docs.astro.build${path}`;
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const html = await response.text();

        // Extract first paragraph from content
        const match = html.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
        return match ? match[1].replace(/<[^>]+>/g, '').trim().slice(0, 500) : 'No summary available';
    } catch (error) {
        console.error(`Failed to fetch ${path}:`, error);
        return 'Fetch failed';
    }
}

async function main() {
    console.log('🚀 Astro Oracle: Starting Doc Pre-Fetch...');

    // Load index
    const index: DocIndex = JSON.parse(readFileSync(INDEX_PATH, 'utf-8'));

    // Create cache directory
    if (!existsSync(CACHE_PATH)) {
        mkdirSync(CACHE_PATH, { recursive: true });
    }

    const cache: Record<string, { title: string; summary: string; fetchedAt: string }> = {};

    for (const [categoryKey, category] of Object.entries(index.categories)) {
        console.log(`\n📂 Category: ${categoryKey}`);

        for (const page of category.pages) {
            console.log(`  ⏳ Fetching: ${page.title}...`);
            const summary = await fetchDocSummary(page.path);
            cache[page.path] = {
                title: page.title,
                summary,
                fetchedAt: new Date().toISOString()
            };

            // Rate limiting to be respectful to the server
            await new Promise(r => setTimeout(r, 500));
        }
    }

    // Write cache
    const cachePath = join(CACHE_PATH, 'doc_summaries.json');
    writeFileSync(cachePath, JSON.stringify(cache, null, 2));

    console.log(`\n✅ Done! Cached ${Object.keys(cache).length} pages to ${cachePath}`);
}

main().catch(console.error);
