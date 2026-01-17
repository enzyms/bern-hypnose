#!/usr/bin/env node
/**
 * Google Business Profile Post Publisher for Bern Hypnose
 *
 * This script publishes posts to Google Business Profile using the My Business API.
 * Uses the same OAuth credentials as fetch-google-reviews.js
 *
 * USAGE:
 * ======
 * # Publish a specific blog post as a GBP post (with image):
 * node scripts/publish-to-gbp.js --blog "komm-sei-stolz-auf-dich"
 *
 * # Publish without image:
 * node scripts/publish-to-gbp.js --blog "komm-sei-stolz-auf-dich" --no-image
 *
 * # Publish custom content with image:
 * node scripts/publish-to-gbp.js --text "Your post text" --url "https://..." --image "path/to/image.png"
 *
 * # Preview without publishing:
 * node scripts/publish-to-gbp.js --blog "komm-sei-stolz-auf-dich" --dry-run
 *
 * # List existing GBP posts:
 * node scripts/publish-to-gbp.js --list
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env file manually
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

// Configuration - reuses same credentials as reviews fetcher
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const ACCOUNT_ID = process.env.GOOGLE_ACCOUNT_ID || '107067054292838933166';
const LOCATION_ID = process.env.GOOGLE_LOCATION_ID || '15393771859516682512';

// Paths
const BLOG_PATH = path.join(__dirname, '../src/content/blog');
const ASSETS_PATH = path.join(__dirname, '../src/assets/uploads');

// Site URL for public image references
const SITE_URL = 'https://bern-hypnose.ch';

/**
 * Get a fresh access token using the refresh token
 */
async function getAccessToken() {
    if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
        throw new Error('Missing OAuth credentials. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN');
    }

    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            refresh_token: REFRESH_TOKEN,
            grant_type: 'refresh_token'
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get access token: ${error}`);
    }

    const data = await response.json();
    return data.access_token;
}

/**
 * Parse YAML-like frontmatter (handles nested objects like image.src)
 */
function parseFrontmatter(frontmatterText) {
    const result = {};
    const lines = frontmatterText.split('\n');
    let currentKey = null;
    let currentIndent = 0;

    for (const line of lines) {
        // Skip empty lines
        if (!line.trim()) continue;

        // Count leading spaces
        const indent = line.search(/\S/);
        const trimmed = line.trim();

        // Check for key: value
        const colonIdx = trimmed.indexOf(':');
        if (colonIdx > 0) {
            const key = trimmed.substring(0, colonIdx).trim();
            const value = trimmed.substring(colonIdx + 1).trim();

            if (indent === 0) {
                // Top-level key
                if (value === '') {
                    // Object start
                    result[key] = {};
                    currentKey = key;
                    currentIndent = indent;
                } else {
                    // Simple value
                    result[key] = value.replace(/^['"]|['"]$/g, ''); // Remove quotes
                    currentKey = null;
                }
            } else if (currentKey && indent > currentIndent) {
                // Nested property
                if (typeof result[currentKey] === 'object') {
                    result[currentKey][key] = value.replace(/^['"]|['"]$/g, '');
                }
            }
        } else if (trimmed.startsWith('- ')) {
            // Array item
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
 * Read and parse a blog post markdown file
 */
function readBlogPost(slug) {
    const filePath = path.join(BLOG_PATH, `${slug}.md`);
    if (!fs.existsSync(filePath)) {
        throw new Error(`Blog post not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');

    // Parse frontmatter
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) {
        throw new Error('Invalid blog post format (no frontmatter)');
    }

    const frontmatter = parseFrontmatter(frontmatterMatch[1]);
    const body = frontmatterMatch[2].trim();

    return { frontmatter, body };
}

/**
 * Get the local image path from a blog post's image field
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

    // Convert "src/assets/uploads/..." to absolute path
    if (imageSrc.startsWith('src/assets/uploads/')) {
        const filename = imageSrc.replace('src/assets/uploads/', '');
        return path.join(ASSETS_PATH, filename);
    }

    // Already absolute or relative path
    if (imageSrc.startsWith('/')) {
        return path.join(__dirname, '..', imageSrc);
    }

    return path.join(ASSETS_PATH, imageSrc);
}

/**
 * Upload media to GBP and get the media resource name
 * Uses the GBP media upload endpoint
 */
async function uploadMediaToGbp(accessToken, imagePath) {
    // Read image file
    const imageBuffer = fs.readFileSync(imagePath);
    const imageBase64 = imageBuffer.toString('base64');

    // Determine media format
    const ext = path.extname(imagePath).toLowerCase();
    let mediaFormat = 'PHOTO';
    if (ext === '.mp4' || ext === '.mov') {
        mediaFormat = 'VIDEO';
    }

    // Create media item via the API
    const url = `https://mybusiness.googleapis.com/v4/accounts/${ACCOUNT_ID}/locations/${LOCATION_ID}/media`;

    console.log('\n📷 Uploading image to GBP...');
    console.log(`   File: ${path.basename(imagePath)} (${Math.round(imageBuffer.length / 1024)}KB)`);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            mediaFormat: mediaFormat,
            locationAssociation: {
                category: 'ADDITIONAL'
            },
            dataRef: {
                resourceName: `accounts/${ACCOUNT_ID}/locations/${LOCATION_ID}/media`
            },
            sourceUrl: null // We'll try direct upload
        })
    });

    if (!response.ok) {
        console.log('   ⚠️ Media upload endpoint failed, trying sourceUrl method...');
        return null;
    }

    const result = await response.json();
    console.log('   ✅ Image uploaded');
    return result.name;
}

/**
 * Convert blog post to GBP post format
 * GBP posts have a 1500 character limit for the summary
 */
function blogToGbpPost(blogPost, slug, options = {}) {
    const { frontmatter, body } = blogPost;

    // Clean markdown: remove headers, images, links formatting
    let cleanText = body
        .replace(/^#{1,6}\s+/gm, '') // Remove headers
        .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Convert links to text
        .replace(/\*\*([^*]+)\*\*/g, '$1') // Remove bold
        .replace(/\*([^*]+)\*/g, '$1') // Remove italic
        .replace(/`([^`]+)`/g, '$1') // Remove code
        .replace(/\n{3,}/g, '\n\n') // Normalize line breaks
        .trim();

    // Build the post text
    let postText = `${frontmatter.title}\n\n`;

    // Add a teaser from the content
    const teaser = cleanText.substring(0, 1200);
    postText += teaser;

    // Add call to action
    postText += '\n\n💚 Mehr dazu auf meinem Blog!';

    // Ensure we're under the 1500 char limit
    if (postText.length > 1500) {
        postText = postText.substring(0, 1450) + '...\n\n💚 Mehr auf meinem Blog!';
    }

    const url = `https://bern-hypnose.ch/blog/${slug}/`;

    const postData = {
        summary: postText,
        callToAction: {
            actionType: 'LEARN_MORE',
            url: url
        },
        languageCode: 'de',
        topicType: 'STANDARD'
    };

    // Add image if available and not disabled
    if (!options.noImage) {
        const imagePath = getImagePath(frontmatter);
        if (imagePath && fs.existsSync(imagePath)) {
            postData._imagePath = imagePath; // Store for later processing
        }
    }

    return postData;
}

/**
 * Create a GBP Local Post (with optional image)
 */
async function createLocalPost(accessToken, postData) {
    const url = `https://mybusiness.googleapis.com/v4/accounts/${ACCOUNT_ID}/locations/${LOCATION_ID}/localPosts`;

    console.log('\n📤 Creating GBP post...');

    // Handle image if present
    if (postData._imagePath) {
        const imagePath = postData._imagePath;
        delete postData._imagePath; // Remove internal field

        // For GBP posts, we use the media array with sourceUrl
        // The image needs to be publicly accessible, so we'll reference the deployed site
        // OR upload directly

        // Option 1: Try to use a publicly accessible URL from the deployed site
        // The image filename in src/assets/uploads/xyz.png might be served as /_astro/xyz.hash.png
        // This is complex, so let's try Option 2 first

        // Option 2: Upload the image as base64 (using a simpler approach)
        try {
            // Read the image and convert to base64 data URL for sourceUrl
            const imageBuffer = fs.readFileSync(imagePath);
            const ext = path.extname(imagePath).toLowerCase().replace('.', '');
            const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;

            // GBP requires a publicly accessible URL, so we need to use a hosting service
            // or the image from the production site

            // Since we can't easily get the built image URL, we'll try using a data URL
            // If that doesn't work, we'll fall back to uploading to the location media

            // Try adding media array with the local file info
            // GBP API accepts sourceUrl which must be publicly accessible

            // For now, let's try referencing images from the public folder if they exist there
            const publicImagePath = path.join(__dirname, '../public', path.basename(imagePath));
            const distImagePath = path.join(__dirname, '../dist', path.basename(imagePath));

            if (fs.existsSync(publicImagePath)) {
                // Image is in public folder, can be served directly
                const imageUrl = `${SITE_URL}/${path.basename(imagePath)}`;
                console.log(`📷 Using public image: ${imageUrl}`);
                postData.media = [
                    {
                        mediaFormat: 'PHOTO',
                        sourceUrl: imageUrl
                    }
                ];
            } else if (fs.existsSync(distImagePath)) {
                // Image is in dist folder
                const imageUrl = `${SITE_URL}/${path.basename(imagePath)}`;
                console.log(`📷 Using dist image: ${imageUrl}`);
                postData.media = [
                    {
                        mediaFormat: 'PHOTO',
                        sourceUrl: imageUrl
                    }
                ];
            } else {
                // Upload to a temp image host (Imgur, etc.) or copy to public folder
                console.log(`⚠️ Image not publicly accessible. Copying to public folder...`);

                // Copy image to public folder for future access
                const publicDest = path.join(__dirname, '../public/gbp-images', path.basename(imagePath));
                const publicDir = path.dirname(publicDest);

                if (!fs.existsSync(publicDir)) {
                    fs.mkdirSync(publicDir, { recursive: true });
                }

                fs.copyFileSync(imagePath, publicDest);
                console.log(`   Copied to: public/gbp-images/${path.basename(imagePath)}`);

                // Use the URL (will work after next deploy)
                const imageUrl = `${SITE_URL}/gbp-images/${path.basename(imagePath)}`;
                console.log(`   Will be available at: ${imageUrl}`);
                console.log(`   ⚠️ Note: Deploy the site first for the image to work!`);

                postData.media = [
                    {
                        mediaFormat: 'PHOTO',
                        sourceUrl: imageUrl
                    }
                ];
            }
        } catch (err) {
            console.log(`⚠️ Could not process image: ${err.message}`);
        }
    }

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(postData)
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to create post: ${error}`);
    }

    return response.json();
}

/**
 * List existing GBP Local Posts
 */
async function listLocalPosts(accessToken) {
    const url = `https://mybusiness.googleapis.com/v4/accounts/${ACCOUNT_ID}/locations/${LOCATION_ID}/localPosts`;

    console.log('\n📋 Fetching existing GBP posts...');

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to list posts: ${error}`);
    }

    return response.json();
}

/**
 * Delete a GBP Local Post
 */
async function deleteLocalPost(accessToken, postName) {
    const url = `https://mybusiness.googleapis.com/v4/${postName}`;

    console.log(`\n🗑️ Deleting post: ${postName}`);

    const response = await fetch(url, {
        method: 'DELETE',
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to delete post: ${error}`);
    }

    return true;
}

/**
 * Parse command line arguments
 */
function parseArgs() {
    const args = process.argv.slice(2);
    const options = {
        blog: null,
        text: null,
        url: null,
        image: null,
        noImage: false,
        list: false,
        delete: null,
        dryRun: false
    };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--blog':
                options.blog = args[++i];
                break;
            case '--text':
                options.text = args[++i];
                break;
            case '--url':
                options.url = args[++i];
                break;
            case '--image':
                options.image = args[++i];
                break;
            case '--no-image':
                options.noImage = true;
                break;
            case '--list':
                options.list = true;
                break;
            case '--delete':
                options.delete = args[++i];
                break;
            case '--dry-run':
                options.dryRun = true;
                break;
        }
    }

    return options;
}

/**
 * Main function
 */
async function main() {
    console.log('='.repeat(60));
    console.log('Google Business Profile Post Publisher');
    console.log('='.repeat(60));

    const options = parseArgs();

    // Check credentials
    if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
        console.error('\n❌ Missing OAuth credentials!');
        console.log('Uses the same credentials as fetch-google-reviews.js');
        console.log('Set: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN');
        process.exit(1);
    }

    try {
        // Get access token
        console.log('\n📝 Getting access token...');
        const accessToken = await getAccessToken();
        console.log('✅ Got access token');

        // Handle list command
        if (options.list) {
            const posts = await listLocalPosts(accessToken);
            console.log('\n📊 Existing GBP Posts:');
            if (posts.localPosts && posts.localPosts.length > 0) {
                posts.localPosts.forEach((post, i) => {
                    console.log(`\n${i + 1}. ${post.name}`);
                    console.log(`   Created: ${post.createTime}`);
                    console.log(`   Type: ${post.topicType}`);
                    if (post.media && post.media.length > 0) {
                        console.log(`   📷 Has image`);
                    }
                    if (post.summary) {
                        console.log(`   Preview: ${post.summary.substring(0, 100)}...`);
                    }
                    if (post.callToAction) {
                        console.log(`   URL: ${post.callToAction.url}`);
                    }
                });
            } else {
                console.log('No posts found.');
            }
            return;
        }

        // Handle delete command
        if (options.delete) {
            await deleteLocalPost(accessToken, options.delete);
            console.log('✅ Post deleted successfully');
            return;
        }

        // Build post data
        let postData;

        if (options.blog) {
            console.log(`\n📖 Reading blog post: ${options.blog}`);
            const blogPost = readBlogPost(options.blog);
            postData = blogToGbpPost(blogPost, options.blog, { noImage: options.noImage });

            // Show image info
            if (postData._imagePath) {
                console.log(`📷 Image found: ${path.basename(postData._imagePath)}`);
            } else if (!options.noImage) {
                console.log(`ℹ️ No image in blog post (use --image to add one)`);
            }
        } else if (options.text) {
            postData = {
                summary: options.text,
                languageCode: 'de',
                topicType: 'STANDARD'
            };
            if (options.url) {
                postData.callToAction = {
                    actionType: 'LEARN_MORE',
                    url: options.url
                };
            }
            if (options.image) {
                const imagePath = path.resolve(options.image);
                if (fs.existsSync(imagePath)) {
                    postData._imagePath = imagePath;
                    console.log(`📷 Using image: ${path.basename(imagePath)}`);
                } else {
                    console.log(`⚠️ Image not found: ${options.image}`);
                }
            }
        } else {
            console.log('\n📋 Usage:');
            console.log('  --blog <slug>     Publish a blog post (with its image)');
            console.log('  --text "..."      Publish custom text');
            console.log('  --url "..."       Add call-to-action URL');
            console.log('  --image <path>    Add image to post');
            console.log('  --no-image        Skip blog post image');
            console.log('  --list            List existing GBP posts');
            console.log('  --delete <name>   Delete a GBP post');
            console.log('  --dry-run         Preview without publishing');
            console.log('\nExamples:');
            console.log('  node scripts/publish-to-gbp.js --blog "die-wirkung-von-hypnose"');
            console.log('  node scripts/publish-to-gbp.js --blog "komm-sei-stolz-auf-dich" --no-image');
            console.log('  node scripts/publish-to-gbp.js --text "Hello!" --image src/assets/uploads/landscape.png');
            return;
        }

        // Preview the post
        console.log('\n📝 Post Preview:');
        console.log('-'.repeat(40));
        console.log(postData.summary);
        console.log('-'.repeat(40));
        console.log(`Characters: ${postData.summary.length}/1500`);
        if (postData.callToAction) {
            console.log(`URL: ${postData.callToAction.url}`);
        }
        if (postData._imagePath) {
            console.log(`Image: ${path.basename(postData._imagePath)}`);
        }

        // Dry run - don't actually publish
        if (options.dryRun) {
            console.log('\n🔍 Dry run - not publishing');
            const previewData = { ...postData };
            if (previewData._imagePath) {
                previewData._imagePath = `[will copy to public/gbp-images/${path.basename(previewData._imagePath)}]`;
            }
            console.log('\nFull post data:');
            console.log(JSON.stringify(previewData, null, 2));
            return;
        }

        // Publish the post
        const result = await createLocalPost(accessToken, postData);
        console.log('\n✅ Post published successfully!');
        console.log('Post ID:', result.name);
        console.log('State:', result.state);
        if (result.media && result.media.length > 0) {
            console.log('📷 Image attached');
        }
        if (result.searchUrl) {
            console.log('View at:', result.searchUrl);
        }
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

main();
