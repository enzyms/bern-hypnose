#!/usr/bin/env node
/**
 * Copy all blog post images to public/gbp-images/
 * Run this before deploying to ensure all images are publicly accessible for GBP posts.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const BLOG_PATH = path.join(__dirname, '../src/content/blog');
const ASSETS_PATH = path.join(__dirname, '../src/assets/uploads');
const DEST_PATH = path.join(__dirname, '../public/gbp-images');

// Ensure destination exists
if (!fs.existsSync(DEST_PATH)) {
    fs.mkdirSync(DEST_PATH, { recursive: true });
}

const files = fs.readdirSync(BLOG_PATH).filter((f) => f.endsWith('.md'));
let copied = 0;
let skipped = 0;
let missing = 0;

console.log('📷 Copying blog images to public/gbp-images/...\n');

for (const file of files) {
    const content = fs.readFileSync(path.join(BLOG_PATH, file), 'utf-8');

    // Find image src in frontmatter
    const match = content.match(/image:[\s\S]*?src:\s*(.+)/);
    if (!match) continue;

    let imageSrc = match[1].trim().replace(/["']/g, '');
    if (imageSrc.startsWith('src/assets/uploads/')) {
        imageSrc = imageSrc.replace('src/assets/uploads/', '');
    }

    const srcPath = path.join(ASSETS_PATH, imageSrc);
    const destPath = path.join(DEST_PATH, imageSrc);

    if (fs.existsSync(srcPath)) {
        if (!fs.existsSync(destPath)) {
            fs.copyFileSync(srcPath, destPath);
            console.log('  ✅', imageSrc);
            copied++;
        } else {
            skipped++;
        }
    } else {
        console.log('  ⚠️ Missing:', imageSrc);
        missing++;
    }
}

console.log('\n' + '='.repeat(40));
console.log(`✅ Copied: ${copied} new images`);
console.log(`⏭️  Skipped: ${skipped} (already exist)`);
if (missing > 0) {
    console.log(`⚠️  Missing: ${missing}`);
}
console.log(`📁 Total in gbp-images/: ${fs.readdirSync(DEST_PATH).length}`);
