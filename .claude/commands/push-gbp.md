---
description: Publish the next queued blog post to Google Business Profile
---
Publish the next queued blog post to Google Business Profile. The user invoking this command is the explicit go-ahead to publish, commit, and push.

1. Run `node scripts/schedule-gbp-posts.js --next` from the repo root. This publishes `queue.posts[0]` to GBP, then shifts it off `src/data/gbp-post-queue.json` and appends it to `src/data/gbp-post-history.json`.
2. If the script exits non-zero (missing OAuth credentials, empty queue, or API error), stop and report it — do not commit.
3. On success the queue and history files changed on disk. Stage `src/data/gbp-post-queue.json` and `src/data/gbp-post-history.json`, commit as `Publish GBP post <title>`, and push to the current branch. **This step is required** — without it the queue state is lost and the same post republishes on the next run.
4. Report the published post's title and Post ID, and how many posts remain in the queue.
