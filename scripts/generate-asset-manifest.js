#!/usr/bin/env node

/**
 * Generate Asset Manifest
 * Scans src/assets/images directory and creates a JSON manifest file
 * Run this script whenever you add/remove images from the assets folder
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ASSETS_DIR = path.join(__dirname, '../src/assets/images');
const OUTPUT_FILE = path.join(ASSETS_DIR, 'asset-manifest.json');

const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.bmp'];

/**
 * Recursively scan directory for image files
 */
function scanDirectory(dir, baseDir = dir) {
    const assets = [];
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
            // Recursively scan subdirectories
            assets.push(...scanDirectory(fullPath, baseDir));
        } else if (entry.isFile()) {
            const ext = path.extname(entry.name).toLowerCase();
            
            if (IMAGE_EXTENSIONS.includes(ext)) {
                // Get relative path from base directory
                const relativePath = path.relative(baseDir, fullPath);
                const category = relativePath.split(path.sep)[0];
                
                assets.push({
                    name: entry.name,
                    path: relativePath.replace(/\\/g, '/'), // Normalize to forward slashes
                    category: category
                });
            }
        }
    }
    
    return assets;
}

/**
 * Generate the manifest
 */
function generateManifest() {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`\n[${timestamp}] 🔍 Scanning assets directory...`);
    
    if (!fs.existsSync(ASSETS_DIR)) {
        console.error('❌ Assets directory not found:', ASSETS_DIR);
        process.exit(1);
    }
    
    const assets = scanDirectory(ASSETS_DIR);
    
    // Sort assets by category and name
    assets.sort((a, b) => {
        if (a.category !== b.category) {
            return a.category.localeCompare(b.category);
        }
        return a.name.localeCompare(b.name);
    });
    
    const manifest = {
        generated: new Date().toISOString(),
        count: assets.length,
        assets: assets
    };

    const newContent = JSON.stringify(manifest, null, 2);

    // Only write if content changed (excluding timestamp)
    let shouldWrite = true;
    if (fs.existsSync(OUTPUT_FILE)) {
        const oldContent = fs.readFileSync(OUTPUT_FILE, 'utf8');
        const oldManifest = JSON.parse(oldContent);

        // Compare asset counts and paths (ignore timestamp)
        if (oldManifest.count === manifest.count) {
            const oldPaths = oldManifest.assets.map(a => a.path).sort();
            const newPaths = manifest.assets.map(a => a.path).sort();
            shouldWrite = JSON.stringify(oldPaths) !== JSON.stringify(newPaths);
        }
    }

    if (shouldWrite) {
        fs.writeFileSync(OUTPUT_FILE, newContent);
        console.log(`✅ Generated manifest with ${assets.length} assets`);
    } else {
        console.log(`ℹ️  No changes detected (${assets.length} assets)`);
    }
}

// Run the script
generateManifest();

