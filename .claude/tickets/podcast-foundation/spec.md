# Spec: podcast-foundation — Podcast hosting, collection & episode pages

**Status:** APPROVED (phases 1–3; phase 4 waits on Q1, Q2, Q4, Q5)
**Author:** Sylvain Aerni (with Claude)
**Created:** 2026-11-13
**Last Updated:** 2026-11-13
**Stack:** Astro 5.18 (static output, `trailingSlash: 'always'`), Svelte 5, Tailwind 3, Decap CMS (git-gateway), Netlify (build + functions), npm. No test framework, no linter script in `package.json`.

---

## Summary

Janine will record a short (3–4 min) motivational audio message every week, in Mundart (Bärndütsch), for her small community of listeners. This spec covers the **foundation** only: hosting the audio on Cloudflare R2 instead of git, served through a small Worker and proxied by Netlify at `https://bern-hypnose.ch/podcast-audio/`, a `podcast` content collection, a `/podcast/` list page, a `/podcast/<slug>/` page per episode, a lightweight Svelte audio player and `PodcastEpisode` structured data. Each episode page carries a short Hochdeutsch text (not a verbatim transcript). The tone is community, not marketing: no hard `/termin/` call to action.

Later phases, each with its own spec: `/publish-podcast` Claude Code skill, the recording PWA for Janine + ntfy notification, the homepage "Neuste Folge anhören" block.

---

## Current State

### Audit Findings

| # | Finding | Severity | Evidence | Implication |
|---|---------|----------|----------|-------------|
| 1 | Git repo is already heavy, and audio is already committed to it | HIGH | `.git` = 281 MB; `public/audio/` = 61 MB, 13 MP3s | Episode audio must live outside git (R2). Do not add podcast MP3s to `public/`. |
| 2 | Content collections use glob loaders + Zod schemas | LOW | `src/content.config.ts` (blog, pages, faq, tags) | Add `podcast` as a 5th collection following the same pattern. |
| 3 | Catch-all route serves the `pages` collection at root | MEDIUM | `src/pages/[...slug].astro:9-16` | A static `src/pages/podcast/` route wins over the catch-all; no `pages` entry named `podcast` exists today (`ls src/content/pages`), so no collision — must stay that way. |
| 4 | Blog post page builds its JSON-LD inline and passes `schema="none"` to the layout | LOW | `src/pages/blog/[slug].astro:48-91,94-95` | Episode page follows the same pattern, reusing the Person `@id` `https://bern-hypnose.ch/janine-aerni/#person` and Organization `@id`. |
| 5 | Blog list uses `paginate()` with `siteConfig.postsPerPage` | LOW | `src/pages/blog/[...page].astro:13-18` | 30–50 episodes/year: a single unpaginated `/podcast/` page is enough for year 1. |
| 6 | Existing `AudioPlayer.svelte` is coupled to the self-hypnosis app | MEDIUM | `src/app/AudioPlayer.svelte` (308 lines; imports `./store.js`, NoSleep, ambient player, legacy `$:` syntax) | Not reusable. Write a new small player component (Svelte 5 runes). |
| 7 | PWA service worker caches `.mp3` CacheFirst but is scoped to `/app/start/` | LOW | `astro.config.mjs` AstroPWA `scope: '/app/start/'`, `runtimeCaching` `/\.(mp3|wav)$/` | No interference with `/podcast/` pages or cross-origin R2 audio. |
| 8 | CSP only sets `frame-ancestors`; no `media-src` restriction | LOW | `netlify.toml:61` | Audio is same-origin via the `/podcast-audio/` proxy anyway; no header changes needed. |
| 9 | `BaseHead` supports `noindex`, `pageType`, `schema` props | LOW | `src/components/BaseHead.astro:11-21` | Episode pages can be noindexed during the test period if needed (see open question Q1). |
| 10 | Sitemap auto-includes every static page except listed exclusions | LOW | `astro.config.mjs` sitemap `filter` | `/podcast/*` will be included automatically. Nothing to add. |
| 11 | Main navigation has two Blog entries (desktop/mobile) | LOW | `src/data/site-config.ts:257,296` | Nav entry for "Podcast" is a one-line addition each; decided in Q2. |

### Affected Files

**New**
- `src/content/podcast/*.md` — episode entries (1 seed episode for testing)
- `src/components/PodcastPlayer.svelte` — audio player
- `src/pages/podcast/index.astro` — list page
- `src/pages/podcast/[slug].astro` — episode page

**Modified**
- `src/content.config.ts` — add `podcast` collection
- `src/data/site-config.ts` — nav entry (only if Q2 = yes)

**Infrastructure**
- `workers/podcast-audio/` — Worker serving `episodes/*.mp3` from R2 (GET/HEAD, range, conditional requests), deployed on `workers.dev`
- `netlify.toml` — 200 rewrite `/podcast-audio/*` → the Worker
- Cloudflare: R2 bucket `bern-hypnose-podcast` (private, no `r2.dev` access). DNS stays on Netlify.

### Test Coverage

- Existing tests: none (no test runner in `package.json`).
- Gaps: everything. Verification relies on `npm run build`, built-HTML inspection and browser checks (see Test Strategy).

---

## Objectives

1. Host episode audio outside git, on a domain we own, at zero cost for expected volume.
2. Give every episode a stable, shareable page on bern-hypnose.ch with a player and a short Hochdeutsch text.
3. Define a content model the later `/publish-podcast` skill can write to without further schema changes.

---

## Acceptance Criteria

**Infrastructure**
- [ ] `https://bern-hypnose.ch/podcast-audio/<file>.mp3` returns `200` with `Content-Type: audio/mpeg` and `Accept-Ranges: bytes` (through the Netlify proxy, not only on `workers.dev`)
- [ ] A `Range: bytes=0-1023` request on the same URL returns `206 Partial Content` with `Content-Range: bytes 0-1023/<size>`
- [ ] `GET https://bern-hypnose.ch/podcast-audio/` returns `404` (no listing)
- [ ] Objects under `inbox/` cannot be fetched through the Worker (only `episodes/<name>.mp3` keys are served); the bucket has no public `r2.dev` access

**Content model**
- [ ] `src/content.config.ts` exports a `podcast` collection with fields: `title` (string), `publishDate` (date), `summary` (string, used as meta description), `audioUrl` (URL starting with `https://bern-hypnose.ch/podcast-audio/`), `duration` (seconds, integer > 0), `fileSize` (bytes, integer > 0), `episode` (integer ≥ 1), `draft` (boolean, default `false`), optional `image` {src, alt}
- [ ] An entry with `audioUrl` on another host fails `npm run build` (Zod validation)
- [ ] Entries with `draft: true` produce no page and do not appear in the list

**Pages**
- [ ] `/podcast/` lists all non-draft episodes, newest first, each with title, date, duration (mm:ss) and a playable player
- [ ] `/podcast/<slug>/` renders title, date, duration, player, and the Markdown body (Hochdeutsch text)
- [ ] Episode page has a self-referencing canonical with trailing slash
- [ ] Episode page JSON-LD validates as `PodcastEpisode` with `associatedMedia` (`MediaObject`, `contentUrl`, `encodingFormat: audio/mpeg`, `duration` ISO 8601), `partOfSeries` (`PodcastSeries` `@id` `https://bern-hypnose.ch/podcast/#series`), `author` → Janine's Person `@id`, `inLanguage: de-CH` (Rich Results Test / validator.schema.org: 0 errors)
- [ ] `/podcast/` JSON-LD declares the `PodcastSeries` with the same `@id`
- [ ] No page under `/podcast/` contains a link or button to `/termin/` in the main content (footer/nav excepted)
- [ ] `/podcast/` and episode pages appear in `dist/sitemap-*.xml` (unless Q1 decides noindex)

**Player**
- [ ] Plays, pauses and seeks the episode on iOS Safari (old iPhone available for testing), desktop Chrome and Firefox
- [ ] Uses `preload="none"` — no audio bytes are downloaded until the user presses play (verified in the Network panel)
- [ ] Starting one player pauses any other playing player on the list page
- [ ] Keyboard operable (Tab to the button, Space/Enter toggles); button has an accessible name ("Abspielen" / "Pause") and the progress bar is a labelled range input
- [ ] Without JavaScript, a native `<audio controls>` fallback is still playable

**Regression**
- [ ] `npm run build` succeeds
- [ ] `/blog/`, a blog post, a `pages` entry served by `[...slug].astro`, and `/app/start/` still render and behave as before
- [ ] No new MP3 files under `public/` or `src/` (`git diff --stat` shows no `.mp3`/`.m4a`)

---

## Scope

### In Scope

- Cloudflare R2 bucket, serving Worker, Netlify proxy rule, folder convention (`inbox/`, `episodes/`)
- `podcast` content collection + one seed episode (test recording) to validate the chain
- `/podcast/` list page, `/podcast/<slug>/` episode page
- `PodcastPlayer.svelte`
- `PodcastSeries` / `PodcastEpisode` JSON-LD
- Optional nav entry (pending Q2)

### Out of Scope

- `/publish-podcast` skill (transcription, loudness normalization, upload, commit) — next spec
- Recording PWA for Janine, R2 upload function, ntfy notification — later spec
- Homepage "Neuste Folge anhören" block — later spec, separate change per [SEO change caution]
- Podcast RSS feed / Apple–Spotify distribution — decided against (site only)
- Decap CMS collection for podcast — episodes will be written by the skill
- Adding episodes to `llms.txt`, `search-index.json`, `rss.xml` — follow-up once there are real episodes
- Migrating the existing `public/audio/` self-hypnosis files to R2

---

## Technical Approach

### Approach Summary

Audio lives in a private Cloudflare R2 bucket, served by a Worker and proxied by Netlify at `/podcast-audio/`; the site only stores Markdown entries that point to it. Pages are generated statically from a new `podcast` collection, mirroring the blog's patterns (inline JSON-LD, `BaseLayout` with `schema="none"`). A new self-contained Svelte 5 player hydrates with `client:visible`, over a native `<audio>` fallback.

### Key Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Audio storage | Cloudflare R2, private bucket, Worker on `workers.dev`, Netlify 200 rewrite at `/podcast-audio/*` | 10 GB free, no egress fees; keeps audio out of git (finding 1). DNS stays on Netlify (R4). Stored URLs are on our own domain, so the backend can change later without touching content. `r2.dev` is rate-limited and not for production. |
| File format | MP3, mono, 96 kbps, loudness-normalized (−16 LUFS) | Universal playback incl. old iOS; ~3 MB per 4-min episode. Encoding happens in the publish skill (next spec); this spec only requires `audio/mpeg`. |
| Bucket layout | One private bucket; `inbox/` (raw uploads) and `episodes/` (published) | The Worker only maps `/<name>.mp3` → `episodes/<name>.mp3`, so `inbox/` is never reachable. |
| Episode URL | `/podcast/<slug>/`, slug from filename (e.g. `2026-11-20-mut-zum-ersten-schritt`) | Consistent with `/blog/<id>/`; date prefix keeps files sorted. |
| Text on page | Short Hochdeutsch text in the Markdown body, not a verbatim transcript | Mundart transcription is unreliable; Janine validates the text. |
| Player | New `PodcastPlayer.svelte`, Svelte 5 runes, `client:visible`, `preload="none"` | Existing player is app-coupled (finding 6); lazy hydration and no preload keep the list page light. |
| Pagination | None for year 1 | ≤ 50 episodes; revisit later. |
| CTA | None to `/termin/` in content | Community tone, explicit user decision. |

### Phased Breakdown

1. **R2 infrastructure** — bucket, Worker deploy, Netlify rewrite, upload one test MP3 by hand, verify the infrastructure acceptance criteria with `curl`.
2. **Content model** — `podcast` collection + seed entry pointing at the test MP3; `npm run build` passes and invalid entries fail.
3. **Player** — `PodcastPlayer.svelte` in isolation on the episode page.
4. **Pages + schema** — list page, episode page, JSON-LD, optional nav; full acceptance pass.

### Affected Layers

- Infrastructure: Cloudflare R2 + DNS
- Content: `src/content.config.ts`, `src/content/podcast/`
- Routing/pages: `src/pages/podcast/`
- UI: `src/components/PodcastPlayer.svelte`
- Config: `src/data/site-config.ts` (optional)

---

## Test Strategy

No test runner exists; adding one for four files is not justified. Verification is build + inspection + browser.

| # | Check | Type | What It Verifies | Priority |
|---|-------|------|-----------------|----------|
| 1 | `curl -I` and `curl -r 0-1023` on the R2 URL | infra | Content-Type, range support, no listing | CRITICAL |
| 2 | `npm run build` with a valid and an invalid seed entry | build | Zod schema, draft filtering | CRITICAL |
| 3 | Inspect `dist/podcast/**/index.html` | static | Canonical, JSON-LD, no `/termin/` link, `preload="none"` | HIGH |
| 4 | Schema validator on the episode JSON-LD | manual | `PodcastEpisode` validity | HIGH |
| 5 | Play/pause/seek on old iPhone Safari + desktop Chrome/Firefox (`npm run preview`) | e2e (manual / Playwright MCP) | Player works where Janine's audience listens | CRITICAL |
| 6 | Network panel on `/podcast/` before pressing play | e2e | No audio bytes preloaded | MEDIUM |
| 7 | Regression walk: `/blog/`, one post, one `pages` entry, `/app/start/` | e2e | Nothing else broke | HIGH |

---

## Risks & Mitigation

| ID | Risk | Severity | Likelihood | Mitigation |
|----|------|----------|------------|------------|
| R1 | Raw recordings in `inbox/` become publicly reachable | HIGH | LOW | Bucket stays private; Worker builds keys as `episodes/` + a strict `^[a-z0-9-]+\.mp3$` filename; acceptance criterion checks it. |
| R2 | Thin-content signal: short Hochdeutsch texts on many indexable pages | MEDIUM | MEDIUM | Aim for 150–300 words per episode; decide Q1 (index from start vs. noindex during test). Additive change, no existing page touched. |
| R3 | Seeking fails on iOS Safari if the Netlify proxy drops `Range` or rewrites `206` | MEDIUM | LOW | Worker implements range; acceptance criterion tests the proxied URL, plus a device test on the old iPhone. |
| R8 | Proxied audio counts against Netlify bandwidth | LOW | LOW | ~3 MB per listen; 1,000 listens/month ≈ 3 GB. Fallback: point `audioUrl` straight at `workers.dev`. |
| R4 | R2 custom domains require the zone `bern-hypnose.ch` to be on Cloudflare DNS — **it is not**: `dig NS bern-hypnose.ch` → `dns1-4.p06.nsone.net` (Netlify DNS, checked 2026-11-13) | HIGH | CERTAIN | Options: (a) move the whole zone to Cloudflare — touches the live site and email records, against the one-change-at-a-time rule; (b) **recommended:** a small Worker on `workers.dev` bound to the bucket (range support, 100k req/day free), proxied by Netlify as `https://bern-hypnose.ch/podcast-audio/*` (status 200 rewrite) so stored URLs stay on our domain and remain portable; (c) Bunny.net storage + pull zone (CNAME works with any DNS, ~1 USD/month). **Decided: (b).** |
| R5 | R2 free tier exceeded | LOW | LOW | ~3 MB × 50/year ≈ 150 MB vs 10 GB free; egress free. Set a Cloudflare billing alert. |
| R6 | Catch-all route collision if someone creates a `pages` entry named `podcast` | LOW | LOW | Static route takes precedence; note in CLAUDE.md. |
| R7 | Decap Netlify Identity (git-gateway) deprecation | LOW | — | Not touched by this spec; podcast does not depend on Decap. |

---

## Known Issues (Out of Scope)

| # | Issue | Why Deferred | Tracked In |
|---|-------|--------------|------------|
| 1 | `public/audio/` holds 61 MB of MP3s in git | Belongs to the self-hypnosis app; migration is a separate decision | new ticket needed |
| 2 | Blog page duplicates schema-building helpers (`toISO8601WithOffset`) that the episode page will need | Extracting a shared util touches the blog page (regression surface) | Consider in PLAN; do not refactor blog in this ticket |
| 3 | No test runner or lint script in the project | Project-wide decision | new ticket needed |

---

## Open Questions

| # | Question | Blocks |
|---|----------|--------|
| Q1 | Index episode pages from the first episode, or `noindex` during the 2–3 week test and index afterwards? | Phase 4 |
| Q2 | Add "Podcast" to the main navigation now, or keep it reachable only by link until there are ~4 episodes? | Phase 4 |
| Q3 | ~~Where to serve audio from~~ — **Decided 2026-11-13: option (b)**, Worker + Netlify proxy. | — |
| Q4 | Series name and short description (German) for the `PodcastSeries` and the `/podcast/` page heading | Phase 4 |
| Q5 | Cover image: one image for the whole series, or optional per episode? | Phase 4 |

---

## Research Sources

- Cloudflare R2 docs — public buckets, custom domains, CORS, pricing (10 GB free storage, zero egress): https://developers.cloudflare.com/r2/
- Schema.org `PodcastEpisode` / `PodcastSeries`: https://schema.org/PodcastEpisode
- Astro content collections (glob loader, Zod): https://docs.astro.build/en/guides/content-collections/
- Internal: `src/pages/blog/[slug].astro` (JSON-LD pattern), `src/content.config.ts`, `astro.config.mjs`, `netlify.toml`
- Memory: podcast decisions (site-only, Mundart, community tone), SEO change caution (one change at a time)
