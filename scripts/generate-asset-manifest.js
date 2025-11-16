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
    console.log('🔍 Scanning assets directory:', ASSETS_DIR);
    
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
    
    // Write manifest file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2));
    
    console.log(`✅ Generated manifest with ${assets.length} assets`);
    console.log(`📄 Output: ${OUTPUT_FILE}`);
    
    // Print summary by category
    const categories = {};
    assets.forEach(asset => {
        categories[asset.category] = (categories[asset.category] || 0) + 1;
    });
    
    console.log('\n📊 Assets by category:');
    for (const [category, count] of Object.entries(categories)) {
        console.log(`   ${category}: ${count}`);
    }
}

// Run the script
generateManifest();

