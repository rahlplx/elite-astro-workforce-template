/**
 * Browser-Eye: Visual Feedback for Vibe Coders
 * 
 * Captures a screenshot of the local dev server and saves it for visual verification.
 */

import { chromium } from 'playwright';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

async function captureVibe(port: number = 4321, path: string = '/') {
    const url = `http://localhost:${port}${path}`;
    const outputDir = '.agent/vibe-previews';
    
    if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `preview-${timestamp}.png`;
    const outputPath = join(outputDir, filename);

    console.log(`👁️  [BROWSER-EYE]: Capturing vibe at ${url}...`);

    let browser;
    try {
        browser = await chromium.launch();
        const page = await browser.newPage();
        
        // Use a standard "Premium" viewport
        await page.setViewportSize({ width: 1440, height: 900 });
        
        // Wait for dev server to be ready
        await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
        
        await page.screenshot({ path: outputPath, fullPage: true });
        console.log(`✅ [BROWSER-EYE]: Screenshot saved to ${outputPath}`);
        
        // Also update a "latest" symlink or file for easy reference
        const latestPath = join(outputDir, 'latest.png');
        await page.screenshot({ path: latestPath, fullPage: true });
        
    } catch (e: any) {
        if (e.message.includes('ECONNREFUSED')) {
            console.warn(`⚠️  [BROWSER-EYE]: Dev server not running at ${url}. Skipping screenshot.`);
        } else {
            console.error(`❌ [BROWSER-EYE]: Failed to capture screenshot: ${e.message}`);
        }
    } finally {
        if (browser) await browser.close();
    }
}

const argPort = process.argv[2] ? parseInt(process.argv[2]) : 4321;
captureVibe(argPort).catch(console.error);
