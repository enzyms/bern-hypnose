---
description: Fetch new Google reviews and deploy (commit + push google-reviews.json)
---
Scan for new Google reviews and deploy them. The user invoking this command is the explicit go-ahead to commit and push.

1. Run `node scripts/fetch-google-reviews.js` from the repo root. It merges new reviews into `src/data/google-reviews.json` (merge-only, never overwrites).
2. If the script exits non-zero (e.g. missing Google OAuth credentials in `.env`, expired refresh token), stop and report the error — do not commit.
3. Check `git status --porcelain src/data/google-reviews.json`:
   - Nothing changed → report "No new reviews" and stop (no commit, no push).
   - Changed → stage **only** that file, commit as `Add new Google reviews`, and push to the current branch. Netlify redeploys on push to `main`.
4. Report the merge stats (new added / updated / preserved / total) and whether a deploy was triggered.
