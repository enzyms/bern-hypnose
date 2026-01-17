#!/usr/bin/env node
/**
 * GBP Post Scheduler for Bern Hypnose
 *
 * Schedule multiple Google Business Profile posts from your blog content.
 * Posts are published immediately by the GBP API (no native scheduling),
 * but this script can be run via cron/GitHub Actions for automated posting.
 *
 * USAGE:
 * ======
 * # Generate a queue of posts from recent blog posts:
 * node scripts/schedule-gbp-posts.js --generate 10
 *
 * # Preview the queue:
 * node scripts/schedule-gbp-posts.js --preview
 *
 * # Publish the next post in queue (with image):
 * node scripts/schedule-gbp-posts.js --next
 *
 * # Publish next without image:
 * node scripts/schedule-gbp-posts.js --next --no-image
 *
 * # For automated weekly posting, add to crontab or GitHub Actions:
 * 0 9 * * 1 cd /path/to/project && node scripts/schedule-gbp-posts.js --next
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach((line) => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const [key, ...valueParts] = trimmed.split('=');
            if (key && valueParts.length > 0) {
                process.env[key.trim()] = valueParts.join('=').trim();
            }
        }
    });
}

// Configuration
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const ACCOUNT_ID = process.env.GOOGLE_ACCOUNT_ID || '107067054292838933166';
const LOCATION_ID = process.env.GOOGLE_LOCATION_ID || '15393771859516682512';

const BLOG_PATH = path.join(__dirname, '../src/content/blog');
const ASSETS_PATH = path.join(__dirname, '../src/assets/uploads');
const GBP_IMAGES_PATH = path.join(__dirname, '../public/gbp-images');
const QUEUE_PATH = path.join(__dirname, '../src/data/gbp-post-queue.json');
const HISTORY_PATH = path.join(__dirname, '../src/data/gbp-post-history.json');

const SITE_URL = 'https://bern-hypnose.ch';

/**
 * Get access token
 */
async function getAccessToken() {
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            refresh_token: REFRESH_TOKEN,
            grant_type: 'refresh_token'
        })
    });

    if (!response.ok) throw new Error(`Auth failed: ${await response.text()}`);
    return (await response.json()).access_token;
}

/**
 * Parse YAML-like frontmatter (handles nested objects)
 */
function parseFrontmatter(frontmatterText) {
    const result = {};
    const lines = frontmatterText.split('\n');
    let currentKey = null;
    let currentIndent = 0;

    for (const line of lines) {
        if (!line.trim()) continue;

        const indent = line.search(/\S/);
        const trimmed = line.trim();
        const colonIdx = trimmed.indexOf(':');

        if (colonIdx > 0) {
            const key = trimmed.substring(0, colonIdx).trim();
            const value = trimmed.substring(colonIdx + 1).trim();

            if (indent === 0) {
                if (value === '') {
                    result[key] = {};
                    currentKey = key;
                    currentIndent = indent;
                } else {
                    result[key] = value.replace(/^['"]|['"]$/g, '');
                    currentKey = null;
                }
            } else if (currentKey && indent > currentIndent) {
                if (typeof result[currentKey] === 'object') {
                    result[currentKey][key] = value.replace(/^['"]|['"]$/g, '');
                }
            }
        } else if (trimmed.startsWith('- ')) {
            if (currentKey && !Array.isArray(result[currentKey])) {
                result[currentKey] = [];
            }
            if (currentKey) {
                result[currentKey].push(trimmed.substring(2).trim());
            }
        }
    }

    return result;
}

/**
 * Get image path from frontmatter
 */
function getImagePath(frontmatter) {
    if (!frontmatter.image) return null;

    let imageSrc = null;
    if (typeof frontmatter.image === 'string') {
        imageSrc = frontmatter.image;
    } else if (frontmatter.image.src) {
        imageSrc = frontmatter.image.src;
    }

    if (!imageSrc) return null;

    if (imageSrc.startsWith('src/assets/uploads/')) {
        const filename = imageSrc.replace('src/assets/uploads/', '');
        return path.join(ASSETS_PATH, filename);
    }

    return path.join(ASSETS_PATH, imageSrc);
}

/**
 * Read all blog posts
 */
function getAllBlogPosts() {
    const files = fs.readdirSync(BLOG_PATH).filter((f) => f.endsWith('.md'));
    const posts = [];

    for (const file of files) {
        const slug = file.replace('.md', '');
        const content = fs.readFileSync(path.join(BLOG_PATH, file), 'utf-8');

        const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
        if (!frontmatterMatch) continue;

        const frontmatter = parseFrontmatter(frontmatterMatch[1]);

        posts.push({
            slug,
            title: frontmatter.title || slug,
            excerpt: frontmatter.excerpt || '',
            publishDate: frontmatter.publishDate ? new Date(frontmatter.publishDate) : new Date(),
            imagePath: getImagePath(frontmatter),
            body: frontmatterMatch[2].trim()
        });
    }

    posts.sort((a, b) => b.publishDate - a.publishDate);
    return posts;
}

/**
 * Convert blog post to GBP post data (with optional image)
 */
function blogToGbpPost(post, includeImage = true) {
    let cleanText = post.body
        .replace(/^#{1,6}\s+/gm, '')
        .replace(/!\[.*?\]\(.*?\)/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

    let postText = `${post.title}\n\n`;
    const teaser = cleanText.substring(0, 1200);
    postText += teaser;
    postText += '\n\n💚 Mehr dazu auf meinem Blog!';

    if (postText.length > 1500) {
        postText = postText.substring(0, 1450) + '...\n\n💚 Mehr auf meinem Blog!';
    }

    const postData = {
        summary: postText,
        callToAction: {
            actionType: 'LEARN_MORE',
            url: `https://bern-hypnose.ch/blog/${post.slug}/`
        },
        languageCode: 'de',
        topicType: 'STANDARD'
    };

    // Handle image
    if (includeImage && post.imagePath && fs.existsSync(post.imagePath)) {
        const imageFilename = path.basename(post.imagePath);

        // Ensure gbp-images directory exists
        if (!fs.existsSync(GBP_IMAGES_PATH)) {
            fs.mkdirSync(GBP_IMAGES_PATH, { recursive: true });
        }

        // Copy image to public folder
        const destPath = path.join(GBP_IMAGES_PATH, imageFilename);
        if (!fs.existsSync(destPath)) {
            fs.copyFileSync(post.imagePath, destPath);
            console.log(`   📷 Copied image: ${imageFilename}`);
        }

        // Add media to post
        const imageUrl = `${SITE_URL}/gbp-images/${imageFilename}`;
        postData.media = [
            {
                mediaFormat: 'PHOTO',
                sourceUrl: imageUrl
            }
        ];
        postData._imageUrl = imageUrl;
    }

    return postData;
}

/**
 * Load or create queue
 */
function loadQueue() {
    if (fs.existsSync(QUEUE_PATH)) {
        return JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf-8'));
    }
    return { posts: [], lastUpdated: null };
}

/**
 * Save queue
 */
function saveQueue(queue) {
    queue.lastUpdated = new Date().toISOString();
    fs.writeFileSync(QUEUE_PATH, JSON.stringify(queue, null, 2));
}

/**
 * Load history
 */
function loadHistory() {
    if (fs.existsSync(HISTORY_PATH)) {
        return JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf-8'));
    }
    return { posts: [] };
}

/**
 * Save to history
 */
function addToHistory(post, result) {
    const history = loadHistory();
    history.posts.push({
        ...post,
        publishedAt: new Date().toISOString(),
        gbpPostId: result.name,
        state: result.state,
        hasImage: !!(result.media && result.media.length > 0)
    });
    fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2));
}

/**
 * Generate queue from blog posts
 */
function generateQueue(count = 10) {
    const history = loadHistory();
    const publishedSlugs = new Set(history.posts.map((p) => p.slug));

    const allPosts = getAllBlogPosts();
    const unpublished = allPosts.filter((p) => !publishedSlugs.has(p.slug));

    console.log(`\n📚 Found ${allPosts.length} blog posts`);
    console.log(`✅ Already published to GBP: ${publishedSlugs.size}`);
    console.log(`📋 Available for queue: ${unpublished.length}`);

    // Count posts with images
    const withImages = unpublished.filter((p) => p.imagePath && fs.existsSync(p.imagePath));
    console.log(`📷 Posts with images: ${withImages.length}`);

    // Take the requested number, shuffled for variety
    const shuffled = unpublished.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, count);

    const queue = {
        posts: selected.map((p) => ({
            slug: p.slug,
            title: p.title,
            url: `https://bern-hypnose.ch/blog/${p.slug}/`,
            hasImage: !!(p.imagePath && fs.existsSync(p.imagePath)),
            addedAt: new Date().toISOString()
        })),
        lastUpdated: new Date().toISOString()
    };

    saveQueue(queue);
    console.log(`\n✅ Generated queue with ${queue.posts.length} posts`);
    console.log('\nQueue preview:');
    queue.posts.forEach((p, i) => {
        const imgIcon = p.hasImage ? '📷' : '  ';
        console.log(`  ${i + 1}. ${imgIcon} ${p.title}`);
    });

    return queue;
}

/**
 * Publish next post in queue
 */
async function publishNext(includeImage = true) {
    const queue = loadQueue();

    if (!queue.posts || queue.posts.length === 0) {
        console.log('\n📭 Queue is empty! Run with --generate first.');
        return;
    }

    const next = queue.posts[0];
    console.log(`\n📤 Publishing: ${next.title}`);

    // Get the full blog post
    const allPosts = getAllBlogPosts();
    const blogPost = allPosts.find((p) => p.slug === next.slug);

    if (!blogPost) {
        console.log(`❌ Blog post not found: ${next.slug}`);
        queue.posts.shift();
        saveQueue(queue);
        return;
    }

    // Convert to GBP format
    const postData = blogToGbpPost(blogPost, includeImage);

    console.log('\n📝 Post preview:');
    console.log('-'.repeat(40));
    console.log(postData.summary.substring(0, 300) + '...');
    console.log('-'.repeat(40));
    if (postData._imageUrl) {
        console.log(`📷 Image: ${postData._imageUrl}`);
        delete postData._imageUrl; // Remove internal field before sending
    }

    // Publish
    const accessToken = await getAccessToken();
    const url = `https://mybusiness.googleapis.com/v4/accounts/${ACCOUNT_ID}/locations/${LOCATION_ID}/localPosts`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
    });

    if (!response.ok) {
        const errorText = await response.text();

        // If image failed, retry without image
        if (errorText.includes('media') && postData.media) {
            console.log('\n⚠️ Image failed, retrying without image...');
            delete postData.media;

            const retryResponse = await fetch(url, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(postData)
            });

            if (!retryResponse.ok) {
                throw new Error(`Failed to publish: ${await retryResponse.text()}`);
            }

            const result = await retryResponse.json();
            console.log('\n✅ Published successfully (without image)');
            console.log('Post ID:', result.name);

            addToHistory(next, result);
            queue.posts.shift();
            saveQueue(queue);
            console.log(`\n📋 ${queue.posts.length} posts remaining in queue`);
            return;
        }

        throw new Error(`Failed to publish: ${errorText}`);
    }

    const result = await response.json();
    console.log('\n✅ Published successfully!');
    console.log('Post ID:', result.name);
    if (result.media && result.media.length > 0) {
        console.log('📷 Image attached');
    }

    addToHistory(next, result);
    queue.posts.shift();
    saveQueue(queue);

    console.log(`\n📋 ${queue.posts.length} posts remaining in queue`);
}

/**
 * Preview queue
 */
function previewQueue() {
    const queue = loadQueue();
    const history = loadHistory();

    console.log('\n📋 Current Queue:');
    if (queue.posts && queue.posts.length > 0) {
        queue.posts.forEach((p, i) => {
            const imgIcon = p.hasImage ? '📷' : '  ';
            console.log(`  ${i + 1}. ${imgIcon} ${p.title}`);
            console.log(`        ${p.url}`);
        });
    } else {
        console.log('  (empty)');
    }

    console.log(`\n📜 Published History (last 5):`);
    const recent = history.posts.slice(-5).reverse();
    if (recent.length > 0) {
        recent.forEach((p) => {
            const date = new Date(p.publishedAt).toLocaleDateString('de-CH');
            const imgIcon = p.hasImage ? '📷' : '  ';
            console.log(`  • ${imgIcon} ${p.title} (${date})`);
        });
    } else {
        console.log('  (none)');
    }

    // Stats
    const allPosts = getAllBlogPosts();
    const withImages = allPosts.filter((p) => p.imagePath && fs.existsSync(p.imagePath));
    console.log(`\n📊 Stats:`);
    console.log(`   Total blog posts: ${allPosts.length}`);
    console.log(`   Posts with images: ${withImages.length}`);
    console.log(`   Already published: ${history.posts.length}`);
    console.log(`   In queue: ${queue.posts?.length || 0}`);
}

/**
 * Main
 */
async function main() {
    console.log('='.repeat(60));
    console.log('GBP Post Scheduler');
    console.log('='.repeat(60));

    const args = process.argv.slice(2);
    const noImage = args.includes('--no-image');

    if (args.includes('--generate')) {
        const countIdx = args.indexOf('--generate') + 1;
        const count = parseInt(args[countIdx]) || 10;
        generateQueue(count);
    } else if (args.includes('--preview')) {
        previewQueue();
    } else if (args.includes('--next')) {
        if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
            console.error('❌ Missing OAuth credentials');
            process.exit(1);
        }
        await publishNext(!noImage);
    } else {
        console.log('\n📋 Usage:');
        console.log('  --generate [n]  Generate queue from n blog posts (default: 10)');
        console.log('  --preview       Show current queue and history');
        console.log('  --next          Publish next post in queue (with image)');
        console.log('  --no-image      Skip image when publishing');
        console.log('\nExample workflow:');
        console.log('  1. yarn gbp:schedule --generate 20');
        console.log('  2. yarn gbp:schedule --preview');
        console.log('  3. yarn gbp:schedule --next  (run weekly via cron)');
    }
}

main().catch(console.error);
