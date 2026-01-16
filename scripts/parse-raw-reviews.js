#!/usr/bin/env node
/**
 * Parse raw-reviews.md and generate complete google-reviews.json
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_REVIEWS_PATH = path.join(__dirname, '../raw-reviews.md');
const OUTPUT_PATH = path.join(__dirname, '../src/data/google-reviews.json');

const TODAY = new Date('2026-01-13');

/**
 * Parse French relative time to approximate date
 */
function parseRelativeDate(relativeTime) {
    if (!relativeTime) return new Date(TODAY);

    const lower = relativeTime.toLowerCase().trim();
    const date = new Date(TODAY);

    // Parse different patterns
    if (/il y a (\d+) jour/.test(lower)) {
        const days = parseInt(lower.match(/il y a (\d+) jour/)[1], 10);
        date.setDate(date.getDate() - days);
    } else if (/il y a une semaine/.test(lower)) {
        date.setDate(date.getDate() - 7);
    } else if (/il y a (\d+) semaine/.test(lower)) {
        const weeks = parseInt(lower.match(/il y a (\d+) semaine/)[1], 10);
        date.setDate(date.getDate() - weeks * 7);
    } else if (/il y a un mois/.test(lower)) {
        date.setMonth(date.getMonth() - 1);
    } else if (/il y a (\d+) mois/.test(lower)) {
        const months = parseInt(lower.match(/il y a (\d+) mois/)[1], 10);
        date.setMonth(date.getMonth() - months);
    } else if (/il y a un an/.test(lower)) {
        date.setFullYear(date.getFullYear() - 1);
    } else if (/il y a (\d+) an/.test(lower)) {
        const years = parseInt(lower.match(/il y a (\d+) an/)[1], 10);
        date.setFullYear(date.getFullYear() - years);
    } else {
        // Default: assume recent
        date.setDate(date.getDate() - 5);
    }

    return date;
}

/**
 * Format date as "10. Dezember 2025"
 */
function formatDateGerman(date) {
    const months = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
    return `${date.getDate()}. ${months[date.getMonth()]} ${date.getFullYear()}`;
}

/**
 * Parse reviews using regex blocks
 */
function parseRawReviews(content) {
    const reviews = [];

    // Split by common separators - each review block starts with a name
    // Pattern: Name followed by "X avis" or "Local Guide"
    const lines = content.split('\n');

    let i = 0;
    while (i < lines.length) {
        const line = lines[i]?.trim();

        // Skip empty lines
        if (!line) {
            i++;
            continue;
        }

        // Look for author pattern: a name line followed by "X avis" or "Local Guide"
        const nextLine = lines[i + 1]?.trim() || '';
        const isAuthorLine =
            line.length > 1 &&
            line.length < 40 &&
            !line.includes('il y a') &&
            !line.includes("J'aime") &&
            !line.includes('Partager') &&
            !line.includes('Modifier') &&
            !line.includes('Supprimer') &&
            !line.includes('Voir la') &&
            !line.includes('Réponse') &&
            !line.includes('Nouveau') &&
            !line.startsWith('Liebe') &&
            !line.startsWith('Danke') &&
            !line.startsWith('Vielen') &&
            !line.startsWith('Von Herzen') &&
            !line.startsWith('Oh ') &&
            !line.startsWith('Herzlichen') &&
            !line.startsWith('Merci') &&
            (nextLine.includes('avis') || nextLine.includes('Local Guide'));

        if (isAuthorLine) {
            const author = line;
            i += 2; // Skip author and "X avis" line

            // Skip empty lines
            while (i < lines.length && !lines[i]?.trim()) i++;

            // Look for date line
            let dateLine = '';
            while (i < lines.length) {
                const currentLine = lines[i]?.trim();
                if (currentLine?.includes('il y a') || currentLine?.includes('Modifié il y a')) {
                    dateLine = currentLine.replace('Modifié ', '');
                    i++;
                    break;
                }
                if (currentLine && !currentLine.match(/^\d+$/)) {
                    // Not a date line, might be something else
                }
                i++;
                if (i - 2 > lines.indexOf(author) + 10) break; // Safety
            }

            // Skip "Nouveau" if present
            while (i < lines.length && lines[i]?.trim() === 'Nouveau') i++;

            // Collect quote lines until we hit UI elements
            const quoteLines = [];
            while (i < lines.length) {
                const currentLine = lines[i]?.trim();

                // Stop conditions
                if (
                    !currentLine ||
                    currentLine === "J'aime" ||
                    currentLine === 'Partager' ||
                    currentLine === 'Modifier' ||
                    currentLine === 'Supprimer' ||
                    currentLine.startsWith('Voir la traduction') ||
                    currentLine.startsWith('Réponse du propriétaire') ||
                    currentLine.match(/^\d+$/) // Just a number (like count)
                ) {
                    break;
                }

                quoteLines.push(currentLine);
                i++;
            }

            const quote = quoteLines
                .join(' ')
                .replace(/\s+/g, ' ')
                .replace(/…\s*Plus\s*$/, '...')
                .trim();

            if (quote.length > 10) {
                const date = parseRelativeDate(dateLine);
                reviews.push({
                    author,
                    quote,
                    relativeTime: dateLine,
                    date,
                    dateFormatted: formatDateGerman(date),
                    starRating: 5
                });
            }
        }

        i++;
    }

    return reviews;
}

async function main() {
    console.log('='.repeat(60));
    console.log('Parsing raw-reviews.md');
    console.log('='.repeat(60));

    const rawContent = fs.readFileSync(RAW_REVIEWS_PATH, 'utf-8');
    console.log(`\n📄 Read ${rawContent.length} characters from raw-reviews.md`);

    const reviews = parseRawReviews(rawContent);
    console.log(`\n📊 Parsed ${reviews.length} reviews`);

    // Sort by date (newest first) and assign tids
    reviews.sort((a, b) => b.date - a.date);
    reviews.forEach((review, index) => {
        review.tid = index;
        review.createTime = review.date.toISOString();
        delete review.date; // Remove Date object, keep ISO string
    });

    const output = {
        fetchedAt: new Date().toISOString(),
        source: 'Parsed from Google Reviews export',
        placeName: 'Bern Hypnose - Janine Aerni',
        placeUrl: 'https://maps.google.com/?cid=13921990948284093068',
        overallRating: 5,
        totalReviewCount: reviews.length,
        reviewsInFile: reviews.length,
        reviews
    };

    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8');
    console.log(`\n✅ Saved ${reviews.length} reviews to: ${OUTPUT_PATH}`);

    console.log('\n📝 First 5 reviews (newest first):');
    reviews.slice(0, 5).forEach((review, i) => {
        console.log(`\n${i + 1}. ${review.author} - ${review.dateFormatted}`);
        console.log(`   "${review.quote.substring(0, 80)}${review.quote.length > 80 ? '...' : ''}"`);
    });
}

main().catch(console.error);
