#!/usr/bin/env node
/**
 * Google Reviews Fetcher for Bern Hypnose
 *
 * This script fetches reviews from Google Business Profile API
 * and saves them to src/data/google-reviews.json
 *
 * SETUP:
 * ======
 * 1. Go to Google Cloud Console: https://console.cloud.google.com/
 * 2. Create/select a project
 * 3. Enable APIs:
 *    - "My Business Business Information API"
 *    - "My Business Account Management API"
 * 4. Create OAuth 2.0 credentials (Desktop app type)
 * 5. Go to OAuth Playground: https://developers.google.com/oauthplayground
 *    - Click gear icon → Check "Use your own OAuth credentials"
 *    - Enter your Client ID and Client Secret
 *    - In Step 1, enter scope: https://www.googleapis.com/auth/plus.business.manage
 *       (Alternative scope: https://www.googleapis.com/auth/business.manage)
 *    - Click "Authorize APIs" and sign in
 *    - In Step 2, click "Exchange authorization code for tokens"
 *    - Copy the Refresh Token
 *
 * USAGE:
 * ======
 * # First, list locations to find your location ID:
 * GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=xxx GOOGLE_REFRESH_TOKEN=xxx node scripts/fetch-google-reviews.js --list-locations
 *
 * # Then fetch reviews:
 * GOOGLE_CLIENT_ID=xxx GOOGLE_CLIENT_SECRET=xxx GOOGLE_REFRESH_TOKEN=xxx GOOGLE_LOCATION_NAME=accounts/xxx/locations/xxx node scripts/fetch-google-reviews.js
 *
 * Or create a .env file (gitignored) with these values.
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

// Configuration
let ACCOUNT_ID = process.env.GOOGLE_ACCOUNT_ID || '107067054292838933166'; // Will be auto-detected from accounts list
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const LOCATION_NAME = process.env.GOOGLE_LOCATION_NAME;

// Output file path
const OUTPUT_PATH = path.join(__dirname, '../src/data/google-reviews.json');

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
 * List all accounts first using Account Management API
 */
async function listAccounts(accessToken) {
    const url = `https://mybusinessaccountmanagement.googleapis.com/v1/accounts`;
    console.log('Listing accounts from:', url);

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        const error = await response.text();
        console.log('Account Management API error:', error);
        return null;
    }

    return response.json();
}

/**
 * List all locations for the account (tries multiple APIs)
 */
async function listLocations(accessToken) {
    // First, list accounts to find the correct account name
    console.log('\n📋 Step 1: Listing accounts...');
    const accounts = await listAccounts(accessToken);
    let actualAccountId = ACCOUNT_ID;

    if (accounts && accounts.accounts && accounts.accounts.length > 0) {
        console.log('Accounts found:', JSON.stringify(accounts, null, 2));
        // Extract the account ID from the first account name (format: "accounts/123456")
        const firstAccountName = accounts.accounts[0].name;
        actualAccountId = firstAccountName.split('/')[1];
        console.log(`✅ Using account ID: ${actualAccountId}`);
        // Update global ACCOUNT_ID
        ACCOUNT_ID = actualAccountId;
    }

    // Try Business Information API v1 with read_mask (required parameter)
    const readMask = 'name,title,storefrontAddress';
    const biUrl = `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${actualAccountId}/locations?readMask=${readMask}`;
    console.log('\n📍 Step 2: Trying Business Information API with read_mask:', biUrl);

    let response = await fetch(biUrl, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    if (response.ok) {
        console.log('✅ Business Information API succeeded');
        return response.json();
    }
    console.log('Business Information API error:', await response.text());

    // Try v4 API
    const v4Url = `https://mybusiness.googleapis.com/v4/accounts/${ACCOUNT_ID}/locations`;
    console.log('\n📍 Step 3: Trying v4 API:', v4Url);

    response = await fetch(v4Url, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    if (response.ok) {
        console.log('✅ v4 API succeeded');
        return response.json();
    }
    console.log('v4 API error:', await response.text());

    // Try v1 Business Information API
    const v1Url = `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${ACCOUNT_ID}/locations`;
    console.log('\n📍 Step 4: Trying v1 Business Information API:', v1Url);

    response = await fetch(v1Url, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`All APIs failed. Last error: ${error}`);
    }

    return response.json();
}

/**
 * Fetch reviews using the legacy v4 API (batchGetReviews)
 */
async function fetchReviewsBatchV4(accessToken) {
    const url = `https://mybusiness.googleapis.com/v4/accounts/${ACCOUNT_ID}/locations:batchGetReviews`;

    const requestBody = {
        locationNames: [LOCATION_NAME],
        pageSize: 50,
        orderBy: 'updateTime desc',
        ignoreRatingOnlyReviews: false
    };

    console.log('Fetching reviews from:', url);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch reviews: ${error}`);
    }

    return response.json();
}

/**
 * Fetch reviews using the correct v4 API endpoint
 */
async function fetchReviewsV4(accessToken, pageToken = null) {
    // Extract location ID from LOCATION_NAME (format: "locations/123456" or "accounts/123/locations/456")
    let locationId = LOCATION_NAME;
    if (LOCATION_NAME.startsWith('locations/')) {
        locationId = LOCATION_NAME.split('/')[1];
    } else if (LOCATION_NAME.includes('/locations/')) {
        locationId = LOCATION_NAME.split('/locations/')[1];
    }

    // Build URL using the correct v4 endpoint
    let url = `https://mybusiness.googleapis.com/v4/accounts/${ACCOUNT_ID}/locations/${locationId}/reviews?pageSize=50`;
    if (pageToken) {
        url += `&pageToken=${pageToken}`;
    }

    console.log('Fetching reviews from:', url);

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch reviews: ${error}`);
    }

    return response.json();
}

/**
 * Fetch all reviews with pagination
 */
async function fetchAllReviews(accessToken) {
    let allReviews = [];
    let pageToken = null;
    let page = 1;

    do {
        console.log(`\nFetching page ${page}...`);
        const data = await fetchReviewsV4(accessToken, pageToken);

        // Log raw API response for the first review (for debugging)
        if (page === 1 && data.reviews && data.reviews.length > 0) {
            console.log('\n📋 Raw API Response (first review sample):');
            console.log(JSON.stringify(data.reviews[0], null, 2));
            console.log('\n📋 Full API Response structure:');
            console.log('Keys in response:', Object.keys(data));
            console.log('Total reviews in response:', data.reviews?.length || 0);
            if (data.nextPageToken) {
                console.log('Has more pages:', !!data.nextPageToken);
            }
        }

        if (data.reviews) {
            allReviews = allReviews.concat(data.reviews);
            console.log(`  Got ${data.reviews.length} reviews (total: ${allReviews.length})`);
        }

        pageToken = data.nextPageToken;
        page++;
    } while (pageToken);

    return allReviews;
}

/**
 * Transform Google review to our format
 */
function transformReview(review, index) {
    // Map Google star ratings to numbers
    const starRatingMap = {
        ONE: 1,
        TWO: 2,
        THREE: 3,
        FOUR: 4,
        FIVE: 5
    };

    // Format date in German (e.g., "8. Januar 2026")
    const formatDate = (isoString) => {
        if (!isoString) return null;
        const date = new Date(isoString);
        return date.toLocaleDateString('de-CH', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    // Clean review text by removing Google translation notices
    const cleanReviewText = (text) => {
        if (!text) return '';
        // Remove "(Translated by Google)" and the translated text after it
        // Keep only the original text before the translation
        return text
            .split(/\n\n\(Translated by Google\)/)[0]
            .split(/\(Translated by Google\)/)[0]
            .trim();
    };

    return {
        tid: index,
        googleReviewId: review.reviewId,
        quote: cleanReviewText(review.comment),
        author: review.reviewer?.displayName || 'Anonymous',
        authorPhoto: review.reviewer?.profilePhotoUrl || null,
        starRating: starRatingMap[review.starRating] || 5,
        dateFormatted: formatDate(review.createTime),
        // Note: Google My Business API doesn't provide individual review URLs
        // The Testimonials component will link to the overall reviews page instead
        createTime: review.createTime,
        updateTime: review.updateTime,
        reply: review.reviewReply
            ? {
                  comment: review.reviewReply.comment,
                  updateTime: review.reviewReply.updateTime
              }
            : null
    };
}

/**
 * Save reviews to JSON file
 */
function saveReviews(reviews) {
    // Calculate overall rating
    const totalRating = reviews.reduce((sum, review) => sum + review.starRating, 0);
    const overallRating = reviews.length > 0 ? Math.round((totalRating / reviews.length) * 10) / 10 : 0;

    // Extract location ID for Google Maps URL
    const locationId = LOCATION_NAME.includes('/') ? LOCATION_NAME.split('/').pop() : LOCATION_NAME;

    const output = {
        fetchedAt: new Date().toISOString(),
        source: 'Google My Business API',
        placeName: 'Bern Hypnose - Janine Aerni',
        placeUrl: `https://maps.google.com/?cid=${locationId}`,
        overallRating: overallRating,
        totalReviewCount: reviews.length,
        reviewsInFile: reviews.length,
        accountId: ACCOUNT_ID,
        locationName: LOCATION_NAME,
        reviews: reviews
    };

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`\n✅ Saved ${reviews.length} reviews to: ${OUTPUT_PATH}`);
}

/**
 * Main function
 */
async function main() {
    console.log('='.repeat(60));
    console.log('Google Reviews Fetcher for Bern Hypnose');
    console.log('='.repeat(60));

    const args = process.argv.slice(2);
    const listLocationsMode = args.includes('--list-locations');

    // Check credentials
    if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
        console.error('\n❌ Missing OAuth credentials!\n');
        console.log('Please set the following environment variables:');
        console.log('  GOOGLE_CLIENT_ID');
        console.log('  GOOGLE_CLIENT_SECRET');
        console.log('  GOOGLE_REFRESH_TOKEN');
        console.log('\nSee the script header for setup instructions.');
        process.exit(1);
    }

    try {
        // Get access token
        console.log('\n📝 Getting access token...');
        const accessToken = await getAccessToken();
        console.log('✅ Got access token');

        if (listLocationsMode) {
            // List locations
            console.log('\n📍 Listing locations...');
            const locations = await listLocations(accessToken);
            console.log('\n📊 Locations found:');
            console.log(JSON.stringify(locations, null, 2));

            if (locations.locations) {
                console.log('\n💡 Use one of these location names in GOOGLE_LOCATION_NAME:');
                locations.locations.forEach((loc) => {
                    console.log(`  ${loc.name}`);
                });
            }
            return;
        }

        // Check location name
        if (!LOCATION_NAME) {
            console.error('\n❌ Missing GOOGLE_LOCATION_NAME!');
            console.log('\nFirst run with --list-locations to find your location name:');
            console.log('  node scripts/fetch-google-reviews.js --list-locations');
            process.exit(1);
        }

        // Fetch reviews
        console.log('\n📥 Fetching reviews...');
        const reviews = await fetchAllReviews(accessToken);

        if (reviews.length === 0) {
            console.log('\n⚠️  No reviews found');
            return;
        }

        // Transform and save
        console.log('\n🔄 Transforming reviews...');
        const transformedReviews = reviews.map((review, index) => transformReview(review, index));

        // Sort by date (newest first)
        transformedReviews.sort((a, b) => new Date(b.updateTime) - new Date(a.updateTime));

        saveReviews(transformedReviews);

        // Show summary
        console.log('\n📊 Summary:');
        console.log(`  Total reviews: ${transformedReviews.length}`);
        const fiveStars = transformedReviews.filter((r) => r.starRating === 5).length;
        console.log(`  5-star reviews: ${fiveStars}`);
        const withComments = transformedReviews.filter((r) => r.quote).length;
        console.log(`  Reviews with comments: ${withComments}`);
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

main();
