# Google Reviews Fetching - Procedure & Known Issues

## Problem: API Doesn't Return All Reviews

The Google My Business API does NOT always return all reviews visible on the public Google Business Profile page. This is a known Google API inconsistency.

**Example:** GBP shows 55 reviews, but API returns only 49.

### Causes:
- Google filters some reviews (spam, policy violations)
- API pagination inconsistencies
- Reviews under moderation
- Geographic restrictions

## Solution: ALWAYS MERGE, NEVER OVERWRITE

The `fetch-google-reviews.js` script is designed to **merge** new reviews with existing ones:

1. Loads existing reviews from `src/data/google-reviews.json`
2. Fetches reviews from API
3. Merges: existing reviews + new reviews (newer data wins for duplicates)
4. Preserves reviews that API no longer returns
5. Saves merged result

### Merge Output Example:
```
📊 Merge stats:
  Existing reviews: 55
  New from API: 49
  New reviews added: 1
  Reviews updated: 49
  Reviews preserved (not in API): 6
  Total after merge: 56
```

## Usage

```bash
# Normal fetch (merges automatically)
node scripts/fetch-google-reviews.js

# List locations (if needed)
node scripts/fetch-google-reviews.js --list-locations
```

## Recovery: If Reviews Were Lost

If someone accidentally overwrote the reviews file without merging:

1. Find the last good commit:
   ```bash
   git log --oneline -- src/data/google-reviews.json
   ```

2. Extract reviews from that commit:
   ```bash
   git show <commit>:src/data/google-reviews.json > /tmp/old_reviews.json
   ```

3. Merge manually:
   ```javascript
   const fs = require('fs');
   const old = require('/tmp/old_reviews.json');
   const current = require('./src/data/google-reviews.json');
   
   const map = new Map();
   old.reviews.forEach(r => map.set(r.googleReviewId, r));
   current.reviews.forEach(r => map.set(r.googleReviewId, r));
   
   const merged = Array.from(map.values());
   merged.sort((a, b) => new Date(b.createTime) - new Date(a.createTime));
   merged.forEach((r, i) => r.tid = i);
   
   const result = { ...current, reviews: merged, totalReviewCount: merged.length, reviewsInFile: merged.length };
   fs.writeFileSync('./src/data/google-reviews.json', JSON.stringify(result, null, 2));
   console.log('Merged:', merged.length, 'reviews');
   ```

## OAuth Token Setup

### Making Tokens Permanent

By default, Google Cloud apps in "Testing" mode have refresh tokens that expire after 7 days.

**To make tokens permanent:**

1. Go to: https://console.cloud.google.com/auth/audience
2. Select your project (Bern Hypnose)
3. Change "État de la publication" from "Test" to "En production"
4. Click "Publier l'application" → Confirm

### Generating a New Refresh Token

1. Go to: https://developers.google.com/oauthplayground
2. Click gear icon (⚙️) → Check "Use your own OAuth credentials"
3. Enter:
   - Client ID: (from .env)
   - Client Secret: (from .env)
4. In Step 1, enter scope: `https://www.googleapis.com/auth/business.manage`
5. Click "Authorize APIs" → Select account → Allow
6. In Step 2, click "Exchange authorization code for tokens"
7. Copy the **Refresh token**
8. Update `.env` file with new `GOOGLE_REFRESH_TOKEN`
9. Update GitHub Secrets if using CI/CD

## Files

- `scripts/fetch-google-reviews.js` - Main fetch script (with merge logic)
- `src/data/google-reviews.json` - Reviews data file
- `.env` - OAuth credentials (gitignored)

## Last Updated

2026-02-20
