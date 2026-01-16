#!/usr/bin/env node
/**
 * Google Reviews Fetcher using Places API (simpler alternative)
 *
 * This uses the Google Places API which only requires an API key (no OAuth).
 * Note: Places API only returns the 5 most recent reviews.
 * For all reviews, use the My Business API (fetch-google-reviews.js).
 *
 * SETUP:
 * ======
 * 1. Go to Google Cloud Console: https://console.cloud.google.com/
 * 2. Create/select a project
 * 3. Enable "Places API (New)" or "Places API"
 * 4. Create an API key in Credentials
 * 5. (Optional) Restrict the API key to Places API only
 *
 * USAGE:
 * ======
 * # Find your Place ID first:
 * GOOGLE_API_KEY=xxx node scripts/fetch-reviews-places-api.js --find-place "Aerni Hypnose Bern"
 *
 * # Then fetch reviews:
 * GOOGLE_API_KEY=xxx GOOGLE_PLACE_ID=xxx node scripts/fetch-reviews-places-api.js
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

const API_KEY = process.env.GOOGLE_API_KEY;
// Known Place ID from the Google Business URL
const PLACE_ID = process.env.GOOGLE_PLACE_ID || 'ChIJbbqKCRk5jkcRjFKtbgHZNME';
const OUTPUT_PATH = path.join(__dirname, '../src/data/google-reviews.json');

/**
 * Find Place ID by text search
 */
async function findPlace(query) {
    const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id,name,formatted_address&key=${API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
        throw new Error(`Find place failed: ${data.status} - ${data.error_message || ''}`);
    }

    return data.candidates;
}

/**
 * Get place details including reviews
 */
async function getPlaceDetails(placeId) {
    const fields = 'name,rating,user_ratings_total,reviews,url';
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&reviews_sort=newest&key=${API_KEY}`;

    console.log('Fetching place details...');

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
        throw new Error(`Get place details failed: ${data.status} - ${data.error_message || ''}`);
    }

    return data.result;
}

/**
 * Transform Places API review to our format
 */
function transformReview(review, index) {
    return {
        tid: index,
        quote: review.text || '',
        author: review.author_name || 'Anonymous',
        authorPhoto: review.profile_photo_url || null,
        starRating: review.rating || 5,
        url: review.author_url || null,
        relativeTime: review.relative_time_description,
        createTime: new Date(review.time * 1000).toISOString(),
        language: review.language
    };
}

/**
 * Save reviews to JSON file
 */
function saveReviews(placeData, reviews) {
    const output = {
        fetchedAt: new Date().toISOString(),
        source: 'Google Places API',
        placeId: PLACE_ID,
        placeName: placeData.name,
        placeUrl: placeData.url,
        overallRating: placeData.rating,
        totalReviewCount: placeData.user_ratings_total,
        reviewsInFile: reviews.length,
        note: 'Places API only returns 5 most recent reviews. For all reviews, use My Business API.',
        reviews: reviews
    };

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`\n✅ Saved ${reviews.length} reviews to: ${OUTPUT_PATH}`);
}

async function main() {
    console.log('='.repeat(60));
    console.log('Google Reviews Fetcher (Places API)');
    console.log('='.repeat(60));

    const args = process.argv.slice(2);
    const findPlaceMode = args.includes('--find-place');

    if (!API_KEY) {
        console.error('\n❌ Missing GOOGLE_API_KEY!');
        console.log('\nSet up:');
        console.log('1. Go to https://console.cloud.google.com/');
        console.log('2. Enable "Places API"');
        console.log('3. Create an API key');
        console.log('4. Run: GOOGLE_API_KEY=xxx node scripts/fetch-reviews-places-api.js');
        process.exit(1);
    }

    try {
        if (findPlaceMode) {
            const query = args[args.indexOf('--find-place') + 1];
            if (!query) {
                console.error('Please provide a search query: --find-place "Business Name"');
                process.exit(1);
            }

            console.log(`\n🔍 Searching for: "${query}"`);
            const places = await findPlace(query);

            console.log('\n📍 Found places:');
            places.forEach((place, i) => {
                console.log(`\n${i + 1}. ${place.name}`);
                console.log(`   Address: ${place.formatted_address}`);
                console.log(`   Place ID: ${place.place_id}`);
            });

            console.log('\n💡 Use the Place ID with:');
            console.log(`   GOOGLE_PLACE_ID=${places[0]?.place_id} node scripts/fetch-reviews-places-api.js`);
            return;
        }

        // Fetch place details and reviews
        console.log(`\n📍 Using Place ID: ${PLACE_ID}`);
        const placeData = await getPlaceDetails(PLACE_ID);

        console.log(`\n📊 ${placeData.name}`);
        console.log(`   Rating: ${placeData.rating}/5`);
        console.log(`   Total reviews: ${placeData.user_ratings_total}`);

        if (!placeData.reviews || placeData.reviews.length === 0) {
            console.log('\n⚠️  No reviews returned');
            return;
        }

        console.log(`   Reviews fetched: ${placeData.reviews.length} (API limit: 5 most recent)`);

        // Transform reviews
        const transformedReviews = placeData.reviews.map((review, index) => transformReview(review, index));

        // Save
        saveReviews(placeData, transformedReviews);

        // Show preview
        console.log('\n📝 Reviews preview:');
        transformedReviews.slice(0, 3).forEach((review, i) => {
            console.log(`\n${i + 1}. ${review.author} (${review.starRating}★)`);
            console.log(`   "${review.quote.substring(0, 100)}${review.quote.length > 100 ? '...' : ''}"`);
        });
    } catch (error) {
        console.error('\n❌ Error:', error.message);
        process.exit(1);
    }
}

main();
