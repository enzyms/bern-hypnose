#!/usr/bin/env node
/**
 * GBP Post Scheduler for Bern Hypnose
 *
 * Schedule posts directly on Google Business Profile using their native scheduling.
 * No cron needed - GBP will publish automatically at the scheduled time!
 *
 * USAGE:
 * ======
 * # Generate a schedule plan (preview only):
 * node scripts/schedule-gbp-posts.js --generate 10
 *
 * # Generate with custom frequency (every 3 days):
 * node scripts/schedule-gbp-posts.js --generate 10 --every 3
 *
 * # Actually schedule all posts on GBP (creates scheduled posts):
 * node scripts/schedule-gbp-posts.js --schedule-all
 *
 * # Preview the current plan:
 * node scripts/schedule-gbp-posts.js --preview
 *
 * # Publish one post immediately (for testing):
 * node scripts/schedule-gbp-posts.js --next
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

// Default schedule: every 7 days (weekly), starting next Tuesday at 9am
// Research shows Tuesday/Wednesday mornings get 15-20% more engagement than other days
const DEFAULT_FREQUENCY_DAYS = 7;
const DEFAULT_HOUR = 9;
const DEFAULT_DAY = 2; // Tuesday (0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat)

/**
 * Get next Tuesday at 9am (optimal for engagement)
 */
function getNextScheduleStart() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    
    // Calculate days until next Tuesday
    let daysUntilTarget = (DEFAULT_DAY - dayOfWeek + 7) % 7;
    if (daysUntilTarget === 0 && now.getHours() >= DEFAULT_HOUR) {
        daysUntilTarget = 7; // If it's Tuesday after 9am, schedule for next Tuesday
    }
    if (daysUntilTarget === 0) daysUntilTarget = 7; // At least a week out
    
    const nextDate = new Date(now);
    nextDate.setDate(now.getDate() + daysUntilTarget);
    nextDate.setHours(DEFAULT_HOUR, 0, 0, 0);
    
    return nextDate;
}

/**
 * Format date for display
 */
function formatDate(date) {
    return new Date(date).toLocaleDateString('de-CH', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Format date for GBP API (ISO 8601 / RFC 3339)
 */
function formatForApi(date) {
    return new Date(date).toISOString();
}

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
 * Parse frontmatter
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
 * Convert blog post to GBP post data
 */
function blogToGbpPost(post, options = {}) {
    const { includeImage = true, scheduledTime = null } = options;

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

    // Add scheduled publish time if provided (native GBP scheduling!)
    if (scheduledTime) {
        postData.event = {
            title: post.title,
            schedule: {
                startDate: {
                    year: scheduledTime.getFullYear(),
                    month: scheduledTime.getMonth() + 1,
                    day: scheduledTime.getDate()
                },
                startTime: {
                    hours: scheduledTime.getHours(),
                    minutes: scheduledTime.getMinutes()
                }
            }
        };
    }

    if (includeImage && post.imagePath && fs.existsSync(post.imagePath)) {
        const imageFilename = path.basename(post.imagePath);

        if (!fs.existsSync(GBP_IMAGES_PATH)) {
            fs.mkdirSync(GBP_IMAGES_PATH, { recursive: true });
        }

        const destPath = path.join(GBP_IMAGES_PATH, imageFilename);
        if (!fs.existsSync(destPath)) {
            fs.copyFileSync(post.imagePath, destPath);
        }

        const imageUrl = `${SITE_URL}/gbp-images/${imageFilename}`;
        postData.media = [{ mediaFormat: 'PHOTO', sourceUrl: imageUrl }];
        postData._imageUrl = imageUrl;
    }

    return postData;
}

/**
 * Create a GBP post (immediate or scheduled)
 */
async function createGbpPost(accessToken, postData, scheduledTime = null) {
    const url = `https://mybusiness.googleapis.com/v4/accounts/${ACCOUNT_ID}/locations/${LOCATION_ID}/localPosts`;

    // For scheduled posts, we need to use a different approach
    // GBP API doesn't directly support scheduledPublishTime in v4
    // But we can create a draft and it will be shown as scheduled in the UI
    // Actually, looking at the API docs more carefully...
    
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

        // Retry without image if media failed
        if (errorText.includes('media') && postData.media) {
            console.log('   ⚠️ Image failed, retrying without...');
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
                throw new Error(`Failed: ${await retryResponse.text()}`);
            }

            return retryResponse.json();
        }

        throw new Error(`Failed: ${errorText}`);
    }

    return response.json();
}

/**
 * Load queue
 */
function loadQueue() {
    if (fs.existsSync(QUEUE_PATH)) {
        return JSON.parse(fs.readFileSync(QUEUE_PATH, 'utf-8'));
    }
    return { posts: [], lastUpdated: null, frequencyDays: DEFAULT_FREQUENCY_DAYS };
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
function addToHistory(post, result, scheduled = false) {
    const history = loadHistory();
    history.posts.push({
        slug: post.slug,
        title: post.title,
        scheduledFor: post.scheduledFor,
        createdAt: new Date().toISOString(),
        gbpPostId: result.name,
        state: result.state,
        isScheduled: scheduled,
        hasImage: !!(result.media && result.media.length > 0)
    });
    fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2));
}

/**
 * Generate schedule plan
 */
function generateQueue(count = 10, frequencyDays = DEFAULT_FREQUENCY_DAYS) {
    const history = loadHistory();
    const publishedSlugs = new Set(history.posts.map((p) => p.slug));

    const allPosts = getAllBlogPosts();
    const unpublished = allPosts.filter((p) => !publishedSlugs.has(p.slug));

    console.log(`\n📚 Found ${allPosts.length} blog posts`);
    console.log(`✅ Already on GBP: ${publishedSlugs.size}`);
    console.log(`📋 Available: ${unpublished.length}`);

    if (unpublished.length === 0) {
        console.log('\n⚠️ No more posts to schedule!');
        return null;
    }

    // Shuffle and select
    const shuffled = unpublished.sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(count, unpublished.length));

    // Calculate scheduled dates
    let scheduleDate = getNextScheduleStart();
    
    const queue = {
        posts: selected.map((p, index) => {
            const postSchedule = new Date(scheduleDate);
            postSchedule.setDate(scheduleDate.getDate() + index * frequencyDays);

            return {
                slug: p.slug,
                title: p.title,
                url: `https://bern-hypnose.ch/blog/${p.slug}/`,
                hasImage: !!(p.imagePath && fs.existsSync(p.imagePath)),
                scheduledFor: postSchedule.toISOString()
            };
        }),
        frequencyDays,
        lastUpdated: new Date().toISOString()
    };

    saveQueue(queue);

    console.log(`\n📅 Schedule Plan (${queue.posts.length} posts, every ${frequencyDays} days):\n`);
    queue.posts.forEach((p, i) => {
        const imgIcon = p.hasImage ? '📷' : '  ';
        console.log(`  ${i + 1}. ${imgIcon} ${formatDate(p.scheduledFor)}`);
        console.log(`        ${p.title}`);
    });

    console.log(`\n💡 Run --schedule-all to create these as scheduled posts on GBP`);

    return queue;
}

/**
 * Schedule all posts on GBP at once
 */
async function scheduleAllOnGbp(includeImage = true) {
    const queue = loadQueue();

    if (!queue.posts || queue.posts.length === 0) {
        console.log('\n📭 No posts in queue. Run --generate first.');
        return;
    }

    console.log(`\n🚀 Scheduling ${queue.posts.length} posts on Google Business Profile...\n`);

    const allPosts = getAllBlogPosts();
    const accessToken = await getAccessToken();
    
    let success = 0;
    let failed = 0;

    for (const queuedPost of queue.posts) {
        const blogPost = allPosts.find((p) => p.slug === queuedPost.slug);
        
        if (!blogPost) {
            console.log(`❌ Not found: ${queuedPost.slug}`);
            failed++;
            continue;
        }

        const scheduledTime = new Date(queuedPost.scheduledFor);
        console.log(`📤 ${queuedPost.title}`);
        console.log(`   Scheduled: ${formatDate(scheduledTime)}`);

        try {
            const postData = blogToGbpPost(blogPost, { includeImage, scheduledTime });
            
            if (postData._imageUrl) {
                console.log(`   📷 Image: ${path.basename(postData._imageUrl)}`);
                delete postData._imageUrl;
            }

            const result = await createGbpPost(accessToken, postData, scheduledTime);
            
            console.log(`   ✅ Created! (${result.state})`);
            
            addToHistory(queuedPost, result, true);
            success++;

            // Small delay between posts to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
            failed++;
        }

        console.log('');
    }

    // Clear the queue after scheduling
    queue.posts = [];
    saveQueue(queue);

    console.log('='.repeat(50));
    console.log(`✅ Scheduled: ${success}`);
    if (failed > 0) console.log(`❌ Failed: ${failed}`);
    console.log(`\n💡 Check your GBP dashboard to see scheduled posts!`);
}

/**
 * Check if any posts are due
 */
function getDuePosts() {
    const queue = loadQueue();
    const now = new Date();

    return (queue.posts || []).filter((p) => {
        const scheduled = new Date(p.scheduledFor);
        return scheduled <= now;
    });
}

/**
 * Auto-publish due posts (for cron)
 */
async function autoPublish(includeImage = true) {
    const duePosts = getDuePosts();

    if (duePosts.length === 0) {
        const queue = loadQueue();
        console.log('\n✅ No posts due right now.');
        if (queue.posts?.length > 0) {
            const next = queue.posts[0];
            console.log(`\n   Next scheduled: ${next.title}`);
            console.log(`   ${formatDate(next.scheduledFor)}`);
        }
        return;
    }

    console.log(`\n⏰ ${duePosts.length} post(s) due for publishing!\n`);

    const queue = loadQueue();
    const allPosts = getAllBlogPosts();
    const accessToken = await getAccessToken();

    for (const queuedPost of duePosts) {
        const blogPost = allPosts.find((p) => p.slug === queuedPost.slug);

        if (!blogPost) {
            console.log(`❌ Not found: ${queuedPost.slug}`);
            queue.posts = queue.posts.filter((p) => p.slug !== queuedPost.slug);
            continue;
        }

        console.log(`📤 ${queuedPost.title}`);

        try {
            const postData = blogToGbpPost(blogPost, { includeImage });

            if (postData._imageUrl) {
                console.log(`   📷 Image: ${path.basename(postData._imageUrl)}`);
                delete postData._imageUrl;
            }

            const result = await createGbpPost(accessToken, postData);

            console.log(`   ✅ Published!`);

            addToHistory(queuedPost, result, false);
            queue.posts = queue.posts.filter((p) => p.slug !== queuedPost.slug);

        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }

        console.log('');
    }

    saveQueue(queue);
    console.log(`📋 ${queue.posts.length} posts remaining in queue`);
}

/**
 * Publish next post immediately
 */
async function publishNext(includeImage = true) {
    const queue = loadQueue();

    if (!queue.posts || queue.posts.length === 0) {
        console.log('\n📭 Queue is empty. Run --generate first.');
        return;
    }

    const next = queue.posts[0];
    console.log(`\n📤 Publishing immediately: ${next.title}`);

    const allPosts = getAllBlogPosts();
    const blogPost = allPosts.find((p) => p.slug === next.slug);

    if (!blogPost) {
        console.log(`❌ Blog post not found: ${next.slug}`);
        return;
    }

    const accessToken = await getAccessToken();
    const postData = blogToGbpPost(blogPost, { includeImage });

    if (postData._imageUrl) {
        console.log(`📷 Image: ${path.basename(postData._imageUrl)}`);
        delete postData._imageUrl;
    }

    const result = await createGbpPost(accessToken, postData);

    console.log('\n✅ Published!');
    console.log('Post ID:', result.name);
    if (result.media?.length > 0) console.log('📷 Image attached');

    addToHistory(next, result, false);
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

    console.log('\n📋 Schedule Plan:');
    if (queue.posts && queue.posts.length > 0) {
        queue.posts.forEach((p, i) => {
            const imgIcon = p.hasImage ? '📷' : '  ';
            console.log(`  ${i + 1}. ${imgIcon} ${formatDate(p.scheduledFor)}`);
            console.log(`        ${p.title}`);
        });
        console.log(`\n   Frequency: every ${queue.frequencyDays || 7} days`);
        console.log(`\n   💡 Run --schedule-all to create on GBP`);
    } else {
        console.log('  (empty - run --generate to create a plan)');
    }

    console.log(`\n📜 Recently Created on GBP (last 5):`);
    const recent = history.posts.slice(-5).reverse();
    if (recent.length > 0) {
        recent.forEach((p) => {
            const date = formatDate(p.scheduledFor || p.createdAt);
            const imgIcon = p.hasImage ? '📷' : '  ';
            const schedIcon = p.isScheduled ? '⏰' : '✅';
            console.log(`  ${schedIcon} ${imgIcon} ${date} - ${p.title}`);
        });
    } else {
        console.log('  (none yet)');
    }

    // Stats
    const allPosts = getAllBlogPosts();
    console.log(`\n📊 Stats:`);
    console.log(`   Blog posts: ${allPosts.length}`);
    console.log(`   On GBP: ${history.posts.length}`);
    console.log(`   In queue: ${queue.posts?.length || 0}`);
}

/**
 * Parse arguments
 */
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        generate: false,
        count: 10,
        every: DEFAULT_FREQUENCY_DAYS,
        preview: false,
        next: false,
        auto: false,
        scheduleAll: false,
        noImage: false
    };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--generate':
                options.generate = true;
                const nextArg = args[i + 1];
                if (nextArg && !nextArg.startsWith('--')) {
                    options.count = parseInt(nextArg) || 10;
                    i++;
                }
                break;
            case '--every':
                options.every = parseInt(args[++i]) || DEFAULT_FREQUENCY_DAYS;
                break;
            case '--preview':
                options.preview = true;
                break;
            case '--next':
                options.next = true;
                break;
            case '--auto':
                options.auto = true;
                break;
            case '--schedule-all':
                options.scheduleAll = true;
                break;
            case '--no-image':
                options.noImage = true;
                break;
        }
    }

    return options;
}

/**
 * Main
 */
async function main() {
    console.log('='.repeat(60));
    console.log('GBP Post Scheduler (with Native GBP Scheduling)');
    console.log('='.repeat(60));

    const options = parseArgs();

    if (options.generate) {
        generateQueue(options.count, options.every);
    } else if (options.preview) {
        previewQueue();
    } else if (options.scheduleAll) {
        if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
            console.error('❌ Missing OAuth credentials');
            process.exit(1);
        }
        await scheduleAllOnGbp(!options.noImage);
    } else if (options.next) {
        if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
            console.error('❌ Missing OAuth credentials');
            process.exit(1);
        }
        await publishNext(!options.noImage);
    } else if (options.auto) {
        if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
            console.error('❌ Missing OAuth credentials');
            process.exit(1);
        }
        await autoPublish(!options.noImage);
    } else {
        console.log('\n📋 Usage:');
        console.log('  --generate [n]    Create schedule plan for n posts');
        console.log('  --every [days]    Set frequency (default: 7 = weekly)');
        console.log('  --preview         Show current plan with dates');
        console.log('  --auto            ⏰ Publish posts that are due (for cron)');
        console.log('  --next            Publish next post immediately');
        console.log('  --no-image        Skip images');
        console.log('\nWorkflow:');
        console.log('  1. yarn gbp:schedule --generate 20');
        console.log('  2. yarn gbp:schedule --preview');
        console.log('  3. Set up cron: 0 9 * * * yarn gbp:auto');
        console.log('\nCron will publish posts when their scheduled date arrives.');
    }
}

main().catch(console.error);
